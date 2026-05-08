import type { ScenarioConfig, ScenarioResult, ScenarioKPIs } from './types';
import { generateMonthlyCashflows, generateAnnualSummaries } from './cashflow';
import { calculateKPIs } from './kpis';

/**
 * Run a complete financial scenario analysis.
 */
export function runScenario(config: ScenarioConfig): ScenarioResult {
  const monthlyCashflows = generateMonthlyCashflows(config);
  const annualSummaries = generateAnnualSummaries(config);
  const kpis = calculateKPIs(config, monthlyCashflows, annualSummaries);

  return {
    name: config.name,
    monthlyCashflows,
    annualSummaries,
    kpis,
  };
}

/**
 * Run multiple scenarios and return results for comparison.
 */
export function runScenarios(configs: ScenarioConfig[]): ScenarioResult[] {
  return configs.map(runScenario);
}

/**
 * Compare two scenarios side by side with delta calculations.
 */
export function compareScenarios(
  baseline: ScenarioResult,
  alternative: ScenarioResult,
): Record<string, { baseline: number; alternative: number; delta: number }> {
  const fields: (keyof ScenarioKPIs)[] = [
    'capRate',
    'cashOnCashReturn',
    'totalCashInvested',
    'totalCashflow',
    'totalProfit',
    'roi',
    'netPresentValue',
    'internalRateOfReturn',
    'dscr',
    'grossRentMultiplier',
    'breakEvenOccupancy',
  ];

  const comparison: Record<string, { baseline: number; alternative: number; delta: number }> = {};

  for (const field of fields) {
    const bVal = baseline.kpis[field];
    const aVal = alternative.kpis[field];
    comparison[field] = {
      baseline: bVal,
      alternative: aVal,
      delta: aVal - bVal,
    };
  }

  return comparison;
}
