import { forwardRef, type InputHTMLAttributes } from 'react';
import { NumberInput } from './NumberInput';

type PercentInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(function PercentInput(props, ref) {
  return <NumberInput {...props} ref={ref} suffix="%" />;
});
