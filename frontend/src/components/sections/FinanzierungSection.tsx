import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { de } from '@/i18n/de';
import type { InputsFormValues } from '@/schemas/inputs';
import { CurrencyInput } from '../ui/CurrencyInput';
import { IntegerInput } from '../ui/IntegerInput';
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

export function FinanzierungSection({ register, errors, values, isOpen, onToggle }: Props) {
  return (
    <Section title={de.sections.finanzierung.title} description={de.sections.finanzierung.description} isOpen={isOpen} onToggle={onToggle}>
      <div className="checkbox-grid" aria-label={de.fields.finanziertePosten}>
        <label><input type="checkbox" value="kaufpreis" {...register('finanziertePosten')} /> {de.financingOptions.kaufpreis}</label>
        <label><input type="checkbox" value="kaufnebenkosten" {...register('finanziertePosten')} /> {de.financingOptions.kaufnebenkosten}</label>
        <label><input type="checkbox" value="sanierung" {...register('finanziertePosten')} /> {de.financingOptions.sanierung}</label>
      </div>
      <div className="form-grid form-grid--three">
        <CurrencyInput label={de.fields.eigenkapital} error={message(errors.eigenkapital?.message)} {...register('eigenkapital')} />
        <IntegerInput label={de.fields.phase1Jahre} error={message(errors.phase1Jahre?.message)} {...register('phase1Jahre')} />
        <IntegerInput label={de.fields.tilgungsplanMaxJahre} error={message(errors.tilgungsplanMaxJahre?.message)} {...register('tilgungsplanMaxJahre')} />
        <PercentInput label={de.fields.phase1Sollzins} error={message(errors.phase1Sollzins?.message)} {...register('phase1Sollzins')} />
        <PercentInput label={de.fields.phase1AnfTilgung} error={message(errors.phase1AnfTilgung?.message)} {...register('phase1AnfTilgung')} />
        <CurrencyInput label={de.fields.phase1Sondertilgung} error={message(errors.phase1Sondertilgung?.message)} {...register('phase1Sondertilgung')} />
        <IntegerInput label={de.fields.phase2Jahre} error={message(errors.phase2Jahre?.message)} {...register('phase2Jahre')} />
        <PercentInput label={de.fields.phase2Sollzins} error={message(errors.phase2Sollzins?.message ?? errors.phase2AnfTilgung?.message)} {...register('phase2Sollzins')} />
        <PercentInput label={de.fields.phase2AnfTilgung} error={message(errors.phase2AnfTilgung?.message)} {...register('phase2AnfTilgung')} />
        <CurrencyInput label={de.fields.phase2Sondertilgung} error={message(errors.phase2Sondertilgung?.message)} {...register('phase2Sondertilgung')} />
        <PercentInput label={de.fields.phase3Sollzins} error={message(errors.phase3Sollzins?.message)} {...register('phase3Sollzins')} />
        <PercentInput label={de.fields.phase3AnfTilgung} error={message(errors.phase3AnfTilgung?.message)} {...register('phase3AnfTilgung')} />
        <CurrencyInput label={de.fields.phase3Sondertilgung} error={message(errors.phase3Sondertilgung?.message)} {...register('phase3Sondertilgung')} />
      </div>
      {Number(values.phase2Jahre) === 0 ? <p className="form-hint">Phase 2 ist deaktiviert, solange 0 Jahre gesetzt sind.</p> : null}
    </Section>
  );
}
