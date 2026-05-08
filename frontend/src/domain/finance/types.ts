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
