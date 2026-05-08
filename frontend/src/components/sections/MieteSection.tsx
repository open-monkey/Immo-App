import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
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
  control: Control<InputsFormValues>;
};

const message = (value: unknown) => (typeof value === 'string' ? value : undefined);

function formatKaltmieteProQm(monatsnettokaltmiete: string | undefined, wohnflaecheQm: string | undefined): string {
  const flaeche = parseFloat(wohnflaecheQm ?? '');
  if (!flaeche || flaeche <= 0) return '—';
  const miete = parseFloat(monatsnettokaltmiete ?? '');
  if (!isFinite(miete)) return '—';
  const result = miete / flaeche;
  return `${result.toFixed(2).replace('.', ',')} €/m²`;
}

export function MieteSection({ register, errors, isOpen, onToggle, control }: Props) {
  const monatsnettokaltmiete = useWatch({ control, name: 'monatsnettokaltmiete' });
  const wohnflaecheQm = useWatch({ control, name: 'wohnflaecheQm' });
  const kaltmieteProQm = formatKaltmieteProQm(monatsnettokaltmiete, wohnflaecheQm);

  return (
    <Section title={de.sections.miete.title} description={de.sections.miete.description} isOpen={isOpen} onToggle={onToggle}>
      <div className="form-grid form-grid--two">
        <CurrencyInput label={de.fields.monatsnettokaltmiete} error={message(errors.monatsnettokaltmiete?.message)} {...register('monatsnettokaltmiete')} />
        <PercentInput label={de.fields.mietsteigerungSatz} error={message(errors.mietsteigerungSatz?.message)} {...register('mietsteigerungSatz')} />
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#6b7280' }}>
        <span>Kaltmiete: </span>
        <span>{kaltmieteProQm}</span>
      </div>
    </Section>
  );
}
