import type { ScenarioConfig } from '../types';
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
