type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
};

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  const inputId = id ?? `toggle-${label.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`;

  return (
    <label htmlFor={inputId} className="toggle-field">
      <input id={inputId} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
