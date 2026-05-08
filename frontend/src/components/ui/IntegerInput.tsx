import { forwardRef, type InputHTMLAttributes } from 'react';
import { NumberInput } from './NumberInput';

type IntegerInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const IntegerInput = forwardRef<HTMLInputElement, IntegerInputProps>(function IntegerInput(props, ref) {
  return <NumberInput {...props} ref={ref} inputMode="numeric" />;
});
