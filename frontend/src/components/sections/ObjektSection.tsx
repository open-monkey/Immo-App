import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { de } from '@/i18n/de';
import type { InputsFormValues } from '@/schemas/inputs';
import { CurrencyInput } from '../ui/CurrencyInput';
import { NumberInput } from '../ui/NumberInput';
import { Section } from '../ui/Section';
import { useImmoStore } from '../../state/useImmoStore';
import { formatKPIValue } from '@/lib/formatting';

type Props = {
  register: UseFormRegister<InputsFormValues>;
  errors: FieldErrors<InputsFormValues>;
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

const message = (value: unknown) => (typeof value === 'string' ? value : undefined);

export function ObjektSection({ register, errors, isOpen, onToggle }: Props) {
  const kpis = useImmoStore((state) => state.result.kpis);

  return (
    <Section
      title={de.sections.objekt.title}
      description={de.sections.objekt.description}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="form-grid form-grid--three">
        <CurrencyInput label={de.fields.kaufpreis} error={message(errors.kaufpreis?.message)} {...register('kaufpreis')} />
        <NumberInput label={de.fields.wohnflaecheQm} suffix="m²" error={message(errors.wohnflaecheQm?.message)} {...register('wohnflaecheQm')} />
        <label className="form-field">
          <span className="form-label">{de.fields.bundesland}</span>
          <select className="text-input" {...register('bundesland')}>
            {['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'].map((bundesland) => (
              <option key={bundesland} value={bundesland}>
                {bundesland}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-grid form-grid--three" style={{ marginTop: 'var(--sp-3)' }}>
        <div className="form-field">
          <span className="form-label">Kaufpreis pro m²</span>
          <span className="computed-value">{kpis.kaufpreisProQm ? formatKPIValue(kpis.kaufpreisProQm) : '—'}</span>
        </div>
      </div>
    </Section>
  );
}
