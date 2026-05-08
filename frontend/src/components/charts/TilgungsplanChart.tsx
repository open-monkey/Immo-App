import type { ComputedResult } from '@/domain/finance/types';
import { formatValueByFormat } from '@/lib/formatting';

type Props = {
  data: ComputedResult['amortization'];
};

export function TilgungsplanChart({ data }: Props) {
  const { rows } = data;

  if (rows.length === 0) {
    return <p className="section-description">Keine Tilgungsdaten verfügbar.</p>;
  }

  const scrollable = rows.length > 20;

  return (
    <div
      className="tilgungsplan-table-wrapper"
      style={{
        fontSize: '0.9em',
        ...(scrollable ? { maxHeight: '480px', overflowY: 'auto' } : undefined),
      }}
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>Jahr</th>
            <th>Phase</th>
            <th>Restschuld Anfang</th>
            <th>Zins</th>
            <th>Tilgung</th>
            <th>Sondertilgung</th>
            <th>Kapitaldienst</th>
            <th>Restschuld Ende</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const phaseStart = idx === 0 || rows[idx - 1].phase !== row.phase;
            return (
              <tr
                key={row.jahr}
                data-phase={row.phase}
                style={phaseStart && idx > 0 ? { borderTop: '2px solid var(--color-border, #e5e7eb)' } : undefined}
              >
                <td>{row.jahr}</td>
                <td>{row.phase}</td>
                <td>{formatValueByFormat(row.restschuldAnfang, 'currency')}</td>
                <td>{formatValueByFormat(row.zinsAnteil, 'currency')}</td>
                <td>{formatValueByFormat(row.tilgungAnteil, 'currency')}</td>
                <td>{formatValueByFormat(row.sondertilgung, 'currency')}</td>
                <td>{formatValueByFormat(row.kapitaldienst, 'currency')}</td>
                <td>{formatValueByFormat(row.restschuldEnde, 'currency')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
