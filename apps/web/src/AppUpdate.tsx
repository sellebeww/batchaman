import { useEffect, useRef, useState } from 'react';
import { t } from './i18n/id';

export function AppUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const checkWaiting = () => {
      if (!disposed && registration?.waiting && navigator.serviceWorker.controller)
        setWaiting(registration.waiting);
    };
    const trackInstall = () => {
      installing?.removeEventListener('statechange', checkWaiting);
      installing = registration?.installing ?? null;
      installing?.addEventListener('statechange', checkWaiting);
    };
    const checkUpdate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine)
        void registration?.update().catch(() => {});
    };
    const changed = () => {
      if (requested.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    void navigator.serviceWorker.ready.then((ready) => {
      if (disposed) return;
      registration = ready;
      checkWaiting();
      trackInstall();
      registration.addEventListener('updatefound', trackInstall);
      document.addEventListener('visibilitychange', checkUpdate);
      window.addEventListener('online', checkUpdate);
      checkUpdate();
    });
    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', trackInstall);
      installing?.removeEventListener('statechange', checkWaiting);
      navigator.serviceWorker.removeEventListener('controllerchange', changed);
      document.removeEventListener('visibilitychange', checkUpdate);
      window.removeEventListener('online', checkUpdate);
    };
  }, []);

  useEffect(() => {
    if (!busy) return;
    const timeout = window.setTimeout(() => {
      requested.current = false;
      setBusy(false);
      setFailed(true);
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [busy]);

  if (!waiting) return null;
  return (
    <aside className="update-banner no-print" role="status">
      <div>
        <strong>{t.updateReady}</strong>
        <p>{failed ? t.updateError : t.updateHint}</p>
      </div>
      <button
        disabled={busy}
        onClick={() => {
          requested.current = true;
          setBusy(true);
          setFailed(false);
          waiting.postMessage({ type: 'SKIP_WAITING' });
        }}
      >
        {busy ? t.updateBusy : t.updateAction}
      </button>
    </aside>
  );
}
