import { forwardRef, type InputHTMLAttributes } from 'react';

type NumberInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  suffix?: string;
};

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { label, error, hint, suffix, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`;

  return (
    <label className="form-field" htmlFor={inputId}>
      <span className="form-label">{label}</span>
      <span className="input-shell">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="text"
          inputMode="decimal"
          className={`text-input ${error ? 'text-input--error' : ''} ${className}`.trim()}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        />
        {suffix ? <span className="input-suffix">{suffix}</span> : null}
      </span>
      {hint ? <span id={`${inputId}-hint`} className="form-hint">{hint}</span> : null}
      {error ? <span id={`${inputId}-error`} className="form-error">{error}</span> : null}
    </label>
  );
});
