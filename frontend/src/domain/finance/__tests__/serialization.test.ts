import Decimal from 'decimal.js-light';
import { describe, expect, it } from 'vitest';
import { FIXTURES } from './fixtures';
import { deserialize, serialize } from '../serialization';

function expectDecimalEqual(actual: Decimal, expected: Decimal) {
  expect(actual.equals(expected)).toBe(true);
}

describe('serialization', () => {
  it('round-trips fixture inputs including Decimal fields and financed-items set', () => {
    const fixture = FIXTURES[0];
    const roundtrip = deserialize(serialize(fixture.inputs));

    expectDecimalEqual(roundtrip.kaufpreis, fixture.inputs.kaufpreis);
    expectDecimalEqual(roundtrip.wohnflaecheQm, fixture.inputs.wohnflaecheQm);
    expectDecimalEqual(roundtrip.monatsnettokaltmiete, fixture.inputs.monatsnettokaltmiete);
    expectDecimalEqual(roundtrip.instandhaltungskostenPa, fixture.inputs.instandhaltungskostenPa);
    expect([...roundtrip.finanziertePosten]).toEqual([...fixture.inputs.finanziertePosten]);
  });

  it('deserializes SerializedInputs fixtures to Decimals', () => {
    const fixture = FIXTURES[4];
    const inputs = deserialize(fixture.serialized);

    expect(inputs.kaufpreis instanceof Decimal).toBe(true);
    expect(inputs.steuerModulAktiv).toBe(true);
    expectDecimalEqual(inputs.gebaeudeanteilSatz!, new Decimal('0.8'));
    expectDecimalEqual(inputs.afaSatz!, new Decimal('0.02'));
  });
});
