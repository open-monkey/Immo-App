import type { ReactNode } from 'react';

 type SectionProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: (next: boolean) => void;
  badge?: string;
  children: ReactNode;
};

export function Section({ title, description, isOpen, onToggle, badge, children }: SectionProps) {
  const sectionId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`;

  return (
    <section className="section-card" aria-label={title}>
      <div className="section-summary">
        <button
          type="button"
          className="section-toggle"
          aria-expanded={isOpen}
          aria-controls={`${sectionId}-content`}
          onClick={() => onToggle(!isOpen)}
        >
          <span>{title}</span>
          {badge ? <span className="section-badge">{badge}</span> : null}
        </button>
      </div>
      {isOpen ? (
        <div id={`${sectionId}-content`} className="section-content">
          {description ? <p className="section-description">{description}</p> : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}
