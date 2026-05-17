import { cleanup, render, screen, within } from '@testing-library/react';
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
      wertentwicklung: true,
    },
  });
}

describe('Wertentwicklung section', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStores();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    resetStores();
  });

  it('renders valuation KPIs and a yearly chart instead of the placeholder panel', () => {
    render(<App />);

    const section = screen.getByRole('region', { name: /wertentwicklung/i });

    expect(within(section).queryByText(/diese sektion wird im nächsten/i)).not.toBeInTheDocument();
    expect(within(section).getByText('Marktwert Ende')).toBeInTheDocument();
    expect(within(section).getByText('Vermögensbilanz Ende')).toBeInTheDocument();
    expect(within(section).getByRole('img', { name: /wertentwicklung über die jahre/i })).toBeInTheDocument();
    expect(within(section).getByText('Jahr 0')).toBeInTheDocument();
    expect(within(section).getByText(/jahr 10/i)).toBeInTheDocument();
  });
});
