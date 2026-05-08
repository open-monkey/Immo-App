import type {
  ScenarioConfig,
  MonthlyCashflow,
  AnnualSummary,
  ScenarioKPIs,
} from './types';
import { getRemainingBalance } from './amortization';

/**
 * Calculate key performance indicators for a scenario.
 */
export function calculateKPIs(
  config: ScenarioConfig,
  monthlyCashflows: MonthlyCashflow[],
  annualSummaries: AnnualSummary[],
): ScenarioKPIs {
  const { purchase, loan } = config;

  const downPayment = purchase.purchasePrice * purchase.downPaymentPercent;
  const closingCosts = purchase.purchasePrice * purchase.closingCostPercent;
  const totalCashInvested = downPayment + closingCosts + purchase.renovationCost;
  const loanAmount = purchase.purchasePrice - downPayment;

  const totalCashflow = monthlyCashflows.reduce((s, cf) => s + cf.cashflow, 0);

  // Terminal year values
  const lastSummary = annualSummaries[annualSummaries.length - 1];
  const sellingCosts = lastSummary.propertyValue * config.sellingCostPercent;
  const saleProceeds = lastSummary.propertyValue - lastSummary.loanBalance - sellingCosts;
  const totalProfit = totalCashflow + saleProceeds - totalCashInvested;
  const roi = totalCashInvested > 0 ? (totalProfit / totalCashInvested) * 100 : 0;

  // NOI from year 1
  const year1 = annualSummaries[0];
  const capRate =
    purchase.purchasePrice > 0
      ? (year1.netOperatingIncome / purchase.purchasePrice) * 100
      : 0;
  const cashOnCashReturn =
    totalCashInvested > 0 ? (year1.cashflow / totalCashInvested) * 100 : 0;

  // DSCR - Debt Service Coverage Ratio (year 1)
  const annualDebtService = year1.debtService;
  const dscr =
    annualDebtService > 0 ? year1.netOperatingIncome / annualDebtService : Infinity;

  // Gross Rent Multiplier
  const grossRentMultiplier =
    year1.grossRent > 0 ? purchase.purchasePrice / year1.grossRent : 0;

  // Break-even occupancy
  const totalYear1Expenses = year1.operatingExpenses + year1.debtService;
  const breakEvenOccupancy =
    year1.grossRent > 0 ? (totalYear1Expenses / year1.grossRent) * 100 : 100;

  // NPV using 8% discount rate
  const discountRate = 0.08;
  const npv = -totalCashInvested + calculateNPV(monthlyCashflows, discountRate, saleProceeds);

  // IRR approximation
  const irr = calculateIRR(totalCashInvested, monthlyCashflows, saleProceeds);

  return {
    capRate: roundHundredths(capRate),
    cashOnCashReturn: roundHundredths(cashOnCashReturn),
    totalCashInvested: roundCents(totalCashInvested),
    totalCashflow: roundCents(totalCashflow),
    totalProfit: roundCents(totalProfit),
    roi: roundHundredths(roi),
    netPresentValue: roundCents(npv),
    internalRateOfReturn: roundHundredths(irr),
    dscr: roundHundredths(dscr),
    grossRentMultiplier: roundHundredths(grossRentMultiplier),
    breakEvenOccupancy: roundHundredths(breakEvenOccupancy),
  };
}

/**
 * Calculate Net Present Value of monthly cashflows plus terminal sale.
 */
function calculateNPV(
  cashflows: MonthlyCashflow[],
  annualDiscountRate: number,
  saleProceeds: number,
): number {
  const monthlyDiscount = annualDiscountRate / 12;
  let npv = 0;

  for (const cf of cashflows) {
    npv += cf.cashflow / Math.pow(1 + monthlyDiscount, cf.month);
  }

  // Add discounted terminal sale
  const lastMonth = cashflows[cashflows.length - 1]?.month ?? 0;
  npv += saleProceeds / Math.pow(1 + monthlyDiscount, lastMonth);

  return npv;
}

/**
 * Calculate Internal Rate of Return using Newton's method.
 * Returns annualized IRR.
 */
function calculateIRR(
  initialInvestment: number,
  cashflows: MonthlyCashflow[],
  saleProceeds: number,
): number {
  // Build cashflow array: initial outflow + monthly + terminal sale
  const allCashflows = [-initialInvestment];
  for (const cf of cashflows) {
    allCashflows.push(cf.cashflow);
  }
  // Add sale proceeds to last month
  allCashflows[allCashflows.length - 1] += saleProceeds;

  // Newton's method to find monthly IRR
  let rate = 0.005; // initial guess: 0.5% monthly
  for (let i = 0; i < 200; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < allCashflows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      npv += allCashflows[t] / discountFactor;
      if (t > 0) {
        dnpv -= (t * allCashflows[t]) / (discountFactor * (1 + rate));
      }
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-10) {
      rate = newRate;
      break;
    }
    rate = newRate;
  }

  // Annualize the monthly rate
  return (Math.pow(1 + rate, 12) - 1) * 100;
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundHundredths(n: number): number {
  return Math.round(n * 100) / 100;
}
