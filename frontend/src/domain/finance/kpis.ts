import type {
  ScenarioConfig,
  MonthlyCashflow,
  AnnualSummary,
  ScenarioKPIs,
} from './types';
import { getRemainingBalance } from './amortization';
import Decimal from 'decimal.js-light';
import type { ImmoInputs, KPIDefinition } from './types';

/**
 * Calculate key performance indicators for a scenario.
 */
export function calculateKPIs(
  config: ScenarioConfig,
  monthlyCashflows: MonthlyCashflow[],
  annualSummaries: AnnualSummary[],
): ScenarioKPIs {
  const { purchase, loan } = config;

  const downPayment = purchase.purchasePrice * purchase.downPaymentPercent;
  const closingCosts = purchase.purchasePrice * purchase.closingCostPercent;
  const totalCashInvested = downPayment + closingCosts + purchase.renovationCost;
  const loanAmount = purchase.purchasePrice - downPayment;

  const totalCashflow = monthlyCashflows.reduce((s, cf) => s + cf.cashflow, 0);

  // Terminal year values
  const lastSummary = annualSummaries[annualSummaries.length - 1];
  const sellingCosts = lastSummary.propertyValue * config.sellingCostPercent;
  const saleProceeds = lastSummary.propertyValue - lastSummary.loanBalance - sellingCosts;
  const totalProfit = totalCashflow + saleProceeds - totalCashInvested;
  const roi = totalCashInvested > 0 ? (totalProfit / totalCashInvested) * 100 : 0;

  // NOI from year 1
  const year1 = annualSummaries[0];
  const capRate =
    purchase.purchasePrice > 0
      ? (year1.netOperatingIncome / purchase.purchasePrice) * 100
      : 0;
  const cashOnCashReturn =
    totalCashInvested > 0 ? (year1.cashflow / totalCashInvested) * 100 : 0;

  // DSCR - Debt Service Coverage Ratio (year 1)
  const annualDebtService = year1.debtService;
  const dscr =
    annualDebtService > 0 ? year1.netOperatingIncome / annualDebtService : Infinity;

  // Gross Rent Multiplier
  const grossRentMultiplier =
    year1.grossRent > 0 ? purchase.purchasePrice / year1.grossRent : 0;

  // Break-even occupancy
  const totalYear1Expenses = year1.operatingExpenses + year1.debtService;
  const breakEvenOccupancy =
    year1.grossRent > 0 ? (totalYear1Expenses / year1.grossRent) * 100 : 100;

  // NPV using 8% discount rate
  const discountRate = 0.08;
  const npv = -totalCashInvested + calculateNPV(monthlyCashflows, discountRate, saleProceeds);

  // IRR approximation
  const irr = calculateIRR(totalCashInvested, monthlyCashflows, saleProceeds);

  return {
    capRate: roundHundredths(capRate),
    cashOnCashReturn: roundHundredths(cashOnCashReturn),
    totalCashInvested: roundCents(totalCashInvested),
    totalCashflow: roundCents(totalCashflow),
    totalProfit: roundCents(totalProfit),
    roi: roundHundredths(roi),
    netPresentValue: roundCents(npv),
    internalRateOfReturn: roundHundredths(irr),
    dscr: roundHundredths(dscr),
    grossRentMultiplier: roundHundredths(grossRentMultiplier),
    breakEvenOccupancy: roundHundredths(breakEvenOccupancy),
  };
}

/**
 * Calculate Net Present Value of monthly cashflows plus terminal sale.
 */
function calculateNPV(
  cashflows: MonthlyCashflow[],
  annualDiscountRate: number,
  saleProceeds: number,
): number {
  const monthlyDiscount = annualDiscountRate / 12;
  let npv = 0;

  for (const cf of cashflows) {
    npv += cf.cashflow / Math.pow(1 + monthlyDiscount, cf.month);
  }

  // Add discounted terminal sale
  const lastMonth = cashflows[cashflows.length - 1]?.month ?? 0;
  npv += saleProceeds / Math.pow(1 + monthlyDiscount, lastMonth);

  return npv;
}

/**
 * Calculate Internal Rate of Return using Newton's method.
 * Returns annualized IRR.
 */
function calculateIRR(
  initialInvestment: number,
  cashflows: MonthlyCashflow[],
  saleProceeds: number,
): number {
  // Build cashflow array: initial outflow + monthly + terminal sale
  const allCashflows = [-initialInvestment];
  for (const cf of cashflows) {
    allCashflows.push(cf.cashflow);
  }
  // Add sale proceeds to last month
  allCashflows[allCashflows.length - 1] += saleProceeds;

  // Newton's method to find monthly IRR
  let rate = 0.005; // initial guess: 0.5% monthly
  for (let i = 0; i < 200; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < allCashflows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      npv += allCashflows[t] / discountFactor;
      if (t > 0) {
        dnpv -= (t * allCashflows[t]) / (discountFactor * (1 + rate));
      }
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-10) {
      rate = newRate;
      break;
    }
    rate = newRate;
  }

  // Annualize the monthly rate
  return (Math.pow(1 + rate, 12) - 1) * 100;
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundHundredths(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Immo-specific KPI definitions ────────────────────────────────

export const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    id: 'bruttomietrendite',
    displayName: 'Bruttomietrendite',
    formel: 'Jahresnettokaltmiete / Kaufpreis × 100',
    bedeutung: 'Verhältnis Jahresnettokaltmiete zum Kaufpreis. Einfachster Renditeindikator.',
    eingaben: ['kaufpreis', 'monatsnettokaltmiete'],
  },
  {
    id: 'nettomietrendite',
    displayName: 'Nettomietrendite',
    formel: 'Jahresreinertrag (Jahr 1) / Gesamtkapitalbedarf × 100',
    bedeutung: 'Rendite auf Gesamtkapital (Kaufpreis + Nebenkosten + Sanierung). Realistischere Sicht als Bruttorendite.',
    eingaben: ['kaufpreis', 'monatsnettokaltmiete', 'kaufnebenkostenModus', 'sanierungskostenSumme'],
  },
  {
    id: 'kaufpreisfaktor',
    displayName: 'Kaufpreisfaktor',
    formel: 'Kaufpreis / Jahresnettokaltmiete',
    bedeutung: 'Klassischer Vervielfältiger: Wie viele Jahresmieten kostet der reine Kaufpreis?',
    eingaben: ['kaufpreis', 'monatsnettokaltmiete'],
  },
  {
    id: 'kaufpreisfaktorAllIn',
    displayName: 'Kaufpreisfaktor inkl. Nebenkosten',
    formel: 'Gesamtkapitalbedarf / Jahresnettokaltmiete',
    bedeutung: 'Vervielfältiger auf Gesamtkapitalbedarf (inkl. Nebenkosten und Sanierung).',
    eingaben: ['kaufpreis', 'monatsnettokaltmiete', 'kaufnebenkostenModus', 'sanierungskostenSumme'],
  },
  {
    id: 'cashflowVorSteuernJahr1',
    displayName: 'Cashflow vor Steuern Jahr 1',
    formel: 'Jahresreinertrag − Kapitaldienst Jahr 1 − Bausparvertrag',
    bedeutung: 'Liquiditätsüberschuss oder -defizit im ersten Jahr.',
    eingaben: ['jahresreinertrag', 'kapitaldienst', 'bausparvertragMonatlich'],
  },
  {
    id: 'cashflowVorSteuernJahr1Monatlich',
    displayName: 'Cashflow vor Steuern monatlich',
    formel: 'Cashflow vor Steuern Jahr 1 / 12',
    bedeutung: 'Monatlicher Liquiditätsüberschuss oder -defizit.',
    eingaben: ['cashflowVorSteuernJahr1'],
  },
  {
    id: 'monatlicheZuzahlung',
    displayName: 'Monatliche Zuzahlung',
    formel: 'max(0, -Cashflow vor Steuern monatlich)',
    bedeutung: 'Betrag, den der Anleger monatlich aus eigener Tasche zuschießen muss.',
    eingaben: ['cashflowVorSteuernJahr1'],
  },
  {
    id: 'cashflowNachSteuernJahr1',
    displayName: 'Cashflow nach Steuern Jahr 1',
    formel: 'Cashflow vor Steuern − Steuerlast',
    bedeutung: 'Cashflow nach Berücksichtigung der Steuerwirkung (optional).',
    eingaben: ['cashflowVorSteuernJahr1', 'steuerlastJahr1'],
  },
  {
    id: 'vermoegensaufbauProMonatJahr1',
    displayName: 'Vermögensaufbau pro Monat',
    formel: 'Tilgung Jahr 1 / 12',
    bedeutung: 'Monatlicher Vermögensaufbau durch Tilgung.',
    eingaben: ['tilgungAnteil'],
  },
  {
    id: 'dscr',
    displayName: 'DSCR',
    formel: 'Jahresreinertrag / Kapitaldienst Jahr 1',
    bedeutung: 'Debt Service Coverage Ratio. Werte < 1 bedeuten: Miete reicht nicht zur Bedienung der Bank.',
    eingaben: ['jahresreinertrag', 'kapitaldienst'],
  },
  {
    id: 'eigenkapitalrenditeCashflow',
    displayName: 'Eigenkapitalrendite (Cashflow)',
    formel: 'Cashflow vor Steuern Jahr 1 / Eigenkapital × 100',
    bedeutung: 'Reine Liquiditätssicht auf die Verzinsung des Eigenkapitals ohne Tilgung.',
    eingaben: ['cashflowVorSteuernJahr1', 'eigenkapital'],
  },
  {
    id: 'eigenkapitalrenditeMitTilgung',
    displayName: 'Eigenkapitalrendite (mit Tilgung)',
    formel: '(Cashflow vor Steuern Jahr 1 + Tilgung Jahr 1) / Eigenkapital × 100',
    bedeutung: 'Realistischere Sicht: inkludiert Tilgung als Vermögensaufbau.',
    eingaben: ['cashflowVorSteuernJahr1', 'tilgungAnteil', 'eigenkapital'],
  },
  {
    id: 'breakEvenMieteProQmLiquiditaet',
    displayName: 'Break-Even Liquidität',
    formel: '(Bewirtschaftungskosten + Kapitaldienst + Bausparvertrag) / (Wohnfläche × 12 × (1 − Leerstand) × (1 − Mietausfallwagnis))',
    bedeutung: 'Nötige Bruttokaltmiete pro m²/Monat für Liquiditätsneutralität (cashflow ≈ 0). Inkludiert Tilgung und Bausparvertrag. Berücksichtigt Leerstand und Mietausfallwagnis.',
    eingaben: ['bewirtschaftungskosten', 'kapitaldienst', 'bausparvertragMonatlich', 'wohnflaecheQm', 'leerstandsquote', 'mietausfallwagnisSatz'],
  },
  {
    id: 'breakEvenMieteProQmWirtschaftlich',
    displayName: 'Break-Even Wirtschaftlichkeit',
    formel: '(Bewirtschaftungskosten + Zins Jahr 1) / (Wohnfläche × 12 × (1 − Leerstand) × (1 − Mietausfallwagnis))',
    bedeutung: 'Nötige Bruttokaltmiete pro m²/Monat für wirtschaftlichen Nullpunkt (nur Zinskosten, ohne Tilgung). Berücksichtigt Leerstand und Mietausfallwagnis.',
    eingaben: ['bewirtschaftungskosten', 'zinsAnteil', 'wohnflaecheQm', 'leerstandsquote', 'mietausfallwagnisSatz'],
  },
  {
    id: 'kaufpreisProQm',
    displayName: 'Kaufpreis pro m²',
    formel: 'Kaufpreis / Wohnfläche',
    bedeutung: 'Durchschnittlicher Quadratmeterpreis.',
    eingaben: ['kaufpreis', 'wohnflaecheQm'],
  },
  {
    id: 'mieteProQm',
    displayName: 'Miete pro m²',
    formel: 'Monatsnettokaltmiete / Wohnfläche',
    bedeutung: 'Durchschnittliche Miete pro Quadratmeter.',
    eingaben: ['monatsnettokaltmiete', 'wohnflaecheQm'],
  },
  {
    id: 'instandhaltungProQm',
    displayName: 'Instandhaltung pro m²',
    formel: 'Instandhaltung p. a. / Wohnfläche',
    bedeutung: 'Instandhaltungsrücklage pro Quadratmeter. Übliche Spanne: 7–15 €/m²/Jahr.',
    eingaben: ['instandhaltungskostenPa', 'wohnflaecheQm'],
  },
  {
    id: 'restschuldNachPhase1',
    displayName: 'Restschuld nach Phase 1',
    formel: 'Aus Tilgungsplan – Restschuld am Ende von Phase 1',
    bedeutung: 'Verbleibende Darlehensschuld nach Ende der ersten Zinsbindung.',
    eingaben: ['phase1Jahre'],
  },
  {
    id: 'restschuldNachPhase2',
    displayName: 'Restschuld nach Phase 2',
    formel: 'Aus Tilgungsplan – Restschuld am Ende von Phase 2',
    bedeutung: 'Verbleibende Darlehensschuld nach Ende der zweiten Zinsbindung.',
    eingaben: ['phase2Jahre'],
  },
  {
    id: 'restschuldEndeBetrachtung',
    displayName: 'Restschuld Ende Betrachtung',
    formel: 'Aus Tilgungsplan – Restschuld am Ende des Betrachtungszeitraums',
    bedeutung: 'Darlehensschuld zu dem Zeitpunkt, zu dem der Anleger seine Bilanz zieht.',
    eingaben: ['betrachtungszeitraumJahre'],
  },
  {
    id: 'marktwertEndeBetrachtung',
    displayName: 'Marktwert Ende Betrachtung',
    formel: 'Kaufpreis × (1 + Wertsteigerung)^Betrachtungsjahre + Sanierung × Wertanrechnung',
    bedeutung: 'Prognostizierter Marktwert inklusive Wertanrechnung der Sanierung.',
    eingaben: ['kaufpreis', 'wertsteigerungSatz', 'betrachtungszeitraumJahre', 'sanierungskostenSumme', 'sanierungWertanrechnungSatz'],
  },
  {
    id: 'vermoegensbilanzEnde',
    displayName: 'Vermögensbilanz Ende',
    formel: 'Marktwert Ende − Restschuld Ende',
    bedeutung: 'Nettovermögen aus dem Investment am Ende des Betrachtungszeitraums (vor Steuern und Verkaufskosten).',
    eingaben: ['marktwertEndeBetrachtung', 'restschuldEndeBetrachtung'],
  },
  {
    id: 'afaJaehrlich',
    displayName: 'AfA jährlich',
    formel: 'Kaufpreis × Gebäudeanteil × AfA-Satz',
    bedeutung: 'Jährlicher Abschreibungsbetrag (Steuermodul).',
    eingaben: ['kaufpreis', 'gebaeudeanteilSatz', 'afaSatz'],
  },
  {
    id: 'steuerlicherUeberschussJahr1',
    displayName: 'Steuerlicher Überschuss Jahr 1',
    formel: 'Jahresreinertrag − Zinsanteil − AfA',
    bedeutung: 'Zu versteuerndes Einkommen aus der Vermietung (Steuermodul).',
    eingaben: ['jahresreinertrag', 'zinsAnteil', 'afaJaehrlich'],
  },
  {
    id: 'steuerlasterJahr1',
    displayName: 'Steuerlast Jahr 1',
    formel: 'Steuerlicher Überschuss × persönlicher Steuersatz',
    bedeutung: 'Steuerlast oder Steuerentlastung (negativ = Verlust verrechenbar).',
    eingaben: ['steuerlicherUeberschussJahr1', 'persoenlicherSteuersatz'],
  },
];

const KPI_METADATA = {
  bruttomietrendite: { id: 'bruttomietrendite', displayName: 'Bruttomietrendite', format: 'percent' as const, einheit: '%', kategorie: 'Schnellsicht', formel: 'Jahresnettokaltmiete / Kaufpreis × 100', bedeutung: 'Verhältnis Jahresnettokaltmiete zum Kaufpreis.', eingaben: ['kaufpreis', 'monatsnettokaltmiete'], decimals: 2 },
  nettomietrendite: { id: 'nettomietrendite', displayName: 'Nettomietrendite', format: 'percent' as const, einheit: '%', kategorie: 'Schnellsicht', formel: 'Jahresreinertrag / Gesamtkapitalbedarf × 100', bedeutung: 'Rendite auf Gesamtkapital.', eingaben: ['kaufpreis', 'monatsnettokaltmiete', 'kaufnebenkosten', 'sanierungskostenSumme'], decimals: 2 },
  kaufpreisfaktor: { id: 'kaufpreisfaktor', displayName: 'Kaufpreisfaktor', format: 'factor' as const, einheit: 'Faktor', kategorie: 'Schnellsicht', formel: 'Kaufpreis / Jahresnettokaltmiete', bedeutung: 'Vervielfältiger.', eingaben: ['kaufpreis', 'monatsnettokaltmiete'], decimals: 3 },
  kaufpreisfaktorAllIn: { id: 'kaufpreisfaktorAllIn', displayName: 'Kaufpreisfaktor All-In', format: 'factor' as const, einheit: 'Faktor', kategorie: 'Schnellsicht', formel: 'Gesamtkapitalbedarf / Jahresnettokaltmiete', bedeutung: 'Vervielfältiger auf Gesamtkapital.', eingaben: ['kaufpreis', 'monatsnettokaltmiete', 'kaufnebenkosten', 'sanierungskostenSumme'], decimals: 3 },
  cashflowVorSteuernJahr1: { id: 'cashflowVorSteuernJahr1', displayName: 'Cashflow vor Steuern Jahr 1', format: 'currency' as const, einheit: 'EUR/Jahr', kategorie: 'Cashflow', formel: 'Jahresreinertrag − Kapitaldienst − Bausparvertrag', bedeutung: 'Liquiditätsüberschuss/-defizit Jahr 1.', eingaben: ['jahresreinertrag', 'kapitaldienst', 'bausparvertragMonatlich'], decimals: 2 },
  cashflowVorSteuernJahr1Monatlich: { id: 'cashflowVorSteuernJahr1Monatlich', displayName: 'Cashflow monatlich', format: 'currency' as const, einheit: 'EUR/Monat', kategorie: 'Cashflow', formel: 'Cashflow vor Steuern Jahr 1 / 12', bedeutung: 'Monatliche Liquidität.', eingaben: ['cashflowVorSteuernJahr1'], decimals: 2 },
  monatlicheZuzahlung: { id: 'monatlicheZuzahlung', displayName: 'Monatliche Zuzahlung', format: 'currency' as const, einheit: 'EUR/Monat', kategorie: 'Cashflow', formel: 'max(0, -Cashflow monatlich)', bedeutung: 'Monatlicher Eigenanteil.', eingaben: ['cashflowVorSteuernJahr1'], decimals: 2 },
  cashflowNachSteuernJahr1: { id: 'cashflowNachSteuernJahr1', displayName: 'Cashflow nach Steuern', format: 'currency' as const, einheit: 'EUR/Jahr', kategorie: 'Cashflow', formel: 'Cashflow vor Steuern − Steuerlast', bedeutung: 'Nach Steuerwirkung.', eingaben: ['cashflowVorSteuernJahr1', 'steuerlastJahr1'], decimals: 2 },
  vermoegensaufbauProMonatJahr1: { id: 'vermoegensaufbauProMonatJahr1', displayName: 'Vermögensaufbau/Monat', format: 'currency' as const, einheit: 'EUR/Monat', kategorie: 'Cashflow', formel: 'Tilgung Jahr 1 / 12', bedeutung: 'Monatlicher Vermögensaufbau.', eingaben: ['tilgungAnteil'], decimals: 2 },
  dscr: { id: 'dscr', displayName: 'DSCR', format: 'factor' as const, einheit: 'Faktor', kategorie: 'Risiko', formel: 'Jahresreinertrag / Kapitaldienst', bedeutung: 'Debt Service Coverage Ratio.', eingaben: ['jahresreinertrag', 'kapitaldienst'], decimals: 2 },
  eigenkapitalrenditeCashflow: { id: 'eigenkapitalrenditeCashflow', displayName: 'EK-Rendite (Cashflow)', format: 'percent' as const, einheit: '%', kategorie: 'Rendite', formel: 'Cashflow vor Steuern / Eigenkapital × 100', bedeutung: 'Liquiditätssicht.', eingaben: ['cashflowVorSteuernJahr1', 'eigenkapital'], decimals: 2 },
  eigenkapitalrenditeMitTilgung: { id: 'eigenkapitalrenditeMitTilgung', displayName: 'EK-Rendite (mit Tilgung)', format: 'percent' as const, einheit: '%', kategorie: 'Rendite', formel: '(Cashflow + Tilgung) / Eigenkapital × 100', bedeutung: 'Inkl. Vermögensaufbau.', eingaben: ['cashflowVorSteuernJahr1', 'tilgungAnteil', 'eigenkapital'], decimals: 2 },
  breakEvenMieteProQmLiquiditaet: { id: 'breakEvenMieteProQmLiquiditaet', displayName: 'Break-Even Liquidität', format: 'currency' as const, einheit: 'EUR/m²/Monat', kategorie: 'Break-even', formel: '(Bewirtschaftung + Kapitaldienst + Bauspar) / (Wohnfläche × 12 × (1 − Leerstand) × (1 − Mietausfallwagnis))', bedeutung: 'Nötige Miete pro m² für cashflow = 0. Inkl. Tilgung und Bauspar.', eingaben: ['bewirtschaftungskosten', 'kapitaldienst', 'bausparvertragMonatlich', 'wohnflaecheQm', 'leerstandsquote', 'mietausfallwagnisSatz'], decimals: 2 },
  breakEvenMieteProQmWirtschaftlich: { id: 'breakEvenMieteProQmWirtschaftlich', displayName: 'Break-Even Wirtschaftlichkeit', format: 'currency' as const, einheit: 'EUR/m²/Monat', kategorie: 'Break-even', formel: '(Bewirtschaftung + Zins) / (Wohnfläche × 12 × (1 − Leerstand) × (1 − Mietausfallwagnis))', bedeutung: 'Nötige Miete pro m² für wirtschaftlichen Nullpunkt (nur Zins, ohne Tilgung).', eingaben: ['bewirtschaftungskosten', 'zinsAnteil', 'wohnflaecheQm', 'leerstandsquote', 'mietausfallwagnisSatz'], decimals: 2 },
  kaufpreisProQm: { id: 'kaufpreisProQm', displayName: 'Kaufpreis/m²', format: 'currency' as const, einheit: 'EUR/m²', kategorie: 'Markt', formel: 'Kaufpreis / Wohnfläche', bedeutung: 'Quadratmeterpreis.', eingaben: ['kaufpreis', 'wohnflaecheQm'], decimals: 2 },
  mieteProQm: { id: 'mieteProQm', displayName: 'Miete/m²', format: 'currency' as const, einheit: 'EUR/m²/Monat', kategorie: 'Markt', formel: 'Monatsmiete / Wohnfläche', bedeutung: 'Miete pro m².', eingaben: ['monatsnettokaltmiete', 'wohnflaecheQm'], decimals: 2 },
  instandhaltungProQm: { id: 'instandhaltungProQm', displayName: 'Instandhaltung/m²', format: 'currency' as const, einheit: 'EUR/m²/Jahr', kategorie: 'Markt', formel: 'Instandhaltung / Wohnfläche', bedeutung: 'Instandhaltungsrücklage pro m².', eingaben: ['instandhaltungskostenPa', 'wohnflaecheQm'], decimals: 2 },
  restschuldNachPhase1: { id: 'restschuldNachPhase1', displayName: 'Restschuld Phase 1', format: 'currency' as const, einheit: 'EUR', kategorie: 'Finanzierung', formel: 'Tilgungsplan', bedeutung: 'Restschuld nach Phase 1.', eingaben: ['phase1Jahre'], decimals: 2 },
  restschuldNachPhase2: { id: 'restschuldNachPhase2', displayName: 'Restschuld Phase 2', format: 'currency' as const, einheit: 'EUR', kategorie: 'Finanzierung', formel: 'Tilgungsplan', bedeutung: 'Restschuld nach Phase 2.', eingaben: ['phase2Jahre'], decimals: 2 },
  restschuldEndeBetrachtung: { id: 'restschuldEndeBetrachtung', displayName: 'Restschuld Ende', format: 'currency' as const, einheit: 'EUR', kategorie: 'Finanzierung', formel: 'Tilgungsplan', bedeutung: 'Restschuld am Ende.', eingaben: ['betrachtungszeitraumJahre'], decimals: 2 },
  marktwertEndeBetrachtung: { id: 'marktwertEndeBetrachtung', displayName: 'Marktwert Ende', format: 'currency' as const, einheit: 'EUR', kategorie: 'Wertentwicklung', formel: 'Startwert × (1 + Steigerung)^Jahre', bedeutung: 'Prognostizierter Marktwert.', eingaben: ['kaufpreis', 'wertsteigerungSatz', 'betrachtungszeitraumJahre'], decimals: 2 },
  vermoegensbilanzEnde: { id: 'vermoegensbilanzEnde', displayName: 'Vermögensbilanz Ende', format: 'currency' as const, einheit: 'EUR', kategorie: 'Wertentwicklung', formel: 'Marktwert − Restschuld', bedeutung: 'Nettovermögen.', eingaben: ['marktwertEndeBetrachtung', 'restschuldEndeBetrachtung'], decimals: 2 },
  afaJaehrlich: { id: 'afaJaehrlich', displayName: 'AfA jährlich', format: 'currency' as const, einheit: 'EUR/Jahr', kategorie: 'Steuer', formel: 'Kaufpreis × Gebäudeanteil × AfA-Satz', bedeutung: 'Abschreibung.', eingaben: ['kaufpreis', 'gebaeudeanteilSatz', 'afaSatz'], decimals: 2 },
  steuerlicherUeberschussJahr1: { id: 'steuerlicherUeberschussJahr1', displayName: 'Steuerl. Überschuss J. 1', format: 'currency' as const, einheit: 'EUR/Jahr', kategorie: 'Steuer', formel: 'JRE − Zins − AfA', bedeutung: 'Zu versteuerndes Einkommen.', eingaben: ['jahresreinertrag', 'zinsAnteil', 'afaJaehrlich'], decimals: 2 },
  steuerlasterJahr1: { id: 'steuerlasterJahr1', displayName: 'Steuerlast Jahr 1', format: 'currency' as const, einheit: 'EUR/Jahr', kategorie: 'Steuer', formel: 'Steuerl. Überschuss × Steuersatz', bedeutung: 'Steuerlast (negativ = Entlastung).', eingaben: ['steuerlicherUeberschussJahr1', 'persoenlicherSteuersatz'], decimals: 2 },
};

function decimalOrZero(value: Decimal | undefined): Decimal {
  return value ?? new Decimal(0);
}

function roundTo(value: Decimal, decimals: number): Decimal {
  const factor = new Decimal(10).pow(decimals);
  return value.mul(factor).toDecimalPlaces(0).div(factor);
}

type IntermediatesShape = {
  kaufnebenkostenSummeBerechnet: Decimal; gesamtkapitalbedarf: Decimal; fremdkapital: Decimal;
  jahresnettokaltmiete: Decimal; leerstandsquote: Decimal; effektiveJahresmiete: Decimal;
  nichtUmlagefaehigeKostenAggregiert: Decimal; bewirtschaftungskosten: Decimal;
  jahresreinertragJahr1: Decimal; afaJaehrlich: Decimal;
};
type AmortRow = { jahr: number; phase: number; restschuldAnfang: Decimal; zinsAnteil: Decimal; tilgungAnteil: Decimal; sondertilgung: Decimal; kapitaldienst: Decimal; restschuldEnde: Decimal };
type AmortShape = { rows: AmortRow[]; volltilgungErreicht: boolean; volltilgungJahr?: number; abgeschnittenAnMaxJahren: boolean };
type CfRow = { jahr: number; cashflowVorSteuern: Decimal; tilgungAnteil: Decimal; steuerlicherUeberschuss: Decimal; steuerlast: Decimal };

export function computeKpiValue(
  def: KPIDefinition,
  inputs: ImmoInputs,
  intermediates: IntermediatesShape,
  amortization: AmortShape,
  cashflows: CfRow[],
  marktwertReihe: { jahr: number; wert: Decimal }[],
) {
  const x = intermediates;
  const plan = amortization;
  const cf = cashflows;
  const mw = marktwertReihe;
  const i = inputs;

  let value: Decimal | null = null;
  const warnings: string[] = [];

  switch (def.id) {
    case 'bruttomietrendite': {
      value = x.jahresnettokaltmiete.div(i.kaufpreis).mul(100);
      break;
    }
    case 'nettomietrendite': {
      value = x.jahresreinertragJahr1.div(x.gesamtkapitalbedarf).mul(100);
      break;
    }
    case 'kaufpreisfaktor': {
      value = i.kaufpreis.div(x.jahresnettokaltmiete);
      break;
    }
    case 'kaufpreisfaktorAllIn': {
      value = x.gesamtkapitalbedarf.div(x.jahresnettokaltmiete);
      break;
    }
    case 'cashflowVorSteuernJahr1': {
      value = cf[0]?.cashflowVorSteuern ?? new Decimal(0);
      break;
    }
    case 'cashflowVorSteuernJahr1Monatlich': {
      value = cf[0]?.cashflowVorSteuern?.div(12) ?? new Decimal(0);
      break;
    }
    case 'monatlicheZuzahlung': {
      const monthly = cf[0]?.cashflowVorSteuern?.div(12) ?? new Decimal(0);
      value = monthly.isNegative() ? monthly.abs() : new Decimal(0);
      break;
    }
    case 'cashflowNachSteuernJahr1': {
      const cf0 = cf[0];
      value = cf0 ? cf0.cashflowVorSteuern.minus(cf0.steuerlast) : new Decimal(0);
      break;
    }
    case 'vermoegensaufbauProMonatJahr1': {
      value = cf[0]?.tilgungAnteil?.div(12) ?? new Decimal(0);
      break;
    }
    case 'dscr': {
      const kd = plan.rows?.[0]?.kapitaldienst;
      value = (kd && kd.gt(0)) ? x.jahresreinertragJahr1.div(kd) : null;
      break;
    }
    case 'eigenkapitalrenditeCashflow': {
      value = i.eigenkapital.gt(0) ? (cf[0]?.cashflowVorSteuern ?? new Decimal(0)).div(i.eigenkapital).mul(100) : null;
      break;
    }
    case 'eigenkapitalrenditeMitTilgung': {
      if (i.eigenkapital.gt(0)) {
        const cfJ1 = cf[0]?.cashflowVorSteuern ?? new Decimal(0);
        const tilgung = cf[0]?.tilgungAnteil ?? new Decimal(0);
        value = cfJ1.plus(tilgung).div(i.eigenkapital).mul(100);
      } else {
        value = null;
      }
      break;
    }
    case 'breakEvenMieteProQmLiquiditaet': {
      const kd2 = plan.rows?.[0]?.kapitaldienst ?? new Decimal(0);
      const bausparJahr = (i.bausparvertragMonatlich ?? new Decimal(0)).mul(12);
      const summe = x.bewirtschaftungskosten.plus(kd2).plus(bausparJahr);
      const nenner = i.wohnflaecheQm.mul(12)
        .mul(new Decimal(1).minus(x.leerstandsquote))
        .mul(new Decimal(1).minus(i.mietausfallwagnisSatz));
      value = nenner.gt(0) ? summe.div(nenner) : null;
      break;
    }
    case 'breakEvenMieteProQmWirtschaftlich': {
      const zins = plan.rows?.[0]?.zinsAnteil ?? new Decimal(0);
      const summe2 = x.bewirtschaftungskosten.plus(zins);
      const nenner2 = i.wohnflaecheQm.mul(12)
        .mul(new Decimal(1).minus(x.leerstandsquote))
        .mul(new Decimal(1).minus(i.mietausfallwagnisSatz));
      value = nenner2.gt(0) ? summe2.div(nenner2) : null;
      break;
    }
    case 'kaufpreisProQm': {
      value = i.kaufpreis.div(i.wohnflaecheQm);
      break;
    }
    case 'mieteProQm': {
      value = i.monatsnettokaltmiete.div(i.wohnflaecheQm);
      break;
    }
    case 'instandhaltungProQm': {
      value = i.instandhaltungskostenPa.div(i.wohnflaecheQm);
      break;
    }
    case 'restschuldNachPhase1': {
      const rows1 = plan.rows?.filter((r: any) => r.phase === 1) ?? [];
      value = rows1.length > 0 ? rows1[rows1.length - 1].restschuldEnde : null;
      break;
    }
    case 'restschuldNachPhase2': {
      const rows2 = plan.rows?.filter((r: any) => r.phase === 2) ?? [];
      value = rows2.length > 0 ? rows2[rows2.length - 1].restschuldEnde : null;
      if (value === null && plan.rows?.length > 0) {
        value = plan.rows[plan.rows.length - 1].restschuldEnde;
      }
      break;
    }
    case 'restschuldEndeBetrachtung': {
      const idx = Math.min(i.betrachtungszeitraumJahre, plan.rows?.length ?? 0) - 1;
      value = idx >= 0 ? plan.rows[idx].restschuldEnde : i.eigenkapital.gt(0) ? new Decimal(0) : null;
      break;
    }
    case 'marktwertEndeBetrachtung': {
      const last = mw[mw.length - 1];
      value = last?.wert ?? null;
      break;
    }
    case 'vermoegensbilanzEnde': {
      const mwEnde = mw[mw.length - 1]?.wert ?? new Decimal(0);
      const rsIdx = Math.min(i.betrachtungszeitraumJahre, plan.rows?.length ?? 0) - 1;
      const rs = rsIdx >= 0 ? plan.rows[rsIdx].restschuldEnde : new Decimal(0);
      value = mwEnde.minus(rs);
      break;
    }
    case 'afaJaehrlich': {
      value = x.afaJaehrlich;
      if (!i.steuerModulAktiv) value = null;
      break;
    }
    case 'steuerlicherUeberschussJahr1': {
      if (!i.steuerModulAktiv) { value = null; break; }
      const cf0 = cf[0];
      value = cf0 ? cf0.steuerlicherUeberschuss : null;
      break;
    }
    case 'steuerlasterJahr1': {
      if (!i.steuerModulAktiv) { value = null; break; }
      const cf1 = cf[0];
      value = cf1 ? cf1.steuerlast : null;
      break;
    }
  }

  const meta = (KPI_METADATA as any)[def.id];
  return {
    metadata: meta ?? { id: def.id, displayName: def.displayName, format: 'currency', einheit: '', kategorie: '', formel: '', bedeutung: '', eingaben: [], decimals: 2 },
    value: value !== null ? roundTo(value, meta?.decimals ?? 2) : null,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}