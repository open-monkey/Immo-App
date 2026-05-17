import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { de } from '@/i18n/de';
import type { InputsFormValues } from '@/schemas/inputs';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PercentInput } from '../ui/PercentInput';
import { Section } from '../ui/Section';

import { useMemo } from 'react';

type Props = {
  register: UseFormRegister<InputsFormValues>;
  errors: FieldErrors<InputsFormValues>;
  values: InputsFormValues;
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

const message = (value: unknown) => (typeof value === 'string' ? value : undefined);

function parseNumber(value: string): number {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

function computeKaufnebenkostenSumme(values: InputsFormValues): number {
  if (values.kaufnebenkostenModus === 'vereinfacht') {
    return parseNumber(values.kaufnebenkostenSumme);
  }
  const kaufpreis = parseNumber(values.kaufpreis);
  const grew = kaufpreis * (parseNumber(values.grunderwerbsteuerSatz) / 100);
  const notar = kaufpreis * (parseNumber(values.notarGrundbuchSatz) / 100);
  const makler = kaufpreis * (parseNumber(values.maklerprovisionSatz) / 100);
  return grew + notar + makler;
}

const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function KaufnebenkostenSection({ register, errors, values, isOpen, onToggle }: Props) {
  const detailed = values.kaufnebenkostenModus === 'detailliert';
  const summe = useMemo(() => computeKaufnebenkostenSumme(values), [values.kaufpreis, values.kaufnebenkostenModus, values.kaufnebenkostenSumme, values.grunderwerbsteuerSatz, values.notarGrundbuchSatz, values.maklerprovisionSatz]);

  return (
    <Section
      title={de.sections.kaufnebenkosten.title}
      description={de.sections.kaufnebenkosten.description}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="radio-row" role="radiogroup" aria-label={de.fields.kaufnebenkostenModus}>
        <label><input type="radio" value="vereinfacht" {...register('kaufnebenkostenModus')} /> {de.modes.simplified}</label>
        <label><input type="radio" value="detailliert" {...register('kaufnebenkostenModus')} /> {de.modes.detailed}</label>
      </div>
      {detailed ? (
        <div className="form-grid form-grid--three">
          <PercentInput label={de.fields.grunderwerbsteuerSatz} error={message(errors.grunderwerbsteuerSatz?.message)} {...register('grunderwerbsteuerSatz')} />
          <PercentInput label={de.fields.notarGrundbuchSatz} error={message(errors.notarGrundbuchSatz?.message)} {...register('notarGrundbuchSatz')} />
          <PercentInput label={de.fields.maklerprovisionSatz} error={message(errors.maklerprovisionSatz?.message)} {...register('maklerprovisionSatz')} />
        </div>
      ) : (
        <div className="form-grid">
          <CurrencyInput label={de.fields.kaufnebenkostenSumme} error={message(errors.kaufnebenkostenSumme?.message)} {...register('kaufnebenkostenSumme')} />
        </div>
      )}
      <p className="form-hint" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
        Summe Kaufnebenkosten: <strong>{currencyFmt.format(summe)}</strong>
      </p>
    </Section>
  );
}
