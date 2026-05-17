import Decimal from 'decimal.js-light';
import type { ImmoInputs, ComputedResult } from './types';
import { computeAfaJaehrlich, computeSteuerlast, computeSteuerlicherUeberschuss, isSteuerModulAktivUndVollstaendig } from './tax';
import { createMarktwertReihe } from './valuation';
import { KPI_DEFINITIONS, computeKpiValue } from './kpis';

function computeKaufnebenkosten(inputs: ImmoInputs): Decimal {
  if (inputs.kaufnebenkostenModus === 'vereinfacht') {
    return inputs.kaufnebenkostenSumme ?? new Decimal(0);
  }
  const grew = inputs.kaufpreis.mul(inputs.grunderwerbsteuerSatz ?? 0);
  const notar = inputs.kaufpreis.mul(inputs.notarGrundbuchSatz ?? 0);
  const makler = inputs.kaufpreis.mul(inputs.maklerprovisionSatz ?? 0);
  return grew.plus(notar).plus(makler);
}

function computeFremdkapital(inputs: ImmoInputs, kaufnebenkostenSumme: Decimal): Decimal {
  const basis = new Decimal(0)
    .plus(inputs.finanziertePosten.has('kaufpreis') ? inputs.kaufpreis : 0)
    .plus(inputs.finanziertePosten.has('kaufnebenkosten') ? kaufnebenkostenSumme : 0)
    .plus(inputs.finanziertePosten.has('sanierung') ? inputs.sanierungskostenSumme : 0);
  const fk = basis.minus(inputs.eigenkapital);
  return fk.gt(0) ? fk : new Decimal(0);
}

function computeIntermediates(inputs: ImmoInputs) {
  const kaufnebenkostenSummeBerechnet = computeKaufnebenkosten(inputs);
  const gesamtkapitalbedarf = inputs.kaufpreis
    .plus(kaufnebenkostenSummeBerechnet)
    .plus(inputs.sanierungskostenSumme);
  const fremdkapital = computeFremdkapital(inputs, kaufnebenkostenSummeBerechnet);
  const jahresnettokaltmiete = inputs.monatsnettokaltmiete.mul(12);
  const leerstandsquote = inputs.leerstandsmonateProJahr.div(12);
  const effektiveJahresmiete = jahresnettokaltmiete
    .mul(new Decimal(1).minus(leerstandsquote))
    .mul(new Decimal(1).minus(inputs.mietausfallwagnisSatz));
  const nichtUmlagefaehigeKostenAggregiert =
    inputs.kostenModus === 'vereinfacht'
      ? (inputs.nichtUmlagefaehigeKostenSumme ?? new Decimal(0))
      : (inputs.hausgeldNichtUmlagefaehigPa ?? new Decimal(0))
          .plus(inputs.verwaltungskostenPa ?? 0)
          .plus(inputs.versicherungenPa ?? 0)
          .plus(inputs.sonstigeKostenPa ?? 0);
  const bewirtschaftungskosten = nichtUmlagefaehigeKostenAggregiert
    .plus(inputs.instandhaltungskostenPa);
  const jahresreinertragJahr1 = effektiveJahresmiete.minus(bewirtschaftungskosten);
  const afaJaehrlich = computeAfaJaehrlich(inputs);

  return {
    kaufnebenkostenSummeBerechnet,
    gesamtkapitalbedarf,
    fremdkapital,
    jahresnettokaltmiete,
    leerstandsquote,
    effektiveJahresmiete,
    nichtUmlagefaehigeKostenAggregiert,
    bewirtschaftungskosten,
    jahresreinertragJahr1,
    afaJaehrlich,
  };
}

function computeAmortizationPlan(inputs: ImmoInputs, fremdkapital: Decimal) {
  if (fremdkapital.lte(0)) {
    return { rows: [], volltilgungErreicht: true, volltilgungJahr: 0, abgeschnittenAnMaxJahren: false };
  }

  const phases: { phase: 1 | 2 | 3; jahre: number; zins: Decimal; anfTilgung: Decimal; sondertilgung: Decimal }[] = [
    { phase: 1 as const, jahre: inputs.phase1Jahre, zins: inputs.phase1Sollzins, anfTilgung: inputs.phase1AnfTilgung, sondertilgung: inputs.phase1Sondertilgung },
  ];
  if (inputs.phase2Jahre > 0) {
    phases.push({ phase: 2 as const, jahre: inputs.phase2Jahre, zins: inputs.phase2Sollzins!, anfTilgung: inputs.phase2AnfTilgung!, sondertilgung: inputs.phase2Sondertilgung });
  }
  phases.push({ phase: 3 as const, jahre: Infinity, zins: inputs.phase3Sollzins, anfTilgung: inputs.phase3AnfTilgung, sondertilgung: inputs.phase3Sondertilgung });

  const rows: {
    jahr: number; phase: 1 | 2 | 3; restschuldAnfang: Decimal;
    zinsAnteil: Decimal; tilgungAnteil: Decimal; sondertilgung: Decimal;
    kapitaldienst: Decimal; restschuldEnde: Decimal;
  }[] = [];
  let restschuld = fremdkapital;
  let jahr = 0;

  for (const phase of phases) {
    if (restschuld.lte(0)) break;
    const annuitaetJahr = restschuld.mul(phase.zins.plus(phase.anfTilgung));
    const annuitaetMonat = annuitaetJahr.div(12);
    const zinsMonat = phase.zins.div(12);

    for (let phasenJahr = 0; phasenJahr < phase.jahre; phasenJahr++) {
      if (restschuld.lte(0)) break;
      if (jahr >= inputs.tilgungsplanMaxJahre) break;
      jahr++;
      const restschuldAnfang = restschuld;
      let zinsSummeJahr = new Decimal(0);
      let tilgungSummeJahr = new Decimal(0);
      let r = restschuld;

      for (let m = 0; m < 12; m++) {
        if (r.lte(0)) break;
        const zinsM = r.mul(zinsMonat);
        let tilgungM = annuitaetMonat.minus(zinsM);
        if (tilgungM.gt(r)) tilgungM = r;
        zinsSummeJahr = zinsSummeJahr.plus(zinsM);
        tilgungSummeJahr = tilgungSummeJahr.plus(tilgungM);
        r = r.minus(tilgungM);
      }

      let sondertilgung = phase.sondertilgung;
      if (sondertilgung.gt(r)) sondertilgung = r;
      r = r.minus(sondertilgung);

      rows.push({
        jahr,
        phase: phase.phase,
        restschuldAnfang,
        zinsAnteil: zinsSummeJahr,
        tilgungAnteil: tilgungSummeJahr,
        sondertilgung,
        kapitaldienst: zinsSummeJahr.plus(tilgungSummeJahr).plus(sondertilgung),
        restschuldEnde: r,
      });
      restschuld = r;
    }
  }

  const volltilgungErreicht = restschuld.lte(0);
  return {
    rows,
    volltilgungErreicht,
    volltilgungJahr: volltilgungErreicht ? jahr : undefined,
    abgeschnittenAnMaxJahren: !volltilgungErreicht && jahr >= inputs.tilgungsplanMaxJahre,
  };
}

function computeYearlyCashflows(inputs: ImmoInputs, intermediates: ReturnType<typeof computeIntermediates>, amortization: ReturnType<typeof computeAmortizationPlan>) {
  const cashflows: {
    jahr: number; jahresnettokaltmiete: Decimal; effektiveJahresmiete: Decimal;
    bewirtschaftungskosten: Decimal; jahresreinertrag: Decimal;
    zinsAnteil: Decimal; tilgungAnteil: Decimal; kapitaldienst: Decimal;
    cashflowVorSteuern: Decimal; afa: Decimal;
    steuerlicherUeberschuss: Decimal; steuerlast: Decimal; cashflowNachSteuern: Decimal;
  }[] = [];

  for (let t = 1; t <= inputs.betrachtungszeitraumJahre; t++) {
    const mietFaktor = new Decimal(1).plus(inputs.mietsteigerungSatz).pow(t - 1);
    const jahresnettokaltmiete = inputs.monatsnettokaltmiete.mul(12).mul(mietFaktor);

    const combinedLeerstand = inputs.leerstandsmonateProJahr.plus(inputs.erstvermietungsleerstandMonate);
    const effektivLeerstandMonate = t === 1
      ? (combinedLeerstand.gt(12) ? new Decimal(12) : combinedLeerstand)
      : inputs.leerstandsmonateProJahr;
    const effektivLeerstandsquote = effektivLeerstandMonate.div(12);
    const effektiveJahresmiete = jahresnettokaltmiete
      .mul(new Decimal(1).minus(effektivLeerstandsquote))
      .mul(new Decimal(1).minus(inputs.mietausfallwagnisSatz));

    const kostenFaktor = new Decimal(1).plus(inputs.kostensteigerungSatz).pow(t - 1);
    const bewirtschaftungskosten = intermediates.bewirtschaftungskosten.mul(kostenFaktor);

    const jahresreinertrag = effektiveJahresmiete.minus(bewirtschaftungskosten);

    const amortRow = amortization.rows[t - 1];
    const zinsAnteil = amortRow?.zinsAnteil ?? new Decimal(0);
    const tilgungAnteil = amortRow?.tilgungAnteil ?? new Decimal(0);
    const kapitaldienst = amortRow?.kapitaldienst ?? new Decimal(0);

    const bausparOutflow = (inputs.bausparvertragMonatlich ?? new Decimal(0)).mul(12);
    const cashflowVorSteuern = jahresreinertrag.minus(kapitaldienst).minus(bausparOutflow);

    let afa: Decimal;
    let steuerlicherUeberschuss: Decimal;
    let steuerlast: Decimal;
    let cashflowNachSteuern: Decimal;

    if (isSteuerModulAktivUndVollstaendig(inputs)) {
      afa = intermediates.afaJaehrlich;
      steuerlicherUeberschuss = computeSteuerlicherUeberschuss({
        inputs, jahresreinertrag, zinsAnteil,
      });
      steuerlast = computeSteuerlast(inputs, steuerlicherUeberschuss);
      cashflowNachSteuern = cashflowVorSteuern.minus(steuerlast);
    } else {
      afa = new Decimal(0);
      steuerlicherUeberschuss = new Decimal(0);
      steuerlast = new Decimal(0);
      cashflowNachSteuern = cashflowVorSteuern;
    }

    cashflows.push({
      jahr: t,
      jahresnettokaltmiete,
      effektiveJahresmiete,
      bewirtschaftungskosten,
      jahresreinertrag,
      zinsAnteil,
      tilgungAnteil,
      kapitaldienst,
      cashflowVorSteuern,
      afa,
      steuerlicherUeberschuss,
      steuerlast,
      cashflowNachSteuern,
    });
  }

  return cashflows;
}

function collectWarnings(inputs: ImmoInputs, intermediates: ReturnType<typeof computeIntermediates>, amortization: ReturnType<typeof computeAmortizationPlan>): string[] {
  const warnings: string[] = [];

  const finanzierungsbasis = new Decimal(0)
    .plus(inputs.finanziertePosten.has('kaufpreis') ? inputs.kaufpreis : 0)
    .plus(inputs.finanziertePosten.has('kaufnebenkosten') ? intermediates.kaufnebenkostenSummeBerechnet : 0)
    .plus(inputs.finanziertePosten.has('sanierung') ? inputs.sanierungskostenSumme : 0);
  if (inputs.eigenkapital.gt(finanzierungsbasis)) {
    const diff = inputs.eigenkapital.minus(finanzierungsbasis);
    warnings.push(`Ihr Eigenkapital übersteigt die finanzierte Basis um ${diff.toFixed(2)} €. Sie finanzieren das Objekt vollständig aus Eigenmitteln.`);
  }

  if (amortization.abgeschnittenAnMaxJahren) {
    warnings.push(`Bei den gewählten Konditionen wird das Darlehen innerhalb von ${inputs.tilgungsplanMaxJahre} Jahren nicht vollständig getilgt.`);
  }

  const instandProQm = inputs.instandhaltungskostenPa.div(inputs.wohnflaecheQm);
  if (instandProQm.lt(5) || instandProQm.gt(25)) {
    warnings.push('Plausibilitätshinweis: Übliche Spanne 7–15 €/m²/Jahr.');
  }

  return warnings;
}

function computeDecision(intermediates: ReturnType<typeof computeIntermediates>, cashflows: ReturnType<typeof computeYearlyCashflows>, kpis: ComputedResult['kpis']): ComputedResult['decision'] {
  const dscr = kpis.dscr?.value;
  const cfVorSteuernJ1 = cashflows[0]?.cashflowVorSteuern ?? new Decimal(0);

  const riskDrivers: string[] = [];
  if (dscr !== null && dscr !== undefined && dscr.lt(1)) {
    riskDrivers.push('DSCR < 1 – Mieteinnahmen decken Kapitaldienst nicht.');
  }
  if (dscr !== null && dscr !== undefined && dscr.gte(1) && dscr.lt(1.2)) {
    riskDrivers.push('DSCR < 1,2 – geringer Sicherheitsabstand.');
  }
  if (cfVorSteuernJ1.isNegative()) {
    riskDrivers.push(`Monatliche Zuzahlung: ${cfVorSteuernJ1.abs().div(12).toFixed(2)} €.`);
  }

  if (riskDrivers.length === 0) {
    return {
      ampel: 'green',
      summary: 'Die Kennzahlen sind im grünen Bereich. Das Investment erscheint solide.',
      riskDrivers: [],
    };
  }
  if (riskDrivers.length <= 1) {
    return {
      ampel: 'yellow',
      summary: 'Ein Risikotreiber wurde identifiziert. Bitte prüfen.',
      riskDrivers,
    };
  }
  return {
    ampel: 'red',
    summary: 'Mehrere Risikotreiber wurden identifiziert. Das Investment sollte kritisch geprüft werden.',
    riskDrivers,
  };
}

function computeScenarios(inputs: ImmoInputs, result: ComputedResult): ComputedResult['scenarios'] {
  const baseCF = result.cashflows[0];

  const makeScenario = (id: string, label: string, mietDelta: number, kostenDelta: number, zinsDelta: number) => {
    const mietFaktor = new Decimal(1).plus(mietDelta);
    const kostenFaktor = new Decimal(1).plus(kostenDelta);
    const zinsFaktor = new Decimal(1).plus(zinsDelta);

    const cfVorSteuern = baseCF.cashflowVorSteuern
      .plus(baseCF.effektiveJahresmiete.mul(mietFaktor.minus(1)))
      .minus(baseCF.bewirtschaftungskosten.mul(kostenFaktor.minus(1)));

    // Scenario JRE delta equals CF delta (kapitaldienst and bauspar are unchanged per scenario)
    const deltaJRE = cfVorSteuern.minus(baseCF.cashflowVorSteuern);
    const scenarioSteuerlast = isSteuerModulAktivUndVollstaendig(inputs)
      ? computeSteuerlast(inputs, baseCF.steuerlicherUeberschuss.plus(deltaJRE))
      : new Decimal(0);
    const cashflowNachSteuernJahr1 = cfVorSteuern.minus(scenarioSteuerlast);

    // Nettomietrendite: apply mietFaktor to effective rent (not NOI) to avoid double-counting costs
    const nettomiete = result.intermediates.effektiveJahresmiete
      .mul(mietFaktor)
      .minus(result.intermediates.bewirtschaftungskosten.mul(kostenFaktor))
      .div(result.intermediates.gesamtkapitalbedarf);

    return {
      id,
      label,
      assumptions: {
        mietDeltaPct: new Decimal(mietDelta).mul(100),
        bewirtschaftungskostenDeltaPct: new Decimal(kostenDelta).mul(100),
        anschlusszinsDeltaPct: new Decimal(zinsDelta).mul(100),
      },
      kpis: {
        cashflowVorSteuernJahr1: cfVorSteuern,
        nettomietrendite: nettomiete.mul(100),
        restschuldEndeBetrachtung: result.amortization.rows[result.amortization.rows.length - 1]?.restschuldEnde ?? new Decimal(0),
        cashflowNachSteuernJahr1,
      },
    };
  };

  return [
    makeScenario('konservativ', 'Konservativ', -0.05, 0.05, 0.01),
    makeScenario('realistisch', 'Realistisch', 0, 0, 0),
    makeScenario('optimistisch', 'Optimistisch', 0.05, -0.05, -0.01),
  ];
}

export function compute(inputs: ImmoInputs): ComputedResult {
  const intermediates = computeIntermediates(inputs);
  const amortization = computeAmortizationPlan(inputs, intermediates.fremdkapital);
  const cashflows = computeYearlyCashflows(inputs, intermediates, amortization);
  const marktwertReihe = createMarktwertReihe(inputs);
  const warnings = collectWarnings(inputs, intermediates, amortization);

  const kpis: Record<string, { metadata: { id: string; displayName: string; formel: string; bedeutung: string; eingaben: string[]; einheit: string; kategorie: string; format: string; decimals: number }; value: Decimal | null; warnings?: string[] }> = {};
  for (const def of KPI_DEFINITIONS) {
    kpis[def.id] = computeKpiValue(def, inputs, intermediates, amortization, cashflows, marktwertReihe);
  }

  const result: ComputedResult = { intermediates, amortization, cashflows, kpis: kpis as unknown as ComputedResult['kpis'], marktwertReihe, warnings, decision: { ampel: 'green', summary: '', riskDrivers: [] }, scenarios: [] };
  result.decision = computeDecision(intermediates, cashflows, result.kpis);
  result.scenarios = computeScenarios(inputs, result);

  return result as ComputedResult;
}

export { generateAmortizationSchedule, calculateMonthlyPayment, getRemainingBalance, totalInterest } from './amortization';
export { generateMonthlyCashflows, generateAnnualSummaries } from './cashflow';
export { runScenario, runScenarios, compareScenarios } from './scenario';
export { calculateKPIs } from './kpis';
export { serializeScenario, deserializeScenario, validateScenarioConfig } from './serialization';
export { buildDefaultScenario } from './defaults';
export * from './types';
