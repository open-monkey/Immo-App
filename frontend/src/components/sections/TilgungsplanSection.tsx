import { de } from '@/i18n/de';
import { useImmoStore } from '@/state/useImmoStore';
import { TilgungsplanChart } from '../charts/TilgungsplanChart';
import { Section } from '../ui/Section';

type Props = {
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

export function TilgungsplanSection({ isOpen, onToggle }: Props) {
  const amortization = useImmoStore((state) => state.result.amortization);

  return (
    <Section
      title={de.sections.tilgungsplan.title}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <TilgungsplanChart data={amortization} />
    </Section>
  );
}
