import Decimal from 'decimal.js-light';
import type { ImmoInputs } from './types';

export function createMarktwertReihe(inputs: ImmoInputs) {
  const startwert = inputs.kaufpreis.plus(inputs.sanierungskostenSumme.mul(inputs.sanierungWertanrechnungSatz));

  return Array.from({ length: inputs.betrachtungszeitraumJahre + 1 }, (_, index) => ({
    jahr: index,
    wert: startwert.mul(new Decimal(1).plus(inputs.wertsteigerungSatz).pow(index)),
  })) as { jahr: number; wert: Decimal }[];
}
