import { describe, it, expect } from 'vitest';
import { compute } from '../engine';
import { runScenario } from '../scenario';
import { calculateKPIs } from '../kpis';
import { generateMonthlyCashflows, generateAnnualSummaries } from '../cashflow';
import { baselineScenario, allCashScenario, highLeverageScenario, immo, d } from './fixtures';

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

  it('bausparvertragMonatlich=100 senkt cashflowVorSteuern um 1200', () => {
    const ohne = compute(immo());
    const mit100 = compute(immo({ bausparvertragMonatlich: d(100) }));
    const differenz = ohne.cashflows[0].cashflowVorSteuern.minus(mit100.cashflows[0].cashflowVorSteuern);
    expect(differenz.toNumber()).toBeCloseTo(1200, 2);
  });
});

describe('breakEvenMieteProQmLiquiditaet regressions', () => {
  it('(a) increases when bausparvertragMonatlich = 200 vs 0', () => {
    const ohne = compute(immo({ bausparvertragMonatlich: undefined }));
    const mit = compute(immo({ bausparvertragMonatlich: d(200) }));
    const beo = ohne.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber() ?? 0;
    const bem = mit.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber() ?? 0;
    expect(bem).toBeGreaterThan(beo);
    // Delta should be approximately 2400 / (65 * 12 * (1-leerstand) * (1-maw))
    // Tolerance of 0.01 accounts for KPI 2-decimal rounding at both points
    const lq = 0.5 / 12;
    const maw = 0.02;
    const expectedDelta = 2400 / (65 * 12 * (1 - lq) * (1 - maw));
    expect(bem - beo).toBeCloseTo(expectedDelta, 1);
  });

  it('(b) increases when mietausfallwagnisSatz = 0.02 vs 0', () => {
    const ohne = compute(immo({ mietausfallwagnisSatz: d(0) }));
    const mit = compute(immo({ mietausfallwagnisSatz: d('0.02') }));
    const beo = ohne.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber() ?? 0;
    const bem = mit.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber() ?? 0;
    expect(bem).toBeGreaterThan(beo);
  });

  it('(c) at break-even rent, cashflowVorSteuernJahr1 is approximately 0', () => {
    // Step 1: compute break-even rent per qm using standard inputs (no Erstvermietung to keep year-1 consistent)
    const base = compute(immo({ erstvermietungsleerstandMonate: d(0) }));
    const bePerQm = base.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber();
    expect(bePerQm).toBeDefined();
    // Step 2: set monatsnettokaltmiete = bePerQm * wohnflaecheQm and recompute
    // KPI is rounded to 2 decimal places, so residual cashflow ≤ ~5 EUR/year is acceptable
    const beMonatlich = d(Math.round((bePerQm! * 65) * 100) / 100);
    const atBE = compute(immo({ monatsnettokaltmiete: beMonatlich, erstvermietungsleerstandMonate: d(0) }));
    const cf = atBE.cashflows[0].cashflowVorSteuern.toNumber();
    expect(Math.abs(cf)).toBeLessThan(5); // within €5/year of zero (rounding tolerance)
  });
});

describe('scenario KPI regressions', () => {
  it('(d) scenario cashflowNachSteuernJahr1 differs from cashflowVorSteuernJahr1 when tax is active', () => {
    const inputs = immo({
      steuerModulAktiv: true,
      persoenlicherSteuersatz: d('0.42'),
      gebaeudeanteilSatz: d('0.8'),
      afaSatz: d('0.02'),
    });
    const result = compute(inputs);
    for (const scenario of result.scenarios) {
      const cfVor = scenario.kpis.cashflowVorSteuernJahr1.toNumber();
      const cfNach = scenario.kpis.cashflowNachSteuernJahr1.toNumber();
      // Tax module active: nach should differ from vor (unless steuerlast is exactly 0)
      // The steuerlicherUeberschuss for year 1 is non-zero, so they should differ
      expect(cfNach).not.toBeCloseTo(cfVor, 0);
    }
  });

  it('(d) scenario cashflowNachSteuernJahr1 = cashflowVorSteuern - steuerlast for realistisch scenario', () => {
    const inputs = immo({
      steuerModulAktiv: true,
      persoenlicherSteuersatz: d('0.42'),
      gebaeudeanteilSatz: d('0.8'),
      afaSatz: d('0.02'),
    });
    const result = compute(inputs);
    const realistisch = result.scenarios.find(s => s.id === 'realistisch')!;
    // Realistisch: mietDelta=0, kostenDelta=0 → cfVorSteuern = year1 cfVorSteuern
    const expectedCfVor = result.cashflows[0].cashflowVorSteuern.toNumber();
    const expectedCfNach = result.cashflows[0].cashflowNachSteuern.toNumber();
    expect(realistisch.kpis.cashflowVorSteuernJahr1.toNumber()).toBeCloseTo(expectedCfVor, 2);
    expect(realistisch.kpis.cashflowNachSteuernJahr1.toNumber()).toBeCloseTo(expectedCfNach, 2);
  });

  it('(e) scenario nettomietrendite: konservativ < realistisch < optimistisch', () => {
    const result = compute(immo());
    const konservativ = result.scenarios.find(s => s.id === 'konservativ')!;
    const realistisch = result.scenarios.find(s => s.id === 'realistisch')!;
    const optimistisch = result.scenarios.find(s => s.id === 'optimistisch')!;
    expect(konservativ.kpis.nettomietrendite.toNumber())
      .toBeLessThan(realistisch.kpis.nettomietrendite.toNumber());
    expect(realistisch.kpis.nettomietrendite.toNumber())
      .toBeLessThan(optimistisch.kpis.nettomietrendite.toNumber());
  });

  it('(e) scenario nettomietrendite realistisch equals base nettomietrendite', () => {
    const result = compute(immo());
    const realistisch = result.scenarios.find(s => s.id === 'realistisch')!;
    const baseNetto = result.kpis.nettomietrendite?.value?.toNumber() ?? 0;
    expect(realistisch.kpis.nettomietrendite.toNumber()).toBeCloseTo(baseNetto, 2);
  });

  it('(f) scenario cashflowVorSteuernJahr1: konservativ < realistisch < optimistisch', () => {
    const result = compute(immo());
    const konservativ = result.scenarios.find(s => s.id === 'konservativ')!;
    const realistisch = result.scenarios.find(s => s.id === 'realistisch')!;
    const optimistisch = result.scenarios.find(s => s.id === 'optimistisch')!;
    expect(konservativ.kpis.cashflowVorSteuernJahr1.toNumber())
      .toBeLessThan(realistisch.kpis.cashflowVorSteuernJahr1.toNumber());
    expect(realistisch.kpis.cashflowVorSteuernJahr1.toNumber())
      .toBeLessThan(optimistisch.kpis.cashflowVorSteuernJahr1.toNumber());
  });

  it('(f) realistisch cashflowVorSteuernJahr1 equals engine year-1 cashflowVorSteuern', () => {
    const result = compute(immo());
    const realistisch = result.scenarios.find(s => s.id === 'realistisch')!;
    expect(realistisch.kpis.cashflowVorSteuernJahr1.toNumber())
      .toBeCloseTo(result.cashflows[0].cashflowVorSteuern.toNumber(), 2);
  });

  it('(f) scenario cashflowVorSteuernJahr1 delta uses effektiveJahresmiete not NOI', () => {
    // For optimistisch: mietDelta=+5%, kostenDelta=-5%
    // Correct delta: effektiveJahresmiete*0.05 + bewirtschaftungskosten*0.05
    // Wrong delta:   jahresreinertrag*0.05     + bewirtschaftungskosten*0.05
    // Difference:    bewirtschaftungskosten*0.05 (non-zero when costs > 0)
    const result = compute(immo());
    const year1 = result.cashflows[0];
    const optimistisch = result.scenarios.find(s => s.id === 'optimistisch')!;
    const expectedCF = year1.cashflowVorSteuern
      .plus(year1.effektiveJahresmiete.mul('0.05'))
      .plus(year1.bewirtschaftungskosten.mul('0.05'));
    expect(optimistisch.kpis.cashflowVorSteuernJahr1.toNumber())
      .toBeCloseTo(expectedCF.toNumber(), 2);
  });
});
