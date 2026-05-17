import Decimal from 'decimal.js-light';
import type { ImmoInputs, SerializedInputs, ScenarioConfig } from '../types';
import { buildDefaultScenario } from '../defaults';

/**
 * Shared test fixture: a baseline rental property scenario.
 */
export const baselineScenario: ScenarioConfig = buildDefaultScenario({
  name: 'Baseline Test',
  purchase: {
    purchasePrice: 200_000,
    downPaymentPercent: 0.25,
    closingCostPercent: 0.03,
    renovationCost: 10_000,
  },
  loan: {
    principal: 150_000,
    annualRate: 0.06,
    termMonths: 360,
  },
  rental: {
    monthlyRent: 2_000,
    vacancyRate: 0.05,
    annualRentGrowth: 0.02,
  },
  expenses: {
    propertyTaxAnnual: 2_400,
    insuranceAnnual: 1_200,
    maintenancePercent: 0.05,
    managementPercent: 0.08,
    hoaMonthly: 0,
    otherMonthly: 25,
    annualExpenseGrowth: 0.02,
  },
  tax: {
    marginalRate: 0.22,
    depreciationYears: 27.5,
    capitalGainsRate: 0.15,
  },
  holdPeriodYears: 10,
  annualAppreciation: 0.03,
  sellingCostPercent: 0.06,
});

/**
 * Shared test fixture: an all-cash scenario (no loan).
 */
export const allCashScenario: ScenarioConfig = buildDefaultScenario({
  name: 'All Cash',
  purchase: {
    purchasePrice: 250_000,
    downPaymentPercent: 1.0,
    closingCostPercent: 0.03,
    renovationCost: 15_000,
  },
  loan: {
    principal: 0,
    annualRate: 0.06,
    termMonths: 360,
  },
  rental: {
    monthlyRent: 2_200,
    vacancyRate: 0.05,
    annualRentGrowth: 0.03,
  },
  expenses: {
    propertyTaxAnnual: 3_000,
    insuranceAnnual: 1_800,
    maintenancePercent: 0.05,
    managementPercent: 0.08,
    hoaMonthly: 0,
    otherMonthly: 50,
    annualExpenseGrowth: 0.02,
  },
  holdPeriodYears: 10,
  annualAppreciation: 0.03,
  sellingCostPercent: 0.06,
});

/**
 * Shared test fixture: a high-leverage scenario.
 */
export const highLeverageScenario: ScenarioConfig = buildDefaultScenario({
  name: 'High Leverage',
  purchase: {
    purchasePrice: 300_000,
    downPaymentPercent: 0.05,
    closingCostPercent: 0.03,
    renovationCost: 5_000,
  },
  loan: {
    principal: 285_000,
    annualRate: 0.07,
    termMonths: 360,
  },
  rental: {
    monthlyRent: 2_800,
    vacancyRate: 0.08,
    annualRentGrowth: 0.025,
  },
  expenses: {
    propertyTaxAnnual: 4_500,
    insuranceAnnual: 2_400,
    maintenancePercent: 0.06,
    managementPercent: 0.10,
    hoaMonthly: 150,
    otherMonthly: 75,
    annualExpenseGrowth: 0.03,
  },
  holdPeriodYears: 5,
  annualAppreciation: 0.04,
  sellingCostPercent: 0.06,
});

// ── Immo-specific fixtures ───────────────────────────────────────

function immo(
  overrides?: Partial<ImmoInputs>,
): ImmoInputs {
  const d = (v: string | number) => new Decimal(v);
  const base: ImmoInputs = {
    kaufpreis: d(250000),
    wohnflaecheQm: d(65),
    bundesland: 'BW',
    kaufnebenkostenModus: 'detailliert' as const,
    kaufnebenkostenSumme: undefined,
    grunderwerbsteuerSatz: d('0.05'),
    notarGrundbuchSatz: d('0.015'),
    maklerprovisionSatz: d('0.0357'),
    sanierungskostenSumme: d(0),
    sanierungWertanrechnungSatz: d('0.7'),
    eigenkapital: d(60000),
    finanziertePosten: new Set(['kaufpreis', 'kaufnebenkosten', 'sanierung'] as const),
    phase1Jahre: 10,
    phase1Sollzins: d('0.04'),
    phase1AnfTilgung: d('0.02'),
    phase1Sondertilgung: d(0),
    phase2Jahre: 10,
    phase2Sollzins: d('0.045'),
    phase2AnfTilgung: d('0.025'),
    phase2Sondertilgung: d(0),
    phase3Sollzins: d('0.05'),
    phase3AnfTilgung: d('0.03'),
    phase3Sondertilgung: d(0),
    tilgungsplanMaxJahre: 40,
    monatsnettokaltmiete: d(1050),
    mietsteigerungSatz: d('0.015'),
    kostenModus: 'detailliert' as const,
    nichtUmlagefaehigeKostenSumme: undefined,
    hausgeldNichtUmlagefaehigPa: d(0),
    verwaltungskostenPa: d(0),
    versicherungenPa: d(0),
    sonstigeKostenPa: d(0),
    instandhaltungskostenPa: d(600),
    kostensteigerungSatz: d('0.02'),
    leerstandsmonateProJahr: d('0.5'),
    erstvermietungsleerstandMonate: d(0),
    mietausfallwagnisSatz: d('0.02'),
    steuerModulAktiv: false,
    persoenlicherSteuersatz: undefined,
    gebaeudeanteilSatz: undefined,
    afaSatz: undefined,
    betrachtungszeitraumJahre: 10,
    wertsteigerungSatz: d('0.01'),
    bausparvertragMonatlich: undefined,
  };
  if (!overrides) return base;
  return { ...base, ...overrides, finanziertePosten: overrides.finanziertePosten ?? base.finanziertePosten };
}

type Fixture = {
  id: string;
  inputs: ImmoInputs;
  serialized?: SerializedInputs;
};

export const FIXTURES: Fixture[] = [
  {
    id: 'STANDARD_BW',
    inputs: immo(),
  },
  {
    id: 'OHNE_FK',
    inputs: immo({ eigenkapital: d(300000), finanziertePosten: new Set(['kaufpreis'] as const) }),
  },
  {
    id: 'HOHE_TILGUNG',
    inputs: immo({ phase1AnfTilgung: d('0.05') }),
  },
  {
    id: 'LEERSTANDSWUNDE',
    inputs: immo({ leerstandsmonateProJahr: d(3), erstvermietungsleerstandMonate: d(6) }),
  },
  {
    id: 'STEUER_AKTIV',
    inputs: immo({
      steuerModulAktiv: true,
      persoenlicherSteuersatz: d('0.42'),
      gebaeudeanteilSatz: d('0.8'),
      afaSatz: d('0.02'),
    }),
  },
  {
    id: 'STEUER_AKTIV_SERIALIZED',
    inputs: immo({
      steuerModulAktiv: true,
      persoenlicherSteuersatz: d('0.42'),
      gebaeudeanteilSatz: d('0.8'),
      afaSatz: d('0.02'),
    }),
    serialized: {
      kaufpreis: '250000',
      wohnflaecheQm: '65',
      bundesland: 'BW',
      kaufnebenkostenModus: 'detailliert',
      grunderwerbsteuerSatz: '0.05',
      notarGrundbuchSatz: '0.015',
      maklerprovisionSatz: '0.0357',
      sanierungskostenSumme: '0',
      sanierungWertanrechnungSatz: '0.7',
      eigenkapital: '60000',
      finanziertePosten: ['kaufpreis', 'kaufnebenkosten', 'sanierung'],
      phase1Jahre: 10,
      phase1Sollzins: '0.04',
      phase1AnfTilgung: '0.02',
      phase1Sondertilgung: '0',
      phase2Jahre: 10,
      phase2Sollzins: '0.045',
      phase2AnfTilgung: '0.025',
      phase2Sondertilgung: '0',
      phase3Sollzins: '0.05',
      phase3AnfTilgung: '0.03',
      phase3Sondertilgung: '0',
      tilgungsplanMaxJahre: 40,
      monatsnettokaltmiete: '1050',
      mietsteigerungSatz: '0.015',
      kostenModus: 'detailliert',
      hausgeldNichtUmlagefaehigPa: '0',
      verwaltungskostenPa: '0',
      versicherungenPa: '0',
      sonstigeKostenPa: '0',
      instandhaltungskostenPa: '600',
      kostensteigerungSatz: '0.02',
      leerstandsmonateProJahr: '0.5',
      erstvermietungsleerstandMonate: '0',
      mietausfallwagnisSatz: '0.02',
      steuerModulAktiv: true,
      persoenlicherSteuersatz: '0.42',
      gebaeudeanteilSatz: '0.8',
      afaSatz: '0.02',
      betrachtungszeitraumJahre: 10,
      wertsteigerungSatz: '0.01',
    } as SerializedInputs,
  },
];

function d(v: string | number): Decimal {
  return new Decimal(v);
}

export { d, immo };
