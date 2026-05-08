import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { loadCalculation } from '@/api/shareLinks';
import { de } from '@/i18n/de';
import { useImmoStore } from '@/state/useImmoStore';

export function ShareViewPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const loadFromShareLink = useImmoStore((state) => state.loadFromShareLink);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shareId) {
      setError(true);
      return;
    }
    loadCalculation(shareId)
      .then((res) => {
        loadFromShareLink(res.input_data);
        setDone(true);
      })
      .catch(() => {
        setError(true);
      });
  }, [shareId, loadFromShareLink]);

  if (done) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="page-shell page-shell--narrow">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">immo.magicplanet.net</p>
          <h1>{de.shareView.title}</h1>
          <p className="app-subtitle">{de.shareView.description}</p>
        </div>
      </header>

      <section className="section-card">
        <div className="section-content">
          {error ? (
            <>
              <p>{de.shareView.error}</p>
              <Link className="text-link" to="/">
                {de.shareView.back}
              </Link>
            </>
          ) : (
            <p>{de.shareView.loading}</p>
          )}
        </div>
      </section>
    </main>
  );
}
