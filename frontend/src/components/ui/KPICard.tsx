import { formatKPIValue } from '../../lib/formatting';
import type { KPIValue } from '../../domain/finance/types';
import { InfoIcon } from './InfoIcon';

type KPICardProps = {
  kpi: KPIValue;
  status?: 'neutral' | 'success' | 'warning' | 'danger';
  subtitle?: string;
};

export function KPICard({ kpi, status = 'neutral', subtitle }: KPICardProps) {
  const tooltip = `${kpi.metadata.formel}\n${kpi.metadata.bedeutung}\nEingaben: ${kpi.metadata.eingaben.join(', ')}`;

  return (
    <article className={`kpi-card kpi-card--${status}`}>
      <div className="kpi-card-header">
        <span className="kpi-card-title">{kpi.metadata.displayName}</span>
        <InfoIcon content={tooltip} label={`${kpi.metadata.displayName} erklären`} />
      </div>
      <strong className="kpi-card-value">{formatKPIValue(kpi)}</strong>
      {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
      {kpi.warnings?.length ? <p className="kpi-card-warning">{kpi.warnings.join(', ')}</p> : null}
    </article>
  );
}
