import { de } from '@/i18n/de';
import { useImmoStore } from '@/state/useImmoStore';
import { CashflowChart } from '../charts/CashflowChart';
import { Section } from '../ui/Section';

type Props = {
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

export function CashflowSection({ isOpen, onToggle }: Props) {
  const cashflows = useImmoStore((state) => state.result.cashflows);

  return (
    <Section
      title={de.sections.cashflow.title}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <CashflowChart data={cashflows} />
    </Section>
  );
}
