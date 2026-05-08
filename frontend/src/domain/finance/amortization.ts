import type { AmortizationRow, LoanParams } from './types';

/**
 * Generate a full amortization schedule for a fixed-rate loan.
 */
export function generateAmortizationSchedule(params: LoanParams): AmortizationRow[] {
  const { principal, annualRate, termMonths } = params;

  if (principal <= 0 || termMonths <= 0) {
    return [];
  }

  const monthlyRate = annualRate / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let month = 1; month <= termMonths; month++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      month,
      payment: roundCents(monthlyPayment),
      principal: roundCents(principalPayment),
      interest: roundCents(interest),
      remainingBalance: roundCents(balance),
    });
  }

  return schedule;
}

/**
 * Calculate monthly payment for a fixed-rate loan.
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal <= 0) return 0;
  if (annualRate === 0) return principal / termMonths;

  const monthlyRate = annualRate / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
}

/**
 * Get remaining balance at a specific month.
 */
export function getRemainingBalance(
  principal: number,
  annualRate: number,
  termMonths: number,
  atMonth: number,
): number {
  if (atMonth >= termMonths) return 0;
  if (principal <= 0) return 0;
  if (annualRate === 0) return principal - (principal / termMonths) * atMonth;

  const monthlyRate = annualRate / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const factor = Math.pow(1 + monthlyRate, atMonth);
  return principal * factor - monthlyPayment * ((factor - 1) / monthlyRate);
}

/**
 * Calculate total interest paid over the life of the loan.
 */
export function totalInterest(principal: number, annualRate: number, termMonths: number): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  return monthlyPayment * termMonths - principal;
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}
