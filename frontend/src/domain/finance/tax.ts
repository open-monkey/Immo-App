import Decimal from 'decimal.js-light';
import type { ImmoInputs } from './types';

type SteuerBerechnungsgrundlage = {
  inputs: ImmoInputs;
  jahresreinertrag: Decimal;
  zinsAnteil: Decimal;
};

function decimalOrZero(value: Decimal | undefined): Decimal {
  return value ?? new Decimal(0);
}

export function isSteuerModulAktivUndVollstaendig(inputs: ImmoInputs): boolean {
  return Boolean(
    inputs.steuerModulAktiv
    && inputs.persoenlicherSteuersatz
    && inputs.gebaeudeanteilSatz
    && inputs.afaSatz,
  );
}

export function computeAfaBasis(inputs: ImmoInputs): Decimal {
  if (!isSteuerModulAktivUndVollstaendig(inputs)) {
    return new Decimal(0);
  }

  return inputs.kaufpreis.mul(decimalOrZero(inputs.gebaeudeanteilSatz));
}

export function computeAfaJaehrlich(inputs: ImmoInputs): Decimal {
  if (!isSteuerModulAktivUndVollstaendig(inputs)) {
    return new Decimal(0);
  }

  return computeAfaBasis(inputs).mul(decimalOrZero(inputs.afaSatz));
}

export function computeSteuerlicherUeberschuss({
  inputs,
  jahresreinertrag,
  zinsAnteil,
}: SteuerBerechnungsgrundlage): Decimal {
  if (!isSteuerModulAktivUndVollstaendig(inputs)) {
    return new Decimal(0);
  }

  return jahresreinertrag.minus(zinsAnteil).minus(computeAfaJaehrlich(inputs));
}

export function computeSteuerlast(inputs: ImmoInputs, steuerlicherUeberschuss: Decimal): Decimal {
  if (!isSteuerModulAktivUndVollstaendig(inputs)) {
    return new Decimal(0);
  }

  return steuerlicherUeberschuss.mul(decimalOrZero(inputs.persoenlicherSteuersatz));
}
