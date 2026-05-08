import Decimal from 'decimal.js-light';
import { describe, expect, it } from 'vitest';
import { GREW_BY_BUNDESLAND, defaultsBW } from '../defaults';

describe('defaultsBW', () => {
  it('uses the documented BW defaults', () => {
    expect(defaultsBW.bundesland).toBe('BW');
    expect(defaultsBW.kaufnebenkostenModus).toBe('detailliert');
    expect(defaultsBW.kostenModus).toBe('detailliert');
    expect(defaultsBW.grunderwerbsteuerSatz?.equals(new Decimal('0.05'))).toBe(true);
    expect(defaultsBW.notarGrundbuchSatz?.equals(new Decimal('0.015'))).toBe(true);
    expect(defaultsBW.maklerprovisionSatz?.equals(new Decimal('0.0357'))).toBe(true);
  });

  it('provides the bundesland lookup for BW and NRW', () => {
    expect(GREW_BY_BUNDESLAND.BW).toBe(0.05);
    expect(GREW_BY_BUNDESLAND.NW).toBe(0.065);
  });
});
