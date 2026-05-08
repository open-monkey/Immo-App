import { Link } from 'react-router-dom';
import { de } from '@/i18n/de';

export function NotFoundPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <section className="section-card">
        <div className="section-content">
          <h1>{de.notFound.title}</h1>
          <Link className="text-link" to="/">
            {de.notFound.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
