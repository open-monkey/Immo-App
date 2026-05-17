import Decimal from 'decimal.js-light';

/**
 * Core types for the finance domain layer.
 */

/** Amortization schedule row */
export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

/** Loan parameters */
export interface LoanParams {
  principal: number;
  annualRate: number;
  termMonths: number;
  startDate?: string; // ISO date
}

/** Property purchase parameters */
export interface PurchaseParams {
  purchasePrice: number;
  downPaymentPercent: number;
  closingCostPercent: number;
  renovationCost: number;
}

/** Rental income parameters */
export interface RentalParams {
  monthlyRent: number;
  vacancyRate: number; // 0-1
  annualRentGrowth: number; // 0-1
}

/** Operating expense parameters */
export interface ExpenseParams {
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  maintenancePercent: number; // of gross rent
  managementPercent: number; // of gross rent
  hoaMonthly: number;
  otherMonthly: number;
  annualExpenseGrowth: number; // 0-1
}

/** Tax parameters */
export interface TaxParams {
  marginalRate: number; // 0-1
  depreciationYears: number;
  capitalGainsRate: number; // 0-1
}

/** Scenario configuration */
export interface ScenarioConfig {
  name: string;
  purchase: PurchaseParams;
  loan: LoanParams;
  rental: RentalParams;
  expenses: ExpenseParams;
  tax: TaxParams;
  holdPeriodYears: number;
  annualAppreciation: number; // 0-1
  sellingCostPercent: number; // 0-1
}

/** Cashflow for a single month */
export interface MonthlyCashflow {
  month: number;
  year: number;
  grossRent: number;
  vacancyLoss: number;
  effectiveRent: number;
  totalExpenses: number;
  debtService: number;
  netOperatingIncome: number;
  cashflow: number;
  cumulativeCashflow: number;
  equity: number;
}

/** Annual summary */
export interface AnnualSummary {
  year: number;
  grossRent: number;
  vacancyLoss: number;
  operatingExpenses: number;
  debtService: number;
  netOperatingIncome: number;
  cashflow: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  capRate: number;
  cashOnCash: number;
}

/** Scenario result including KPIs */
export interface ScenarioResult {
  name: string;
  monthlyCashflows: MonthlyCashflow[];
  annualSummaries: AnnualSummary[];
  kpis: ScenarioKPIs;
}

/** Key Performance Indicators */
export interface ScenarioKPIs {
  capRate: number;
  cashOnCashReturn: number;
  totalCashInvested: number;
  totalCashflow: number;
  totalProfit: number;
  roi: number;
  netPresentValue: number;
  internalRateOfReturn: number;
  dscr: number; // Debt Service Coverage Ratio
  grossRentMultiplier: number;
  breakEvenOccupancy: number;
}

/** Serialized scenario for storage */
export interface SerializedScenario {
  version: number;
  config: ScenarioConfig;
  createdAt: string;
  updatedAt: string;
}

// ── Immo-specific types ──────────────────────────────────────────

export type Bundesland = 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE'
  | 'MV' | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export type KaufnebenkostenModus = 'vereinfacht' | 'detailliert';
export type KostenModus = 'vereinfacht' | 'detailliert';
export type FinanzierterPosten = 'kaufpreis' | 'kaufnebenkosten' | 'sanierung';

export interface ImmoInputs {
  kaufpreis: Decimal;
  wohnflaecheQm: Decimal;
  bundesland: Bundesland;
  kaufnebenkostenModus: KaufnebenkostenModus;
  kaufnebenkostenSumme?: Decimal;
  grunderwerbsteuerSatz?: Decimal;
  notarGrundbuchSatz?: Decimal;
  maklerprovisionSatz?: Decimal;
  sanierungskostenSumme: Decimal;
  sanierungWertanrechnungSatz: Decimal;
  eigenkapital: Decimal;
  finanziertePosten: Set<FinanzierterPosten>;
  phase1Jahre: number;
  phase1Sollzins: Decimal;
  phase1AnfTilgung: Decimal;
  phase1Sondertilgung: Decimal;
  phase2Jahre: number;
  phase2Sollzins?: Decimal;
  phase2AnfTilgung?: Decimal;
  phase2Sondertilgung: Decimal;
  phase3Sollzins: Decimal;
  phase3AnfTilgung: Decimal;
  phase3Sondertilgung: Decimal;
  tilgungsplanMaxJahre: number;
  monatsnettokaltmiete: Decimal;
  mietsteigerungSatz: Decimal;
  kostenModus: KostenModus;
  nichtUmlagefaehigeKostenSumme?: Decimal;
  hausgeldNichtUmlagefaehigPa?: Decimal;
  verwaltungskostenPa?: Decimal;
  versicherungenPa?: Decimal;
  sonstigeKostenPa?: Decimal;
  instandhaltungskostenPa: Decimal;
  kostensteigerungSatz: Decimal;
  leerstandsmonateProJahr: Decimal;
  erstvermietungsleerstandMonate: Decimal;
  mietausfallwagnisSatz: Decimal;
  steuerModulAktiv: boolean;
  persoenlicherSteuersatz?: Decimal;
  gebaeudeanteilSatz?: Decimal;
  afaSatz?: Decimal;
  betrachtungszeitraumJahre: number;
  wertsteigerungSatz: Decimal;
  bausparvertragMonatlich?: Decimal;
}

export interface AmortizationRowImmo {
  jahr: number;
  phase: 1 | 2 | 3;
  restschuldAnfang: Decimal;
  zinsAnteil: Decimal;
  tilgungAnteil: Decimal;
  sondertilgung: Decimal;
  kapitaldienst: Decimal;
  restschuldEnde: Decimal;
}

export interface AmortizationPlan {
  rows: AmortizationRowImmo[];
  volltilgungErreicht: boolean;
  volltilgungJahr?: number;
  abgeschnittenAnMaxJahren: boolean;
}

export interface YearlyCashflow {
  jahr: number;
  jahresnettokaltmiete: Decimal;
  effektiveJahresmiete: Decimal;
  bewirtschaftungskosten: Decimal;
  jahresreinertrag: Decimal;
  zinsAnteil: Decimal;
  tilgungAnteil: Decimal;
  kapitaldienst: Decimal;
  cashflowVorSteuern: Decimal;
  afa: Decimal;
  steuerlicherUeberschuss: Decimal;
  steuerlast: Decimal;
  cashflowNachSteuern: Decimal;
}

export interface KPIMetadata {
  id: string;
  displayName: string;
  formel: string;
  bedeutung: string;
  eingaben: string[];
  einheit: string;
  kategorie: string;
  format: 'currency' | 'percent' | 'factor' | 'integer' | 'qm';
  decimals: number;
}

export interface KPIValue {
  metadata: KPIMetadata;
  value: Decimal | null;
  warnings?: string[];
}

export interface ComputedResult {
  intermediates: {
    kaufnebenkostenSummeBerechnet: Decimal;
    gesamtkapitalbedarf: Decimal;
    fremdkapital: Decimal;
    jahresnettokaltmiete: Decimal;
    leerstandsquote: Decimal;
    effektiveJahresmiete: Decimal;
    nichtUmlagefaehigeKostenAggregiert: Decimal;
    bewirtschaftungskosten: Decimal;
    jahresreinertragJahr1: Decimal;
    afaJaehrlich: Decimal;
  };
  amortization: AmortizationPlan;
  cashflows: YearlyCashflow[];
  kpis: Record<string, KPIValue>;
  marktwertReihe: { jahr: number; wert: Decimal }[];
  warnings: string[];
  decision: {
    ampel: 'green' | 'yellow' | 'red';
    summary: string;
    riskDrivers: string[];
  };
  scenarios: {
    id: string;
    label: string;
    assumptions: {
      mietDeltaPct: Decimal;
      bewirtschaftungskostenDeltaPct: Decimal;
      anschlusszinsDeltaPct: Decimal;
    };
    kpis: {
      cashflowVorSteuernJahr1: Decimal;
      nettomietrendite: Decimal;
      restschuldEndeBetrachtung: Decimal;
      cashflowNachSteuernJahr1: Decimal;
    };
  }[];
}

export type SerializedInputs = Record<string, unknown>;

// KPI definition for metadata display
export interface KPIDefinition {
  id: string;
  displayName: string;
  formel: string;
  bedeutung: string;
  eingaben: string[];
}
