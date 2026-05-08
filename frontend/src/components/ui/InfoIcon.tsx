import { Tooltip } from './Tooltip';

type InfoIconProps = {
  content: string;
  label?: string;
};

export function InfoIcon({ content, label = 'Info anzeigen' }: InfoIconProps) {
  return (
    <Tooltip content={content}>
      <button type="button" className="info-icon" aria-label={label}>
        i
      </button>
    </Tooltip>
  );
}
