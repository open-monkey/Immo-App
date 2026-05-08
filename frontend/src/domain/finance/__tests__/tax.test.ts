import Decimal from 'decimal.js-light';
import { describe, expect, it } from 'vitest';
import { FIXTURES } from './fixtures';
import {
  computeAfaBasis,
  computeAfaJaehrlich,
  computeSteuerlast,
  computeSteuerlicherUeberschuss,
} from '../tax';

function expectDecimalClose(actual: Decimal, expected: string, tolerance = '0.0000001') {
  const delta = actual.minus(new Decimal(expected)).abs();
  expect(delta.lte(new Decimal(tolerance))).toBe(true);
}

describe('tax helpers', () => {
  it('computes AfA basis and yearly AfA from purchase price and building share only', () => {
    const inputs = FIXTURES.find((fixture) => fixture.id === 'STEUER_AKTIV')!.inputs;

    expectDecimalClose(computeAfaBasis(inputs), '200000');
    expectDecimalClose(computeAfaJaehrlich(inputs), '4000');
  });

  it('computes steuerlichen Überschuss without tilgung', () => {
    const inputs = FIXTURES.find((fixture) => fixture.id === 'STEUER_AKTIV')!.inputs;

    const steuerlicherUeberschuss = computeSteuerlicherUeberschuss({
      inputs,
      jahresreinertrag: new Decimal('9313.5'),
      zinsAnteil: new Decimal('8607'),
    });

    expectDecimalClose(steuerlicherUeberschuss, '-3293.5');
  });

  it('allows a negative steuerlast as tax relief', () => {
    const inputs = FIXTURES.find((fixture) => fixture.id === 'STEUER_AKTIV')!.inputs;

    const steuerlast = computeSteuerlast(inputs, new Decimal('-3293.5'));

    expectDecimalClose(steuerlast, '-1383.27');
  });
});
