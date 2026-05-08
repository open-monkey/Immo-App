import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { de } from '@/i18n/de';
import type { InputsFormValues } from '@/schemas/inputs';
import { NumberInput } from '../ui/NumberInput';
import { PercentInput } from '../ui/PercentInput';
import { Section } from '../ui/Section';

type Props = {
  register: UseFormRegister<InputsFormValues>;
  errors: FieldErrors<InputsFormValues>;
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

const message = (value: unknown) => (typeof value === 'string' ? value : undefined);

export function RisikoSection({ register, errors, isOpen, onToggle }: Props) {
  return (
    <Section title={de.sections.risiko.title} description={de.sections.risiko.description} isOpen={isOpen} onToggle={onToggle}>
      <div className="form-grid form-grid--three">
        <NumberInput label={de.fields.leerstandsmonateProJahr} error={message(errors.leerstandsmonateProJahr?.message)} {...register('leerstandsmonateProJahr')} />
        <NumberInput label={de.fields.erstvermietungsleerstandMonate} error={message(errors.erstvermietungsleerstandMonate?.message)} {...register('erstvermietungsleerstandMonate')} />
        <PercentInput label={de.fields.mietausfallwagnisSatz} error={message(errors.mietausfallwagnisSatz?.message)} {...register('mietausfallwagnisSatz')} />
      </div>
    </Section>
  );
}
