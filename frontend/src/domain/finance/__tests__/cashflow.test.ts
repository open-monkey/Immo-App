import { describe, it, expect } from 'vitest';
import { generateMonthlyCashflows, generateAnnualSummaries } from '../cashflow';
import { baselineScenario, allCashScenario } from './fixtures';

describe('generateMonthlyCashflows', () => {
  it('generates correct number of months', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    expect(cashflows).toHaveLength(baselineScenario.holdPeriodYears * 12);
  });

  it('first month gross rent matches config', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    expect(cashflows[0].grossRent).toBeCloseTo(baselineScenario.rental.monthlyRent, 0);
  });

  it('applies vacancy rate correctly', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    const { grossRent, vacancyLoss, effectiveRent } = cashflows[0];
    expect(vacancyLoss).toBeCloseTo(grossRent * baselineScenario.rental.vacancyRate, 0);
    expect(effectiveRent).toBeCloseTo(grossRent - vacancyLoss, 0);
  });

  it('applies rent growth over time', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    const month1Rent = cashflows[0].grossRent;
    const month13Rent = cashflows[12].grossRent;
    // Year 2 rent should be ~2% higher
    expect(month13Rent).toBeCloseTo(month1Rent * 1.02, 0);
  });

  it('cumulative cashflow accounts for initial investment', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    // Initial investment is negative
    const initialCashflow = cashflows[0].cumulativeCashflow;
    expect(initialCashflow).toBeLessThan(0);
  });

  it('all-cash scenario has zero debt service', () => {
    const cashflows = generateMonthlyCashflows(allCashScenario);
    for (const cf of cashflows) {
      expect(cf.debtService).toBe(0);
    }
  });

  it('equity grows with appreciation', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    const firstEquity = cashflows[0].equity;
    const lastEquity = cashflows[cashflows.length - 1].equity;
    expect(lastEquity).toBeGreaterThan(firstEquity);
  });

  it('all monetary values are non-negative where expected', () => {
    const cashflows = generateMonthlyCashflows(baselineScenario);
    for (const cf of cashflows) {
      expect(cf.grossRent).toBeGreaterThanOrEqual(0);
      expect(cf.vacancyLoss).toBeGreaterThanOrEqual(0);
      expect(cf.effectiveRent).toBeGreaterThanOrEqual(0);
      expect(cf.totalExpenses).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('generateAnnualSummaries', () => {
  it('generates one summary per hold year', () => {
    const summaries = generateAnnualSummaries(baselineScenario);
    expect(summaries).toHaveLength(baselineScenario.holdPeriodYears);
  });

  it('year numbers are sequential', () => {
    const summaries = generateAnnualSummaries(baselineScenario);
    summaries.forEach((s, i) => {
      expect(s.year).toBe(i + 1);
    });
  });

  it('property value increases each year with appreciation', () => {
    const summaries = generateAnnualSummaries(baselineScenario);
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i].propertyValue).toBeGreaterThan(summaries[i - 1].propertyValue);
    }
  });

  it('loan balance decreases each year', () => {
    const summaries = generateAnnualSummaries(baselineScenario);
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i].loanBalance).toBeLessThan(summaries[i - 1].loanBalance);
    }
  });

  it('equity increases each year', () => {
    const summaries = generateAnnualSummaries(baselineScenario);
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i].equity).toBeGreaterThan(summaries[i - 1].equity);
    }
  });

  it('cap rate is calculated correctly for year 1', () => {
    const summaries = generateAnnualSummaries(baselineScenario);
    const year1 = summaries[0];
    const expectedCapRate =
      (year1.netOperatingIncome / baselineScenario.purchase.purchasePrice) * 100;
    expect(year1.capRate).toBeCloseTo(expectedCapRate, 1);
  });

  it('all-cash scenario has no loan balance', () => {
    const summaries = generateAnnualSummaries(allCashScenario);
    for (const s of summaries) {
      expect(s.loanBalance).toBe(0);
      expect(s.debtService).toBe(0);
    }
  });
});
