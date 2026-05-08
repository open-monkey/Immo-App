import type { ScenarioConfig, SerializedScenario } from './types';

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
