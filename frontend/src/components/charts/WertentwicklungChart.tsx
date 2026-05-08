import type { ComputedResult } from '@/domain/finance/types';
import { formatValueByFormat } from '@/lib/formatting';

type Props = {
  data: ComputedResult['marktwertReihe'];
};

export function WertentwicklungChart({ data }: Props) {
  return (
    <div className="valuation-chart-card">
      <div className="valuation-chart" role="img" aria-label="Wertentwicklung über die Jahre">
        {data.map((point) => (
          <div key={point.jahr} className="valuation-chart-bar-group" aria-hidden="true">
            <div
              className="valuation-chart-bar"
              style={{ height: `${Math.max(8, (point.jahr / Math.max(1, data.length - 1)) * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="valuation-chart-grid">
        {data.map((point) => (
          <div key={point.jahr} className="valuation-chart-row">
            <span>Jahr {point.jahr}</span>
            <strong>{formatValueByFormat(point.wert, 'currency')}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
