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

export function KostenSection({ register, errors, values, isOpen, onToggle }: Props) {
  const detailed = values.kostenModus === 'detailliert';

  return (
    <Section title={de.sections.kosten.title} description={de.sections.kosten.description} isOpen={isOpen} onToggle={onToggle}>
      <div className="radio-row" role="radiogroup" aria-label={de.fields.kostenModus}>
        <label><input type="radio" value="vereinfacht" {...register('kostenModus')} /> {de.modes.simplified}</label>
        <label><input type="radio" value="detailliert" {...register('kostenModus')} /> {de.modes.detailed}</label>
      </div>
      {detailed ? (
        <div className="form-grid form-grid--three">
          <CurrencyInput label={de.fields.hausgeldNichtUmlagefaehigPa} error={message(errors.hausgeldNichtUmlagefaehigPa?.message)} {...register('hausgeldNichtUmlagefaehigPa')} />
          <CurrencyInput label={de.fields.verwaltungskostenPa} error={message(errors.verwaltungskostenPa?.message)} {...register('verwaltungskostenPa')} />
          <CurrencyInput label={de.fields.versicherungenPa} error={message(errors.versicherungenPa?.message)} {...register('versicherungenPa')} />
          <CurrencyInput label={de.fields.sonstigeKostenPa} error={message(errors.sonstigeKostenPa?.message)} {...register('sonstigeKostenPa')} />
          <CurrencyInput label={de.fields.instandhaltungskostenPa} error={message(errors.instandhaltungskostenPa?.message)} {...register('instandhaltungskostenPa')} />
          <PercentInput label={de.fields.kostensteigerungSatz} error={message(errors.kostensteigerungSatz?.message)} {...register('kostensteigerungSatz')} />
        </div>
      ) : (
        <div className="form-grid form-grid--two">
          <CurrencyInput label={de.fields.nichtUmlagefaehigeKostenSumme} error={message(errors.nichtUmlagefaehigeKostenSumme?.message)} {...register('nichtUmlagefaehigeKostenSumme')} />
          <CurrencyInput label={de.fields.instandhaltungskostenPa} error={message(errors.instandhaltungskostenPa?.message)} {...register('instandhaltungskostenPa')} />
        </div>
      )}
    </Section>
  );
}
