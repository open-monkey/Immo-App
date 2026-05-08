import { de } from '@/i18n/de';
import { useImmoStore } from '@/state/useImmoStore';
import { WertentwicklungChart } from '../charts/WertentwicklungChart';
import { KPICard } from '../ui/KPICard';
import { Section } from '../ui/Section';

type Props = {
  isOpen: boolean;
  onToggle: (next: boolean) => void;
};

export function WertentwicklungSection({ isOpen, onToggle }: Props) {
  const marktwertReihe = useImmoStore((state) => state.result.marktwertReihe);
  const kpis = useImmoStore((state) => state.result.kpis);

  return (
    <Section
      title={de.sections.wertentwicklung.title}
      description={de.sections.wertentwicklung.description}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="kpi-board kpi-board--inline">
        <KPICard kpi={kpis.marktwertEndeBetrachtung} />
        <KPICard kpi={kpis.vermoegensbilanzEnde} />
      </div>

      <WertentwicklungChart data={marktwertReihe} />
    </Section>
  );
}
