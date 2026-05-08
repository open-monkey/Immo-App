import type { KPIMetadata, KPIValue } from '@/domain/finance/types';

const decimalFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const factorFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const integerFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 0,
});

export function formatDecimalInput(value: string): string {
  return value.replace('.', ',');
}

export function formatValueByFormat(value: KPIValue['value'], format: KPIMetadata['format']): string {
  if (value === null) {
    return '—';
  }

  const numericValue = value.toNumber();

  switch (format) {
    case 'currency':
      return `${decimalFormatter.format(numericValue)} €`;
    case 'percent':
      return `${decimalFormatter.format(numericValue)} %`;
    case 'factor':
      return factorFormatter.format(numericValue);
    case 'integer':
      return integerFormatter.format(numericValue);
    case 'qm':
      return decimalFormatter.format(numericValue);
    default:
      return decimalFormatter.format(numericValue);
  }
}

export function formatKPIValue(kpi: KPIValue): string {
  return formatValueByFormat(kpi.value, kpi.metadata.format);
}
