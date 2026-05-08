import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { compute } from '@/domain/finance/engine';
import { defaultsBW } from '@/domain/finance/defaults';
import { deserialize, serialize } from '@/domain/finance/serialization';
import type { ComputedResult, ImmoInputs, SerializedInputs } from '@/domain/finance/types';

type PersistedState = {
  serializedInputs: SerializedInputs;
};

type ImmoState = {
  inputs: ImmoInputs;
  result: ComputedResult;
  setInputs: (next: ImmoInputs) => void;
  loadFromShareLink: (data: SerializedInputs) => void;
  resetToDefaults: () => void;
};

function createDebouncedStorage(delayMs: number) {
  let timeout: number | null = null;
  let pendingValue: string | null = null;
  let pendingKey: string | null = null;

  return {
    getItem: (name: string) => window.localStorage.getItem(name),
    setItem: (name: string, value: string) => {
      pendingKey = name;
      pendingValue = value;
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        if (pendingKey && pendingValue !== null) {
          window.localStorage.setItem(pendingKey, pendingValue);
        }
      }, delayMs);
    },
    removeItem: (name: string) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      window.localStorage.removeItem(name);
    },
  };
}

function getInitialState() {
  return {
    inputs: defaultsBW,
    result: compute(defaultsBW),
  };
}

export const useImmoStore = create<ImmoState>()(
  persist(
    (set) => ({
      ...getInitialState(),
      setInputs: (next) => set({ inputs: next, result: compute(next) }),
      loadFromShareLink: (data) => {
        const inputs = deserialize(data);
        set({ inputs, result: compute(inputs) });
      },
      resetToDefaults: () => set({ inputs: defaultsBW, result: compute(defaultsBW) }),
    }),
    {
      name: 'immo:last-valid-inputs',
      version: 1,
      storage: createJSONStorage(() => createDebouncedStorage(300)),
      partialize: (state) => ({ serializedInputs: serialize(state.inputs) }),
      migrate: (persistedState: unknown, version: number) => {
        // Version 0 (no version key) = legacy data with potential decimal
        // parsing corruptions (e.g. "50.000" stored as "50").  Discard it.
        if (version < 1) {
          return {};
        }
        return persistedState;
      },
      merge: (persistedState, currentState) => {
        const typed = persistedState as PersistedState | undefined;
        if (!typed?.serializedInputs) {
          return currentState;
        }
        const inputs = deserialize(typed.serializedInputs);
        return {
          ...currentState,
          inputs,
          result: compute(inputs),
        };
      },
    },
  ),
);
