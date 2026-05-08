import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/build/pdfmake';
import type Decimal from 'decimal.js-light';
import type { ComputedResult, ImmoInputs } from '@/domain/finance/types';

const KPI_CATEGORY_ORDER: readonly string[] = [
  'Schnellsicht', 'Cashflow', 'Risiko', 'Rendite', 'Break-even',
  'Markt', 'Finanzierung', 'Wertentwicklung', 'Steuer',
];

const curFmt = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

function numFmt(value: number, decimals: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatKPIForPDF(value: Decimal | null, format: string, decimals: number): string {
  if (value === null) return '—';
  const n = value.toNumber();
  switch (format) {
    case 'currency': return `${curFmt.format(n)} €`;
    case 'percent':  return `${numFmt(n, decimals)} %`;
    case 'factor':   return numFmt(n, decimals);
    case 'integer':  return intFmt.format(n);
    case 'qm':       return `${numFmt(n, decimals)} qm`;
    default:         return numFmt(n, decimals);
  }
}

function c(val: Decimal): string {
  return `${curFmt.format(val.toNumber())} €`;
}

function p(val: Decimal): string {
  return `${numFmt(val.toNumber() * 100, 2)} %`;
}

const AMPEL_COLOR: Record<string, string> = {
  green: '#16a34a',
  yellow: '#ca8a04',
  red: '#dc2626',
};

const AMPEL_LABEL: Record<string, string> = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
};

function th(text: string, alignment = 'left'): Record<string, unknown> {
  return { text, style: 'tableHeader', alignment };
}

export function generateReportPDF(inputs: ImmoInputs, result: ComputedResult): TDocumentDefinitions {
  const dateStr = new Date().toLocaleDateString('de-DE');
  const { intermediates, kpis, amortization, cashflows, decision } = result;

  // Build KPI sections grouped by category
  const kpiContent: unknown[] = [];
  for (const cat of KPI_CATEGORY_ORDER) {
    const catKPIs = Object.values(kpis).filter(
      (kpi) => kpi.metadata.kategorie === cat && kpi.value !== null,
    );
    if (catKPIs.length === 0) continue;

    kpiContent.push({ text: cat, style: 'categoryHeader' });
    kpiContent.push({
      table: {
        widths: ['*', 'auto', 'auto'],
        body: [
          [th('KPI'), th('Wert', 'right'), th('Einheit')],
          ...catKPIs.map((kpi) => [
            [
              { text: kpi.metadata.displayName, bold: true, fontSize: 9 },
              { text: kpi.metadata.formel, fontSize: 7, color: '#6b7280' },
            ],
            {
              text: formatKPIForPDF(kpi.value, kpi.metadata.format, kpi.metadata.decimals),
              fontSize: 9,
              alignment: 'right',
            },
            { text: kpi.metadata.einheit, fontSize: 9 },
          ]),
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 10],
    });
  }

  // Amortization table body
  const amortBody: unknown[][] = [
    [
      th('Jahr'), th('Phase'),
      th('Restschuld Anfang', 'right'), th('Zins', 'right'), th('Tilgung', 'right'),
      th('Sondertilgung', 'right'), th('Kapitaldienst', 'right'), th('Restschuld Ende', 'right'),
    ],
    ...amortization.rows.map((row) => [
      { text: row.jahr.toString(), fontSize: 8 },
      { text: `P${row.phase}`, fontSize: 8 },
      { text: c(row.restschuldAnfang), fontSize: 8, alignment: 'right' },
      { text: c(row.zinsAnteil), fontSize: 8, alignment: 'right' },
      { text: c(row.tilgungAnteil), fontSize: 8, alignment: 'right' },
      { text: c(row.sondertilgung), fontSize: 8, alignment: 'right' },
      { text: c(row.kapitaldienst), fontSize: 8, alignment: 'right' },
      { text: c(row.restschuldEnde), fontSize: 8, alignment: 'right' },
    ]),
  ];

  // Cashflow table body
  const cfBody: unknown[][] = [
    [
      th('Jahr'),
      th('Mieteinnahmen', 'right'), th('Bewirtschaftung', 'right'),
      th('Reinertrag', 'right'), th('Kapitaldienst', 'right'), th('Cashflow vor Steuern', 'right'),
    ],
    ...cashflows.map((cf) => [
      { text: cf.jahr.toString(), fontSize: 9 },
      { text: c(cf.jahresnettokaltmiete), fontSize: 9, alignment: 'right' },
      { text: c(cf.bewirtschaftungskosten), fontSize: 9, alignment: 'right' },
      { text: c(cf.jahresreinertrag), fontSize: 9, alignment: 'right' },
      { text: c(cf.kapitaldienst), fontSize: 9, alignment: 'right' },
      { text: c(cf.cashflowVorSteuern), fontSize: 9, alignment: 'right' },
    ]),
  ];

  const riskDriverItems: unknown[] = decision.riskDrivers.length > 0
    ? [
        { text: 'Risikotreiber:', bold: true, fontSize: 10, margin: [0, 0, 0, 4] },
        { ul: decision.riskDrivers, fontSize: 10, margin: [0, 0, 0, 16] },
      ]
    : [];

  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    styles: {
      title: { fontSize: 22, bold: true, margin: [0, 0, 0, 4] },
      date: { fontSize: 10, color: '#6b7280', margin: [0, 0, 0, 16] },
      sectionTitle: { fontSize: 14, bold: true, margin: [0, 12, 0, 8] },
      categoryHeader: { fontSize: 11, bold: true, color: '#1d4ed8', margin: [0, 10, 0, 4] },
      tableHeader: { bold: true, fontSize: 9, fillColor: '#f3f4f6' },
    },
    content: [
      // Page 1: Summary
      { text: 'Immo-Berechnung', style: 'title' },
      { text: dateStr, style: 'date' },
      {
        columns: [
          { text: [{ text: 'Kaufpreis: ', bold: true }, c(inputs.kaufpreis)], fontSize: 10 },
          { text: [{ text: 'Wohnfläche: ', bold: true }, `${inputs.wohnflaecheQm.toString()} m²`], fontSize: 10 },
          { text: [{ text: 'Bundesland: ', bold: true }, inputs.bundesland], fontSize: 10 },
        ],
        margin: [0, 0, 0, 16],
      },

      // Eingaben
      { text: 'Eingaben', style: 'sectionTitle' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Kaufpreis', { text: c(inputs.kaufpreis), alignment: 'right' }],
            ['Wohnfläche', { text: `${inputs.wohnflaecheQm.toString()} m²`, alignment: 'right' }],
            ['Bundesland', inputs.bundesland],
            ['Eigenkapital', { text: c(inputs.eigenkapital), alignment: 'right' }],
            ['Fremdkapital', { text: c(intermediates.fremdkapital), alignment: 'right' }],
            ['Gesamtkapitalbedarf', { text: c(intermediates.gesamtkapitalbedarf), alignment: 'right' }],
            ['Monatliche Nettokaltmiete', { text: c(inputs.monatsnettokaltmiete), alignment: 'right' }],
            ['Phase 1 Sollzins', { text: p(inputs.phase1Sollzins), alignment: 'right' }],
            ['Phase 1 anfängliche Tilgung', { text: p(inputs.phase1AnfTilgung), alignment: 'right' }],
            ['Betrachtungszeitraum', { text: `${inputs.betrachtungszeitraumJahre} Jahre`, alignment: 'right' }],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
        fontSize: 10,
      },

      // KPI sections
      { text: 'KPI-Ergebnisse', style: 'sectionTitle' },
      ...kpiContent,

      // Decision
      { text: 'Ampel-Entscheidung', style: 'sectionTitle' },
      {
        text: `Ampel: ${AMPEL_LABEL[decision.ampel] ?? decision.ampel}`,
        fontSize: 13,
        bold: true,
        color: AMPEL_COLOR[decision.ampel] ?? '#000000',
        margin: [0, 0, 0, 8],
      },
      { text: decision.summary, fontSize: 10, margin: [0, 0, 0, 8] },
      ...riskDriverItems,

      // Page 2: Tables
      { text: 'Tilgungsplan', style: 'sectionTitle', pageBreak: 'before' },
      {
        table: { widths: ['auto', 'auto', '*', '*', '*', '*', '*', '*'], body: amortBody },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      },

      { text: 'Jährliche Cashflows', style: 'sectionTitle' },
      {
        table: { widths: ['auto', '*', '*', '*', '*', '*'], body: cfBody },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      },
    ],
  } as TDocumentDefinitions;
}

export function exportPDF(inputs: ImmoInputs, result: ComputedResult): void {
  pdfMake.vfs = pdfFonts.vfs;
  const docDefinition = generateReportPDF(inputs, result);
  pdfMake.createPdf(docDefinition).download('immo-berechnung.pdf');
}
