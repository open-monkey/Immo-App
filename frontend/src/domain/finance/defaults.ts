import Decimal from 'decimal.js-light';
import type { Bundesland, FinanzierterPosten, ImmoInputs, ScenarioConfig } from './types';

/** Default purchase parameters */
export const defaultPurchase = {
  purchasePrice: 250_000,
  downPaymentPercent: 0.20,
  closingCostPercent: 0.03,
  renovationCost: 15_000,
};

/** Default loan parameters */
export const defaultLoan = {
  annualRate: 0.065,
  termMonths: 360, // 30 years
};

/** Default rental parameters */
export const defaultRental = {
  monthlyRent: 2_200,
  vacancyRate: 0.05,
  annualRentGrowth: 0.03,
};

/** Default operating expense parameters */
export const defaultExpenses = {
  propertyTaxAnnual: 3_000,
  insuranceAnnual: 1_800,
  maintenancePercent: 0.05,
  managementPercent: 0.08,
  hoaMonthly: 0,
  otherMonthly: 50,
  annualExpenseGrowth: 0.02,
};

/** Default tax parameters */
export const defaultTax = {
  marginalRate: 0.24,
  depreciationYears: 27.5,
  capitalGainsRate: 0.15,
};

/** Build a full default scenario config */
export function buildDefaultScenario(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    name: overrides?.name ?? 'Default Scenario',
    purchase: { ...defaultPurchase, ...overrides?.purchase },
    loan: { principal: 0, ...defaultLoan, ...overrides?.loan },
    rental: { ...defaultRental, ...overrides?.rental },
    expenses: { ...defaultExpenses, ...overrides?.expenses },
    tax: { ...defaultTax, ...overrides?.tax },
    holdPeriodYears: overrides?.holdPeriodYears ?? 10,
    annualAppreciation: overrides?.annualAppreciation ?? 0.03,
    sellingCostPercent: overrides?.sellingCostPercent ?? 0.06,
  };
}

// ── Immo-specific defaults ───────────────────────────────────────

export const GREW_BY_BUNDESLAND: Record<Bundesland, number> = {
  BW: 0.050, BY: 0.035, BE: 0.060, BB: 0.065, HB: 0.050,
  HH: 0.055, HE: 0.060, MV: 0.060, NI: 0.050, NW: 0.065,
  RP: 0.050, SL: 0.065, SN: 0.055, ST: 0.050, SH: 0.065, TH: 0.065,
};

export const defaultsBW: ImmoInputs = {
  kaufpreis: new Decimal(250000),
  wohnflaecheQm: new Decimal(65),
  bundesland: 'BW',
  kaufnebenkostenModus: 'detailliert',
  kaufnebenkostenSumme: undefined,
  grunderwerbsteuerSatz: new Decimal('0.05'),
  notarGrundbuchSatz: new Decimal('0.015'),
  maklerprovisionSatz: new Decimal('0.0357'),
  sanierungskostenSumme: new Decimal(0),
  sanierungWertanrechnungSatz: new Decimal('0.7'),
  eigenkapital: new Decimal(60000),
  finanziertePosten: new Set<FinanzierterPosten>(['kaufpreis', 'kaufnebenkosten', 'sanierung']),
  phase1Jahre: 10,
  phase1Sollzins: new Decimal('0.04'),
  phase1AnfTilgung: new Decimal('0.02'),
  phase1Sondertilgung: new Decimal(0),
  phase2Jahre: 10,
  phase2Sollzins: new Decimal('0.045'),
  phase2AnfTilgung: new Decimal('0.025'),
  phase2Sondertilgung: new Decimal(0),
  phase3Sollzins: new Decimal('0.05'),
  phase3AnfTilgung: new Decimal('0.03'),
  phase3Sondertilgung: new Decimal(0),
  tilgungsplanMaxJahre: 40,
  monatsnettokaltmiete: new Decimal(1050),
  mietsteigerungSatz: new Decimal('0.015'),
  kostenModus: 'detailliert',
  nichtUmlagefaehigeKostenSumme: undefined,
  hausgeldNichtUmlagefaehigPa: new Decimal(0),
  verwaltungskostenPa: new Decimal(0),
  versicherungenPa: new Decimal(0),
  sonstigeKostenPa: new Decimal(0),
  instandhaltungskostenPa: new Decimal(600),
  kostensteigerungSatz: new Decimal('0.02'),
  leerstandsmonateProJahr: new Decimal('0.5'),
  erstvermietungsleerstandMonate: new Decimal(0),
  mietausfallwagnisSatz: new Decimal('0.02'),
  steuerModulAktiv: false,
  persoenlicherSteuersatz: undefined,
  gebaeudeanteilSatz: undefined,
  afaSatz: undefined,
  betrachtungszeitraumJahre: 15,
  wertsteigerungSatz: new Decimal('0.015'),
  bausparvertragMonatlich: undefined,
};
