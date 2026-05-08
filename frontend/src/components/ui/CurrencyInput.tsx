import { forwardRef, useRef, useEffect, useCallback, type InputHTMLAttributes } from 'react';
import { NumberInput } from './NumberInput';

const integerFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatEuroValue(raw: string): string {
  if (!raw) return '';
  const normalized = raw.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return raw;
  return Number.isInteger(num) ? integerFormatter.format(num) : decimalFormatter.format(num);
}

function parseEuroInput(input: string): string {
  if (input.includes(',')) {
    return input.replace(/\./g, '').replace(',', '.');
  }
  const lastDotIndex = input.lastIndexOf('.');
  if (lastDotIndex === -1) return input;
  const afterDot = input.slice(lastDotIndex + 1);
  if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
    return input;
  }
  return input.replace(/\./g, '');
}

type CurrencyInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(props, forwardedRef) {
  const { onChange: registeredOnChange, onBlur: registeredOnBlur, onFocus: userOnFocus, ...rest } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(inputRef.current);
    } else if (forwardedRef) {
      (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = inputRef.current;
    }
  }, [forwardedRef]);

  useEffect(() => {
    const el = inputRef.current;
    if (el && el.value) {
      const raw = parseEuroInput(el.value);
      el.value = formatEuroValue(raw);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseEuroInput(e.target.value);
    if (registeredOnChange) {
      const syntheticEvent = {
        target: {
          value: raw,
          name: e.target.name,
        },
        type: 'change',
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      registeredOnChange(syntheticEvent);
    }
  }, [registeredOnChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const raw = parseEuroInput(e.target.value);
    e.target.value = raw.replace('.', ',');
    userOnFocus?.(e);
  }, [userOnFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const raw = parseEuroInput(e.target.value);
    e.target.value = raw ? formatEuroValue(raw) : '';
    registeredOnBlur?.(e);
  }, [registeredOnBlur]);

  return (
    <NumberInput
      {...rest}
      ref={inputRef}
      suffix="€"
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});
