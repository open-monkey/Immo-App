import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SectionKey =
  | 'objekt'
  | 'kaufnebenkosten'
  | 'sanierung'
  | 'finanzierung'
  | 'miete'
  | 'kosten'
  | 'risiko'
  | 'steuer'
  | 'tilgungsplan'
  | 'cashflow'
  | 'wertentwicklung';

type UiState = {
  sections: Record<SectionKey, boolean>;
  setSectionOpen: (section: SectionKey, isOpen: boolean) => void;
};

const defaultSections: Record<SectionKey, boolean> = {
  objekt: true,
  kaufnebenkosten: true,
  sanierung: true,
  finanzierung: true,
  miete: true,
  kosten: true,
  risiko: true,
  steuer: false,
  tilgungsplan: false,
  cashflow: false,
  wertentwicklung: true,
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sections: defaultSections,
      setSectionOpen: (section, isOpen) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [section]: isOpen,
          },
        })),
    }),
    {
      name: 'immo:ui',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export type { SectionKey };
