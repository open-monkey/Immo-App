import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { de } from '@/i18n/de';
import type { InputsFormValues } from '@/schemas/inputs';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PercentInput } from '../ui/PercentInput';
import { Section } from '../ui/Section';

type Props = {
  register: UseFormRegister<InputsFormValues>;
  errors: FieldErrors<InputsFormValues>;
  values: InputsFormValues;
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

const message = (value: unknown) => (typeof value === 'string' ? value : undefined);

export function KaufnebenkostenSection({ register, errors, values, isOpen, onToggle }: Props) {
  const detailed = values.kaufnebenkostenModus === 'detailliert';

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
    </Section>
  );
}
