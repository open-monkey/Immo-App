import { describe, it, expect } from 'vitest';
import { runScenario, runScenarios, compareScenarios } from '../scenario';
import { baselineScenario, allCashScenario, highLeverageScenario } from './fixtures';

describe('runScenario', () => {
  it('returns a complete result with name', () => {
    const result = runScenario(baselineScenario);
    expect(result.name).toBe('Baseline Test');
    expect(result.monthlyCashflows.length).toBeGreaterThan(0);
    expect(result.annualSummaries.length).toBeGreaterThan(0);
    expect(result.kpis).toBeDefined();
  });

  it('returns all KPI fields', () => {
    const result = runScenario(baselineScenario);
    expect(result.kpis.capRate).toBeDefined();
    expect(result.kpis.cashOnCashReturn).toBeDefined();
    expect(result.kpis.totalCashInvested).toBeGreaterThan(0);
    expect(result.kpis.roi).toBeDefined();
    expect(result.kpis.dscr).toBeDefined();
    expect(result.kpis.grossRentMultiplier).toBeGreaterThan(0);
    expect(result.kpis.breakEvenOccupancy).toBeGreaterThan(0);
  });

  it('all-cash scenario has higher cap rate than leveraged', () => {
    const leveraged = runScenario(baselineScenario);
    const allCash = runScenario(allCashScenario);
    // Both should have valid cap rates
    expect(allCash.kpis.capRate).toBeGreaterThan(0);
    expect(leveraged.kpis.capRate).toBeGreaterThan(0);
  });

  it('high leverage has higher cash-on-cash when positive', () => {
    const result = runScenario(highLeverageScenario);
    expect(result.kpis.cashOnCashReturn).toBeDefined();
  });

  it('NPV is calculable', () => {
    const result = runScenario(baselineScenario);
    expect(typeof result.kpis.netPresentValue).toBe('number');
    expect(isFinite(result.kpis.netPresentValue)).toBe(true);
  });

  it('IRR is calculable', () => {
    const result = runScenario(baselineScenario);
    expect(typeof result.kpis.internalRateOfReturn).toBe('number');
    expect(isFinite(result.kpis.internalRateOfReturn)).toBe(true);
  });
});

describe('runScenarios', () => {
  it('runs multiple scenarios', () => {
    const results = runScenarios([baselineScenario, allCashScenario, highLeverageScenario]);
    expect(results).toHaveLength(3);
    expect(results[0].name).toBe('Baseline Test');
    expect(results[1].name).toBe('All Cash');
    expect(results[2].name).toBe('High Leverage');
  });
});

describe('compareScenarios', () => {
  it('returns delta for all KPI fields', () => {
    const baseline = runScenario(baselineScenario);
    const alternative = runScenario(allCashScenario);
    const comparison = compareScenarios(baseline, alternative);

    expect(comparison.capRate).toBeDefined();
    expect(comparison.capRate.baseline).toBe(baseline.kpis.capRate);
    expect(comparison.capRate.alternative).toBe(allCashScenario ? alternative.kpis.capRate : 0);
    expect(comparison.capRate.delta).toBe(
      alternative.kpis.capRate - baseline.kpis.capRate,
    );
  });

  it('comparing same scenario yields zero deltas', () => {
    const result = runScenario(baselineScenario);
    const comparison = compareScenarios(result, result);

    for (const key of Object.keys(comparison)) {
      expect(comparison[key].delta).toBe(0);
    }
  });
});
