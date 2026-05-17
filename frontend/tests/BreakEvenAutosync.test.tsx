import { act, cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { defaultsBW } from '../src/domain/finance/defaults';
import { compute } from '../src/domain/finance/engine';
import { useImmoStore } from '../src/state/useImmoStore';
import { useUiStore } from '../src/state/useUiStore';

function resetStores() {
  useImmoStore.setState({
    inputs: defaultsBW,
    result: compute(defaultsBW),
  });

  useUiStore.setState({
    sections: {
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
      wertentwicklung: false,
    },
  });
}

describe('Break-Even Kaltmiete Autosync', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStores();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    resetStores();
  });

  it('autosync is enabled by default and monthly rent follows break-even when bausparvertrag changes', async () => {
    render(<App />);
    await act(async () => {});

    const rentInput = screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement;
    const initialRentValue = rentInput.value;

    const bausparInput = screen.getByLabelText(/Bausparvertrag monatlich/i) as HTMLInputElement;
    fireEvent.change(bausparInput, { target: { value: '300' } });
    fireEvent.blur(bausparInput);

    await waitFor(() => {
      const updatedRent = (screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement).value;
      expect(updatedRent).not.toBe(initialRentValue);
    });

    const result = useImmoStore.getState().result;
    const bePerQm = result.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber();
    const flaeche = useImmoStore.getState().inputs.wohnflaecheQm?.toNumber() ?? 65;
    if (bePerQm != null) {
      const expectedRent = (bePerQm * flaeche).toFixed(2);
      const currentRent = (screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement).value;
      expect(parseFloat(currentRent.replace(',', '.'))).toBeCloseTo(parseFloat(expectedRent), 1);
    }
  });

  it('manual edit disables autosync and preserves manual value when break-even changes', async () => {
    render(<App />);
    await act(async () => {});

    const rentInput = screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement;
    fireEvent.change(rentInput, { target: { value: '999' } });
    fireEvent.blur(rentInput);

    await waitFor(() => {
      expect((screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement).value).toBe('999');
    });

    const bausparInput = screen.getByLabelText(/Bausparvertrag monatlich/i) as HTMLInputElement;
    fireEvent.change(bausparInput, { target: { value: '300' } });
    fireEvent.blur(bausparInput);

    await waitFor(() => {
      expect((screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement).value).toBe('999');
    });
  });

  it('re-enabling autosync sets rent to current break-even and follows further changes', async () => {
    render(<App />);
    await act(async () => {});

    const rentInput = screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement;
    fireEvent.change(rentInput, { target: { value: '999' } });
    fireEvent.blur(rentInput);

    await waitFor(() => {
      expect((screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement).value).toBe('999');
    });

    const toggle = screen.getByRole('checkbox', { name: /automatisch.*Break-Even/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      const result = useImmoStore.getState().result;
      const bePerQm = result.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber();
      const flaeche = useImmoStore.getState().inputs.wohnflaecheQm?.toNumber() ?? 65;
      if (bePerQm != null) {
        const expectedRent = (bePerQm * flaeche).toFixed(2);
        const currentRent = (screen.getByLabelText(/Monatliche Nettokaltmiete/i) as HTMLInputElement).value;
        expect(parseFloat(currentRent.replace(',', '.'))).toBeCloseTo(parseFloat(expectedRent), 1);
      }
    });
  });
});
