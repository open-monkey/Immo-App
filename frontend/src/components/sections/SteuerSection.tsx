import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { de } from '@/i18n/de';
import type { InputsFormValues } from '@/schemas/inputs';
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

export function SteuerSection({ register, errors, values, isOpen, onToggle }: Props) {
  return (
    <Section
      title={de.sections.steuer.title}
      description={de.sections.steuer.description}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="checkbox-grid" aria-label={de.fields.steuerModulAktiv}>
        <label>
          <input type="checkbox" {...register('steuerModulAktiv')} /> {de.fields.steuerModulAktiv}
        </label>
      </div>

      {values.steuerModulAktiv ? (
        <div className="form-grid form-grid--three">
          <PercentInput
            label={de.fields.persoenlicherSteuersatz}
            error={message(errors.persoenlicherSteuersatz?.message)}
            hint="Nur für die separate Steuerbetrachtung, nicht für Vor-Steuer-KPIs."
            {...register('persoenlicherSteuersatz')}
          />
          <PercentInput
            label={de.fields.gebaeudeanteilSatz}
            error={message(errors.gebaeudeanteilSatz?.message)}
            hint="Anteil des Kaufpreises, der steuerlich als Gebäude angesetzt wird."
            {...register('gebaeudeanteilSatz')}
          />
          <PercentInput
            label={de.fields.afaSatz}
            error={message(errors.afaSatz?.message)}
            hint="Lineare Abschreibung pro Jahr, z. B. 2,00 %."
            {...register('afaSatz')}
          />
        </div>
      ) : (
        <p className="form-hint">Steuerberechnung bleibt deaktiviert, bis du das Modul aktivierst.</p>
      )}
    </Section>
  );
}
