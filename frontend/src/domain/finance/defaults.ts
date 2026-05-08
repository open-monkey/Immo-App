import type { ScenarioConfig } from './types';

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
    name: 'Default Scenario',
    purchase: { ...defaultPurchase },
    loan: { principal: 0, ...defaultLoan },
    rental: { ...defaultRental },
    expenses: { ...defaultExpenses },
    tax: { ...defaultTax },
    holdPeriodYears: 10,
    annualAppreciation: 0.03,
    sellingCostPercent: 0.06,
    ...overrides,
    purchase: { ...defaultPurchase, ...overrides?.purchase },
    loan: { principal: 0, ...defaultLoan, ...overrides?.loan },
    rental: { ...defaultRental, ...overrides?.rental },
    expenses: { ...defaultExpenses, ...overrides?.expenses },
    tax: { ...defaultTax, ...overrides?.tax },
  };
}
