import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { de } from '@/i18n/de';
import type { InputsFormValues } from '@/schemas/inputs';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PercentInput } from '../ui/PercentInput';
import { Section } from '../ui/Section';

type Props = {
  register: UseFormRegister<InputsFormValues>;
  errors: FieldErrors<InputsFormValues>;
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

const message = (value: unknown) => (typeof value === 'string' ? value : undefined);

export function SanierungSection({ register, errors, isOpen, onToggle }: Props) {
  return (
    <Section title={de.sections.sanierung.title} description={de.sections.sanierung.description} isOpen={isOpen} onToggle={onToggle}>
      <div className="form-grid form-grid--two">
        <CurrencyInput label={de.fields.sanierungskostenSumme} error={message(errors.sanierungskostenSumme?.message)} {...register('sanierungskostenSumme')} />
        <PercentInput label={de.fields.sanierungWertanrechnungSatz} error={message(errors.sanierungWertanrechnungSatz?.message)} {...register('sanierungWertanrechnungSatz')} />
      </div>
    </Section>
  );
}
