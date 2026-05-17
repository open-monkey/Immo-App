import Decimal from 'decimal.js-light';
import type { FinanzierterPosten, ImmoInputs, ScenarioConfig, SerializedInputs, SerializedScenario } from './types';

const SCHEMA_VERSION = 1;

/**
 * Serialize a scenario config to a JSON-compatible format for storage.
 */
export function serializeScenario(config: ScenarioConfig): string {
  const serialized: SerializedScenario = {
    version: SCHEMA_VERSION,
    config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(serialized, null, 2);
}

/**
 * Deserialize a stored scenario back to a ScenarioConfig.
 * Throws if the version is unsupported.
 */
export function deserializeScenario(json: string): ScenarioConfig {
  const parsed: SerializedScenario = JSON.parse(json);

  if (parsed.version !== SCHEMA_VERSION) {
    throw new Error(
      `Unsupported scenario version: ${parsed.version}. Expected ${SCHEMA_VERSION}.`,
    );
  }

  return parsed.config;
}

/**
 * Validate that a partial config has all required fields.
 * Returns an array of missing field paths (empty if valid).
 */
export function validateScenarioConfig(config: unknown): string[] {
  const errors: string[] = [];

  if (typeof config !== 'object' || config === null) {
    return ['Config must be an object'];
  }

  const c = config as Record<string, unknown>;

  if (typeof c.name !== 'string' || c.name.trim() === '') {
    errors.push('name');
  }

  for (const section of ['purchase', 'loan', 'rental', 'expenses', 'tax'] as const) {
    if (typeof c[section] !== 'object' || c[section] === null) {
      errors.push(section);
    }
  }

  if (typeof c.holdPeriodYears !== 'number' || c.holdPeriodYears <= 0) {
    errors.push('holdPeriodYears');
  }

  if (typeof c.annualAppreciation !== 'number') {
    errors.push('annualAppreciation');
  }

  if (typeof c.sellingCostPercent !== 'number') {
    errors.push('sellingCostPercent');
  }

  return errors;
}

// ── Immo-specific serialization ──────────────────────────────────

function decimalOrUndefined(value: unknown): Decimal | undefined {
  if (typeof value === 'string') {
    return new Decimal(value);
  }
  if (typeof value === 'number') {
    return new Decimal(value);
  }
  return undefined;
}

function parseFinanziertePosten(value: unknown): Set<FinanzierterPosten> {
  if (Array.isArray(value)) {
    return new Set(value.map((v) => String(v) as FinanzierterPosten));
  }
  return new Set<FinanzierterPosten>(['kaufpreis']);
}

export function serialize(inputs: ImmoInputs): SerializedInputs {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (value instanceof Decimal) {
      obj[key] = value.toString();
    } else if (value instanceof Set) {
      obj[key] = Array.from(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

export function deserialize(data: SerializedInputs): ImmoInputs {
  const d = data as Record<string, unknown>;
  return {
    kaufpreis: decimalOrUndefined(d.kaufpreis) ?? new Decimal(0),
    wohnflaecheQm: decimalOrUndefined(d.wohnflaecheQm) ?? new Decimal(0),
    bundesland: (d.bundesland as ImmoInputs['bundesland']) ?? 'BW',
    kaufnebenkostenModus: (d.kaufnebenkostenModus as ImmoInputs['kaufnebenkostenModus']) ?? 'detailliert',
    kaufnebenkostenSumme: decimalOrUndefined(d.kaufnebenkostenSumme),
    grunderwerbsteuerSatz: decimalOrUndefined(d.grunderwerbsteuerSatz),
    notarGrundbuchSatz: decimalOrUndefined(d.notarGrundbuchSatz),
    maklerprovisionSatz: decimalOrUndefined(d.maklerprovisionSatz),
    sanierungskostenSumme: decimalOrUndefined(d.sanierungskostenSumme) ?? new Decimal(0),
    sanierungWertanrechnungSatz: decimalOrUndefined(d.sanierungWertanrechnungSatz) ?? new Decimal(0),
    eigenkapital: decimalOrUndefined(d.eigenkapital) ?? new Decimal(0),
    finanziertePosten: parseFinanziertePosten(d.finanziertePosten),
    phase1Jahre: Number(d.phase1Jahre ?? 10),
    phase1Sollzins: decimalOrUndefined(d.phase1Sollzins) ?? new Decimal('0.04'),
    phase1AnfTilgung: decimalOrUndefined(d.phase1AnfTilgung) ?? new Decimal('0.02'),
    phase1Sondertilgung: decimalOrUndefined(d.phase1Sondertilgung) ?? new Decimal(0),
    phase2Jahre: Number(d.phase2Jahre ?? 0),
    phase2Sollzins: decimalOrUndefined(d.phase2Sollzins),
    phase2AnfTilgung: decimalOrUndefined(d.phase2AnfTilgung),
    phase2Sondertilgung: decimalOrUndefined(d.phase2Sondertilgung) ?? new Decimal(0),
    phase3Sollzins: decimalOrUndefined(d.phase3Sollzins) ?? new Decimal('0.05'),
    phase3AnfTilgung: decimalOrUndefined(d.phase3AnfTilgung) ?? new Decimal('0.03'),
    phase3Sondertilgung: decimalOrUndefined(d.phase3Sondertilgung) ?? new Decimal(0),
    tilgungsplanMaxJahre: Number(d.tilgungsplanMaxJahre ?? 40),
    monatsnettokaltmiete: decimalOrUndefined(d.monatsnettokaltmiete) ?? new Decimal(0),
    mietsteigerungSatz: decimalOrUndefined(d.mietsteigerungSatz) ?? new Decimal('0.015'),
    kostenModus: (d.kostenModus as ImmoInputs['kostenModus']) ?? 'detailliert',
    nichtUmlagefaehigeKostenSumme: decimalOrUndefined(d.nichtUmlagefaehigeKostenSumme),
    hausgeldNichtUmlagefaehigPa: decimalOrUndefined(d.hausgeldNichtUmlagefaehigPa),
    verwaltungskostenPa: decimalOrUndefined(d.verwaltungskostenPa),
    versicherungenPa: decimalOrUndefined(d.versicherungenPa),
    sonstigeKostenPa: decimalOrUndefined(d.sonstigeKostenPa),
    instandhaltungskostenPa: decimalOrUndefined(d.instandhaltungskostenPa) ?? new Decimal(0),
    kostensteigerungSatz: decimalOrUndefined(d.kostensteigerungSatz) ?? new Decimal('0.02'),
    leerstandsmonateProJahr: decimalOrUndefined(d.leerstandsmonateProJahr) ?? new Decimal(0),
    erstvermietungsleerstandMonate: decimalOrUndefined(d.erstvermietungsleerstandMonate) ?? new Decimal(0),
    mietausfallwagnisSatz: decimalOrUndefined(d.mietausfallwagnisSatz) ?? new Decimal('0.02'),
    steuerModulAktiv: Boolean(d.steuerModulAktiv),
    persoenlicherSteuersatz: decimalOrUndefined(d.persoenlicherSteuersatz),
    gebaeudeanteilSatz: decimalOrUndefined(d.gebaeudeanteilSatz),
    afaSatz: decimalOrUndefined(d.afaSatz),
    betrachtungszeitraumJahre: Number(d.betrachtungszeitraumJahre ?? 10),
    wertsteigerungSatz: decimalOrUndefined(d.wertsteigerungSatz) ?? new Decimal('0.01'),
    bausparvertragMonatlich: decimalOrUndefined(d.bausparvertragMonatlich),
  };
}
