import Decimal from 'decimal.js-light';
import { z } from 'zod';
import { GREW_BY_BUNDESLAND, defaultsBW } from '@/domain/finance/defaults';
import type {
  Bundesland,
  FinanzierterPosten,
  ImmoInputs,
  KaufnebenkostenModus,
  KostenModus,
} from '@/domain/finance/types';

const BUNDESLAENDER = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] as const;
const FINANZIERTE_POSTEN: readonly FinanzierterPosten[] = ['kaufpreis', 'kaufnebenkosten', 'sanierung'] as const;

function decimalToString(decimal: Decimal | undefined, decimals = 2): string {
  return decimal ? decimal.toFixed(decimal.decimalPlaces() > decimals ? decimal.decimalPlaces() : decimals) : '';
}

function percentToUiString(decimal: Decimal | undefined): string {
  return decimal ? decimal.mul(100).toFixed(2) : '';
}

function normalizeDecimalInput(value: string): string {
  const trimmed = value.trim();

  if (trimmed.includes(',')) {
    return trimmed.replace(/\./g, '').replace(',', '.');
  }

  const dotCount = (trimmed.match(/\./g) || []).length;
  if (dotCount > 1) {
    return trimmed.replace(/\./g, '');
  }

  const lastDotIndex = trimmed.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    const afterDot = trimmed.slice(lastDotIndex + 1);
    if (afterDot.length >= 3 && /^\d+$/.test(afterDot)) {
      return trimmed.replace(/\./g, '');
    }
  }

  return trimmed;
}

function parseDecimal(value: string): Decimal {
  return new Decimal(normalizeDecimalInput(value));
}

function tryParseDecimal(value: string): Decimal | null {
  try {
    return new Decimal(normalizeDecimalInput(value));
  } catch {
    return null;
  }
}

const decimalStringField = z.string().trim().min(1, 'Pflichtfeld').refine((value) => tryParseDecimal(value) !== null, 'Keine gültige Zahl');

const nonNegativeDecimalField = decimalStringField.refine((value) => {
  const decimal = tryParseDecimal(value);
  return decimal !== null && decimal.gte(0);
}, 'Muss ≥ 0 sein');
const positiveDecimalField = decimalStringField.refine((value) => {
  const decimal = tryParseDecimal(value);
  return decimal !== null && decimal.gt(0);
}, 'Muss > 0 sein');
const percentField = decimalStringField.refine((value) => {
  const decimal = tryParseDecimal(value);
  return decimal !== null && decimal.gte(0) && decimal.lte(100);
}, 'Wert außerhalb 0–100 %');
const integerField = z.string().trim().min(1, 'Pflichtfeld').refine((value) => /^\d+$/.test(value), 'Ganze Zahl erforderlich');

export type InputsFormValues = {
  kaufpreis: string;
  wohnflaecheQm: string;
  bundesland: Bundesland;
  kaufnebenkostenModus: KaufnebenkostenModus;
  kaufnebenkostenSumme: string;
  grunderwerbsteuerSatz: string;
  notarGrundbuchSatz: string;
  maklerprovisionSatz: string;
  sanierungskostenSumme: string;
  sanierungWertanrechnungSatz: string;
  eigenkapital: string;
  finanziertePosten: FinanzierterPosten[];
  phase1Jahre: string;
  phase1Sollzins: string;
  phase1AnfTilgung: string;
  phase1Sondertilgung: string;
  phase2Jahre: string;
  phase2Sollzins: string;
  phase2AnfTilgung: string;
  phase2Sondertilgung: string;
  phase3Sollzins: string;
  phase3AnfTilgung: string;
  phase3Sondertilgung: string;
  tilgungsplanMaxJahre: string;
  monatsnettokaltmiete: string;
  mietsteigerungSatz: string;
  kostenModus: KostenModus;
  nichtUmlagefaehigeKostenSumme: string;
  hausgeldNichtUmlagefaehigPa: string;
  verwaltungskostenPa: string;
  versicherungenPa: string;
  sonstigeKostenPa: string;
  instandhaltungskostenPa: string;
  kostensteigerungSatz: string;
  leerstandsmonateProJahr: string;
  erstvermietungsleerstandMonate: string;
  mietausfallwagnisSatz: string;
  steuerModulAktiv: boolean;
  persoenlicherSteuersatz: string;
  gebaeudeanteilSatz: string;
  afaSatz: string;
  betrachtungszeitraumJahre: string;
  wertsteigerungSatz: string;
};

export const InputsSchema = z.object({
  kaufpreis: positiveDecimalField,
  wohnflaecheQm: positiveDecimalField,
  bundesland: z.enum(BUNDESLAENDER),
  kaufnebenkostenModus: z.enum(['vereinfacht', 'detailliert']),
  kaufnebenkostenSumme: nonNegativeDecimalField.or(z.literal('')),
  grunderwerbsteuerSatz: percentField.or(z.literal('')),
  notarGrundbuchSatz: percentField.or(z.literal('')),
  maklerprovisionSatz: percentField.or(z.literal('')),
  sanierungskostenSumme: nonNegativeDecimalField,
  sanierungWertanrechnungSatz: percentField,
  eigenkapital: nonNegativeDecimalField,
  finanziertePosten: z.array(z.enum(FINANZIERTE_POSTEN as [FinanzierterPosten, ...FinanzierterPosten[]])).min(1, 'Mindestens ein Posten'),
  phase1Jahre: integerField,
  phase1Sollzins: percentField,
  phase1AnfTilgung: percentField,
  phase1Sondertilgung: nonNegativeDecimalField,
  phase2Jahre: integerField,
  phase2Sollzins: percentField.or(z.literal('')),
  phase2AnfTilgung: percentField.or(z.literal('')),
  phase2Sondertilgung: nonNegativeDecimalField,
  phase3Sollzins: percentField,
  phase3AnfTilgung: percentField,
  phase3Sondertilgung: nonNegativeDecimalField,
  tilgungsplanMaxJahre: integerField,
  monatsnettokaltmiete: nonNegativeDecimalField,
  mietsteigerungSatz: percentField,
  kostenModus: z.enum(['vereinfacht', 'detailliert']),
  nichtUmlagefaehigeKostenSumme: nonNegativeDecimalField.or(z.literal('')),
  hausgeldNichtUmlagefaehigPa: nonNegativeDecimalField.or(z.literal('')),
  verwaltungskostenPa: nonNegativeDecimalField.or(z.literal('')),
  versicherungenPa: nonNegativeDecimalField.or(z.literal('')),
  sonstigeKostenPa: nonNegativeDecimalField.or(z.literal('')),
  instandhaltungskostenPa: nonNegativeDecimalField,
  kostensteigerungSatz: percentField,
  leerstandsmonateProJahr: nonNegativeDecimalField,
  erstvermietungsleerstandMonate: nonNegativeDecimalField,
  mietausfallwagnisSatz: percentField,
  steuerModulAktiv: z.boolean(),
  persoenlicherSteuersatz: percentField.or(z.literal('')),
  gebaeudeanteilSatz: percentField.or(z.literal('')),
  afaSatz: percentField.or(z.literal('')),
  betrachtungszeitraumJahre: integerField,
  wertsteigerungSatz: percentField,
}).superRefine((data, ctx) => {
  if (data.kaufnebenkostenModus === 'vereinfacht' && data.kaufnebenkostenSumme === '') {
    ctx.addIssue({ code: 'custom', path: ['kaufnebenkostenSumme'], message: 'Pflichtfeld im vereinfachten Modus' });
  }

  if (data.kaufnebenkostenModus === 'detailliert' && data.grunderwerbsteuerSatz === '') {
    ctx.addIssue({ code: 'custom', path: ['grunderwerbsteuerSatz'], message: 'Pflichtfeld im detaillierten Modus' });
  }

  if (data.kostenModus === 'vereinfacht' && data.nichtUmlagefaehigeKostenSumme === '') {
    ctx.addIssue({ code: 'custom', path: ['nichtUmlagefaehigeKostenSumme'], message: 'Pflichtfeld im vereinfachten Modus' });
  }

  if (data.kostenModus === 'detailliert' && data.hausgeldNichtUmlagefaehigPa === '') {
    ctx.addIssue({ code: 'custom', path: ['hausgeldNichtUmlagefaehigPa'], message: 'Pflichtfeld im detaillierten Modus' });
  }

  if (Number(data.phase2Jahre) > 0 && (data.phase2Sollzins === '' || data.phase2AnfTilgung === '')) {
    ctx.addIssue({ code: 'custom', path: ['phase2Sollzins'], message: 'Pflichtfeld bei aktiver Phase 2' });
  }

  if (data.steuerModulAktiv && (data.persoenlicherSteuersatz === '' || data.gebaeudeanteilSatz === '' || data.afaSatz === '')) {
    ctx.addIssue({ code: 'custom', path: ['persoenlicherSteuersatz'], message: 'Pflichtfeld bei aktivem Steuermodul' });
  }
});

export function createFormValuesFromInputs(inputs: ImmoInputs): InputsFormValues {
  return {
    kaufpreis: decimalToString(inputs.kaufpreis),
    wohnflaecheQm: decimalToString(inputs.wohnflaecheQm),
    bundesland: inputs.bundesland,
    kaufnebenkostenModus: inputs.kaufnebenkostenModus,
    kaufnebenkostenSumme: decimalToString(inputs.kaufnebenkostenSumme),
    grunderwerbsteuerSatz: percentToUiString(inputs.grunderwerbsteuerSatz),
    notarGrundbuchSatz: percentToUiString(inputs.notarGrundbuchSatz),
    maklerprovisionSatz: percentToUiString(inputs.maklerprovisionSatz),
    sanierungskostenSumme: decimalToString(inputs.sanierungskostenSumme),
    sanierungWertanrechnungSatz: percentToUiString(inputs.sanierungWertanrechnungSatz),
    eigenkapital: decimalToString(inputs.eigenkapital),
    finanziertePosten: Array.from(inputs.finanziertePosten),
    phase1Jahre: String(inputs.phase1Jahre),
    phase1Sollzins: percentToUiString(inputs.phase1Sollzins),
    phase1AnfTilgung: percentToUiString(inputs.phase1AnfTilgung),
    phase1Sondertilgung: decimalToString(inputs.phase1Sondertilgung),
    phase2Jahre: String(inputs.phase2Jahre),
    phase2Sollzins: percentToUiString(inputs.phase2Sollzins),
    phase2AnfTilgung: percentToUiString(inputs.phase2AnfTilgung),
    phase2Sondertilgung: decimalToString(inputs.phase2Sondertilgung),
    phase3Sollzins: percentToUiString(inputs.phase3Sollzins),
    phase3AnfTilgung: percentToUiString(inputs.phase3AnfTilgung),
    phase3Sondertilgung: decimalToString(inputs.phase3Sondertilgung),
    tilgungsplanMaxJahre: String(inputs.tilgungsplanMaxJahre),
    monatsnettokaltmiete: decimalToString(inputs.monatsnettokaltmiete),
    mietsteigerungSatz: percentToUiString(inputs.mietsteigerungSatz),
    kostenModus: inputs.kostenModus,
    nichtUmlagefaehigeKostenSumme: decimalToString(inputs.nichtUmlagefaehigeKostenSumme),
    hausgeldNichtUmlagefaehigPa: decimalToString(inputs.hausgeldNichtUmlagefaehigPa),
    verwaltungskostenPa: decimalToString(inputs.verwaltungskostenPa),
    versicherungenPa: decimalToString(inputs.versicherungenPa),
    sonstigeKostenPa: decimalToString(inputs.sonstigeKostenPa),
    instandhaltungskostenPa: decimalToString(inputs.instandhaltungskostenPa),
    kostensteigerungSatz: percentToUiString(inputs.kostensteigerungSatz),
    leerstandsmonateProJahr: decimalToString(inputs.leerstandsmonateProJahr),
    erstvermietungsleerstandMonate: decimalToString(inputs.erstvermietungsleerstandMonate),
    mietausfallwagnisSatz: percentToUiString(inputs.mietausfallwagnisSatz),
    steuerModulAktiv: inputs.steuerModulAktiv,
    persoenlicherSteuersatz: percentToUiString(inputs.persoenlicherSteuersatz),
    gebaeudeanteilSatz: percentToUiString(inputs.gebaeudeanteilSatz),
    afaSatz: percentToUiString(inputs.afaSatz),
    betrachtungszeitraumJahre: String(inputs.betrachtungszeitraumJahre),
    wertsteigerungSatz: percentToUiString(inputs.wertsteigerungSatz),
  };
}

export function createDefaultFormValues(): InputsFormValues {
  return createFormValuesFromInputs(defaultsBW);
}

export function getDefaultGrunderwerbsteuerUiValue(bundesland: Bundesland): string {
  return percentToUiString(new Decimal(GREW_BY_BUNDESLAND[bundesland].toString()));
}

export function parseInputsFormValues(values: InputsFormValues) {
  const validated = InputsSchema.safeParse(values);
  if (!validated.success) {
    return validated;
  }

  const data = validated.data;
  const parsedInputs: ImmoInputs = {
    kaufpreis: parseDecimal(data.kaufpreis),
    wohnflaecheQm: parseDecimal(data.wohnflaecheQm),
    bundesland: data.bundesland,
    kaufnebenkostenModus: data.kaufnebenkostenModus,
    kaufnebenkostenSumme: data.kaufnebenkostenSumme === '' ? undefined : parseDecimal(data.kaufnebenkostenSumme),
    grunderwerbsteuerSatz: data.grunderwerbsteuerSatz === '' ? undefined : parseDecimal(data.grunderwerbsteuerSatz).div(100),
    notarGrundbuchSatz: data.notarGrundbuchSatz === '' ? undefined : parseDecimal(data.notarGrundbuchSatz).div(100),
    maklerprovisionSatz: data.maklerprovisionSatz === '' ? undefined : parseDecimal(data.maklerprovisionSatz).div(100),
    sanierungskostenSumme: parseDecimal(data.sanierungskostenSumme),
    sanierungWertanrechnungSatz: parseDecimal(data.sanierungWertanrechnungSatz).div(100),
    eigenkapital: parseDecimal(data.eigenkapital),
    finanziertePosten: new Set(data.finanziertePosten),
    phase1Jahre: Number(data.phase1Jahre),
    phase1Sollzins: parseDecimal(data.phase1Sollzins).div(100),
    phase1AnfTilgung: parseDecimal(data.phase1AnfTilgung).div(100),
    phase1Sondertilgung: parseDecimal(data.phase1Sondertilgung),
    phase2Jahre: Number(data.phase2Jahre),
    phase2Sollzins: data.phase2Sollzins === '' ? undefined : parseDecimal(data.phase2Sollzins).div(100),
    phase2AnfTilgung: data.phase2AnfTilgung === '' ? undefined : parseDecimal(data.phase2AnfTilgung).div(100),
    phase2Sondertilgung: parseDecimal(data.phase2Sondertilgung),
    phase3Sollzins: parseDecimal(data.phase3Sollzins).div(100),
    phase3AnfTilgung: parseDecimal(data.phase3AnfTilgung).div(100),
    phase3Sondertilgung: parseDecimal(data.phase3Sondertilgung),
    tilgungsplanMaxJahre: Number(data.tilgungsplanMaxJahre),
    monatsnettokaltmiete: parseDecimal(data.monatsnettokaltmiete),
    mietsteigerungSatz: parseDecimal(data.mietsteigerungSatz).div(100),
    kostenModus: data.kostenModus,
    nichtUmlagefaehigeKostenSumme: data.nichtUmlagefaehigeKostenSumme === '' ? undefined : parseDecimal(data.nichtUmlagefaehigeKostenSumme),
    hausgeldNichtUmlagefaehigPa: data.hausgeldNichtUmlagefaehigPa === '' ? undefined : parseDecimal(data.hausgeldNichtUmlagefaehigPa),
    verwaltungskostenPa: data.verwaltungskostenPa === '' ? undefined : parseDecimal(data.verwaltungskostenPa),
    versicherungenPa: data.versicherungenPa === '' ? undefined : parseDecimal(data.versicherungenPa),
    sonstigeKostenPa: data.sonstigeKostenPa === '' ? undefined : parseDecimal(data.sonstigeKostenPa),
    instandhaltungskostenPa: parseDecimal(data.instandhaltungskostenPa),
    kostensteigerungSatz: parseDecimal(data.kostensteigerungSatz).div(100),
    leerstandsmonateProJahr: parseDecimal(data.leerstandsmonateProJahr),
    erstvermietungsleerstandMonate: parseDecimal(data.erstvermietungsleerstandMonate),
    mietausfallwagnisSatz: parseDecimal(data.mietausfallwagnisSatz).div(100),
    steuerModulAktiv: data.steuerModulAktiv,
    persoenlicherSteuersatz: data.persoenlicherSteuersatz === '' ? undefined : parseDecimal(data.persoenlicherSteuersatz).div(100),
    gebaeudeanteilSatz: data.gebaeudeanteilSatz === '' ? undefined : parseDecimal(data.gebaeudeanteilSatz).div(100),
    afaSatz: data.afaSatz === '' ? undefined : parseDecimal(data.afaSatz).div(100),
    betrachtungszeitraumJahre: Number(data.betrachtungszeitraumJahre),
    wertsteigerungSatz: parseDecimal(data.wertsteigerungSatz).div(100),
  };

  return { success: true as const, data: parsedInputs };
}
