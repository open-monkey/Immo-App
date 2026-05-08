/**
 * Finance engine - orchestrates all finance domain modules.
 * This is the main entry point for running financial analyses.
 */

import type { ScenarioConfig, ScenarioResult, ScenarioKPIs } from './types';
import { generateAmortizationSchedule } from './amortization';
import { generateMonthlyCashflows, generateAnnualSummaries } from './cashflow';
import { runScenario, runScenarios, compareScenarios } from './scenario';
import { calculateKPIs } from './kpis';
import { serializeScenario, deserializeScenario, validateScenarioConfig } from './serialization';
import { buildDefaultScenario } from './defaults';

// Re-export all public APIs
export { generateAmortizationSchedule, calculateMonthlyPayment, getRemainingBalance, totalInterest } from './amortization';
export { generateMonthlyCashflows, generateAnnualSummaries } from './cashflow';
export { runScenario, runScenarios, compareScenarios } from './scenario';
export { calculateKPIs } from './kpis';
export { serializeScenario, deserializeScenario, validateScenarioConfig } from './serialization';
export { buildDefaultScenario } from './defaults';
export * from './types';

/**
 * Full analysis pipeline: validate, run, and return results.
 */
export function analyzeProperty(config: ScenarioConfig): ScenarioResult {
  const errors = validateScenarioConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid scenario config: ${errors.join(', ')}`);
  }
  return runScenario(config);
}

/**
 * Quick summary of a single scenario's KPIs for display.
 */
export function formatKPIs(kpis: ScenarioKPIs): Record<string, string> {
  return {
    'Cap Rate': `${kpis.capRate.toFixed(2)}%`,
    'Cash-on-Cash': `${kpis.cashOnCashReturn.toFixed(2)}%`,
    'Total Cash Invested': `$${kpis.totalCashInvested.toLocaleString()}`,
    'Total Cashflow': `$${kpis.totalCashflow.toLocaleString()}`,
    'Total Profit': `$${kpis.totalProfit.toLocaleString()}`,
    'ROI': `${kpis.roi.toFixed(2)}%`,
    'NPV': `$${kpis.netPresentValue.toLocaleString()}`,
    'IRR': `${kpis.internalRateOfReturn.toFixed(2)}%`,
    'DSCR': kpis.dscr === Infinity ? '∞' : kpis.dscr.toFixed(2),
    'GRM': kpis.grossRentMultiplier.toFixed(2),
    'Break-Even Occupancy': `${kpis.breakEvenOccupancy.toFixed(1)}%`,
  };
}
