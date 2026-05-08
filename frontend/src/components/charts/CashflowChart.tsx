import type { ComputedResult } from '@/domain/finance/types';
import { formatValueByFormat } from '@/lib/formatting';

type Props = {
  data: ComputedResult['cashflows'];
};

export function CashflowChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="section-description">Keine Cashflow-Daten verfügbar.</p>;
  }

  const scrollable = data.length > 20;

  return (
    <div
      className="cashflow-table-wrapper"
      style={{
        fontSize: '0.9em',
        ...(scrollable ? { maxHeight: '480px', overflowY: 'auto' } : undefined),
      }}
    >
      <style>{`.cashflow-table-wrapper .data-table td, .cashflow-table-wrapper .data-table th { padding: 0.5rem 0.65rem; }`}</style>
      <table className="data-table">
        <thead>
          <tr>
            <th>Jahr</th>
            <th>Mieteinnahmen</th>
            <th>Bewirtschaftung</th>
            <th>Reinertrag</th>
            <th>Kapitaldienst</th>
            <th>Cashflow vor Steuern</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isNegative = row.cashflowVorSteuern.isNegative();
            return (
              <tr key={row.jahr}>
                <td>{row.jahr}</td>
                <td>{formatValueByFormat(row.effektiveJahresmiete, 'currency')}</td>
                <td>{formatValueByFormat(row.bewirtschaftungskosten, 'currency')}</td>
                <td>{formatValueByFormat(row.jahresreinertrag, 'currency')}</td>
                <td>{formatValueByFormat(row.kapitaldienst, 'currency')}</td>
                <td style={isNegative ? { color: 'var(--color-red, #dc2626)' } : undefined}>
                  {formatValueByFormat(row.cashflowVorSteuern, 'currency')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
