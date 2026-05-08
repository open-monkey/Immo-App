import { describe, it, expect } from 'vitest';
import {
  generateAmortizationSchedule,
  calculateMonthlyPayment,
  getRemainingBalance,
  totalInterest,
} from '../amortization';

describe('calculateMonthlyPayment', () => {
  it('calculates correct payment for a 30-year mortgage', () => {
    // $200k at 6% for 30 years => ~$1199.10/mo
    const payment = calculateMonthlyPayment(200_000, 0.06, 360);
    expect(payment).toBeCloseTo(1199.10, 1);
  });

  it('calculates correct payment for a 15-year mortgage', () => {
    // $200k at 6% for 15 years => ~$1687.71/mo
    const payment = calculateMonthlyPayment(200_000, 0.06, 180);
    expect(payment).toBeCloseTo(1687.71, 1);
  });

  it('returns 0 for zero principal', () => {
    expect(calculateMonthlyPayment(0, 0.06, 360)).toBe(0);
  });

  it('handles zero interest rate', () => {
    const payment = calculateMonthlyPayment(120_000, 0, 120);
    expect(payment).toBe(1000);
  });
});

describe('generateAmortizationSchedule', () => {
  it('generates correct number of rows', () => {
    const schedule = generateAmortizationSchedule({
      principal: 200_000,
      annualRate: 0.06,
      termMonths: 360,
    });
    expect(schedule).toHaveLength(360);
  });

  it('first payment has correct interest', () => {
    const schedule = generateAmortizationSchedule({
      principal: 200_000,
      annualRate: 0.06,
      termMonths: 360,
    });
    // First month interest: 200000 * 0.06/12 = 1000
    expect(schedule[0].interest).toBeCloseTo(1000, 0);
  });

  it('last balance is approximately zero', () => {
    const schedule = generateAmortizationSchedule({
      principal: 200_000,
      annualRate: 0.06,
      termMonths: 360,
    });
    const last = schedule[schedule.length - 1];
    expect(last.remainingBalance).toBeCloseTo(0, 0);
  });

  it('returns empty array for zero principal', () => {
    const schedule = generateAmortizationSchedule({
      principal: 0,
      annualRate: 0.06,
      termMonths: 360,
    });
    expect(schedule).toHaveLength(0);
  });

  it('principal portion increases each month', () => {
    const schedule = generateAmortizationSchedule({
      principal: 200_000,
      annualRate: 0.06,
      termMonths: 360,
    });
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].principal).toBeGreaterThan(schedule[i - 1].principal);
    }
  });

  it('interest portion decreases each month', () => {
    const schedule = generateAmortizationSchedule({
      principal: 200_000,
      annualRate: 0.06,
      termMonths: 360,
    });
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].interest).toBeLessThan(schedule[i - 1].interest);
    }
  });
});

describe('getRemainingBalance', () => {
  it('returns full principal at month 0', () => {
    const balance = getRemainingBalance(200_000, 0.06, 360, 0);
    expect(balance).toBeCloseTo(200_000, 0);
  });

  it('returns 0 at or beyond term', () => {
    const balance = getRemainingBalance(200_000, 0.06, 360, 360);
    expect(balance).toBe(0);
  });

  it('matches amortization schedule balance', () => {
    const schedule = generateAmortizationSchedule({
      principal: 200_000,
      annualRate: 0.06,
      termMonths: 360,
    });
    for (let m = 1; m <= 12; m++) {
      const balance = getRemainingBalance(200_000, 0.06, 360, m);
      expect(balance).toBeCloseTo(schedule[m - 1].remainingBalance, 0);
    }
  });

  it('handles zero interest rate', () => {
    const balance = getRemainingBalance(120_000, 0, 120, 60);
    expect(balance).toBeCloseTo(60_000, 0);
  });
});

describe('totalInterest', () => {
  it('calculates total interest correctly', () => {
    // $200k at 6% for 30 years
    const interest = totalInterest(200_000, 0.06, 360);
    expect(interest).toBeCloseTo(231_676, -2);
  });

  it('returns 0 for zero rate', () => {
    expect(totalInterest(100_000, 0, 120)).toBe(0);
  });
});
