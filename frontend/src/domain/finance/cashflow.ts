import type {
  ScenarioConfig,
  MonthlyCashflow,
  AnnualSummary,
} from './types';
import { calculateMonthlyPayment } from './amortization';
import { getRemainingBalance } from './amortization';

/**
 * Generate monthly cashflow projections for the full hold period.
 */
export function generateMonthlyCashflows(config: ScenarioConfig): MonthlyCashflow[] {
  const { purchase, loan, rental, expenses, holdPeriodYears, annualAppreciation } = config;
  const totalMonths = holdPeriodYears * 12;
  const monthlyRate = loan.annualRate / 12;

  // Calculate loan amount
  const downPayment = purchase.purchasePrice * purchase.downPaymentPercent;
  const closingCosts = purchase.purchasePrice * purchase.closingCostPercent;
  const loanAmount = purchase.purchasePrice - downPayment;
  const debtService = loanAmount > 0
    ? calculateMonthlyPayment(loanAmount, loan.annualRate, loan.termMonths)
    : 0;

  const cashflows: MonthlyCashflow[] = [];
  let cumulativeCashflow = -(downPayment + closingCosts + purchase.renovationCost);

  for (let month = 1; month <= totalMonths; month++) {
    const year = Math.ceil(month / 12);
    const yearsElapsed = (month - 1) / 12;

    // Rent with growth
    const rentGrowthFactor = Math.pow(1 + rental.annualRentGrowth, yearsElapsed);
    const grossRent = rental.monthlyRent * rentGrowthFactor;
    const vacancyLoss = grossRent * rental.vacancyRate;
    const effectiveRent = grossRent - vacancyLoss;

    // Expenses with growth
    const expenseGrowthFactor = Math.pow(1 + expenses.annualExpenseGrowth, yearsElapsed);
    const monthlyPropertyTax = (expenses.propertyTaxAnnual / 12) * expenseGrowthFactor;
    const monthlyInsurance = (expenses.insuranceAnnual / 12) * expenseGrowthFactor;
    const maintenance = effectiveRent * expenses.maintenancePercent;
    const management = effectiveRent * expenses.managementPercent;
    const totalExpenses =
      monthlyPropertyTax +
      monthlyInsurance +
      maintenance +
      management +
      expenses.hoaMonthly +
      expenses.otherMonthly;

    const noi = effectiveRent - totalExpenses;
    const cashflow = noi - debtService;
    cumulativeCashflow += cashflow;

    // Property value and equity
    const propertyValue =
      purchase.purchasePrice * Math.pow(1 + annualAppreciation, yearsElapsed);
    const remainingBalance =
      loanAmount > 0 ? getRemainingBalance(loanAmount, loan.annualRate, loan.termMonths, month) : 0;
    const equity = propertyValue - remainingBalance;

    cashflows.push({
      month,
      year,
      grossRent: roundCents(grossRent),
      vacancyLoss: roundCents(vacancyLoss),
      effectiveRent: roundCents(effectiveRent),
      totalExpenses: roundCents(totalExpenses),
      debtService: roundCents(debtService),
      netOperatingIncome: roundCents(noi),
      cashflow: roundCents(cashflow),
      cumulativeCashflow: roundCents(cumulativeCashflow),
      equity: roundCents(equity),
    });
  }

  return cashflows;
}

/**
 * Aggregate monthly cashflows into annual summaries.
 */
export function generateAnnualSummaries(config: ScenarioConfig): AnnualSummary[] {
  const monthlyCashflows = generateMonthlyCashflows(config);
  const { purchase, loan, holdPeriodYears, annualAppreciation } = config;

  const downPayment = purchase.purchasePrice * purchase.downPaymentPercent;
  const closingCosts = purchase.purchasePrice * purchase.closingCostPercent;
  const loanAmount = purchase.purchasePrice - downPayment;

  const summaries: AnnualSummary[] = [];

  for (let year = 1; year <= holdPeriodYears; year++) {
    const yearCashflows = monthlyCashflows.filter((cf) => cf.year === year);

    const grossRent = yearCashflows.reduce((s, cf) => s + cf.grossRent, 0);
    const vacancyLoss = yearCashflows.reduce((s, cf) => s + cf.vacancyLoss, 0);
    const operatingExpenses = yearCashflows.reduce((s, cf) => s + cf.totalExpenses, 0);
    const debtService = yearCashflows.reduce((s, cf) => s + cf.debtService, 0);
    const netOperatingIncome = yearCashflows.reduce((s, cf) => s + cf.netOperatingIncome, 0);
    const cashflow = yearCashflows.reduce((s, cf) => s + cf.cashflow, 0);

    const propertyValue =
      purchase.purchasePrice * Math.pow(1 + annualAppreciation, year);
    const lastMonth = yearCashflows[yearCashflows.length - 1];
    const loanBalance = loanAmount > 0
      ? getRemainingBalance(loanAmount, loan.annualRate, loan.termMonths, lastMonth.month)
      : 0;
    const equity = propertyValue - loanBalance;

    const totalCashInvested = downPayment + closingCosts + purchase.renovationCost;
    const capRate = purchase.purchasePrice > 0
      ? (netOperatingIncome / purchase.purchasePrice) * 100
      : 0;
    const cashOnCash = totalCashInvested > 0
      ? (cashflow / totalCashInvested) * 100
      : 0;

    summaries.push({
      year,
      grossRent: roundCents(grossRent),
      vacancyLoss: roundCents(vacancyLoss),
      operatingExpenses: roundCents(operatingExpenses),
      debtService: roundCents(debtService),
      netOperatingIncome: roundCents(netOperatingIncome),
      cashflow: roundCents(cashflow),
      propertyValue: roundCents(propertyValue),
      loanBalance: roundCents(loanBalance),
      equity: roundCents(equity),
      capRate: roundHundredths(capRate),
      cashOnCash: roundHundredths(cashOnCash),
    });
  }

  return summaries;
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundHundredths(n: number): number {
  return Math.round(n * 100) / 100;
}
