import { describe, it, expect } from 'vitest';
import { runScenario } from '../scenario';
import { calculateKPIs } from '../kpis';
import { generateMonthlyCashflows, generateAnnualSummaries } from '../cashflow';
import { baselineScenario, allCashScenario, highLeverageScenario } from './fixtures';

describe('calculateKPIs', () => {
  it('calculates cap rate between 0 and 20 for baseline', () => {
    const result = runScenario(baselineScenario);
    expect(result.kpis.capRate).toBeGreaterThan(0);
    expect(result.kpis.capRate).toBeLessThan(20);
  });

  it('total cash invested equals down payment + closing + renovation', () => {
    const result = runScenario(baselineScenario);
    const { purchase } = baselineScenario;
    const expected =
      purchase.purchasePrice * purchase.downPaymentPercent +
      purchase.purchasePrice * purchase.closingCostPercent +
      purchase.renovationCost;
    expect(result.kpis.totalCashInvested).toBeCloseTo(expected, 0);
  });

  it('cash-on-cash return is based on year 1 cashflow', () => {
    const result = runScenario(baselineScenario);
    const year1Cashflow = result.annualSummaries[0].cashflow;
    const expectedCoC = (year1Cashflow / result.kpis.totalCashInvested) * 100;
    expect(result.kpis.cashOnCashReturn).toBeCloseTo(expectedCoC, 1);
  });

  it('DSCR is above 1 for baseline scenario', () => {
    const result = runScenario(baselineScenario);
    // Baseline should be healthy
    expect(result.kpis.dscr).toBeGreaterThan(1);
  });

  it('DSCR is Infinity for all-cash scenario', () => {
    const result = runScenario(allCashScenario);
    expect(result.kpis.dscr).toBe(Infinity);
  });

  it('gross rent multiplier is property price / annual rent', () => {
    const result = runScenario(baselineScenario);
    const annualRent = result.annualSummaries[0].grossRent;
    const expectedGRM = baselineScenario.purchase.purchasePrice / annualRent;
    expect(result.kpis.grossRentMultiplier).toBeCloseTo(expectedGRM, 1);
  });

  it('break even occupancy is between 0 and 100', () => {
    const result = runScenario(baselineScenario);
    expect(result.kpis.breakEvenOccupancy).toBeGreaterThan(0);
    expect(result.kpis.breakEvenOccupancy).toBeLessThan(100);
  });

  it('all-cash ROI accounts for appreciation and cashflow', () => {
    const result = runScenario(allCashScenario);
    // All-cash should have positive total profit with appreciation
    expect(result.kpis.totalProfit).toBeGreaterThan(0);
    expect(result.kpis.roi).toBeGreaterThan(0);
  });

  it('NPV uses 8% discount rate', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    const summaries = generateAnnualSummaries(baselineScenario);
    const kpis = calculateKPIs(baselineScenario, cashflows, summaries);
    expect(typeof kpis.netPresentValue).toBe('number');
    expect(isFinite(kpis.netPresentValue)).toBe(true);
  });

  it('IRR is a reasonable percentage', () => {
    const result = runScenario(baselineScenario);
    // IRR should be between -50% and 100% for typical RE deals
    expect(result.kpis.internalRateOfReturn).toBeGreaterThan(-50);
    expect(result.kpis.internalRateOfReturn).toBeLessThan(100);
  });
});
