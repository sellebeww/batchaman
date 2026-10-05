import { createRoot } from 'react-dom/client';
import App from './App';
import { append, mutate, readState } from './store';
import { localDate } from '@batchaman/core';
import { t } from './i18n/id';
import './styles.css';
async function boot() {
  if (window.top !== window.self) {
    document.getElementById('root')!.textContent = t.embeddedBlocked + ' ' + t.warning;
    return;
  }
  if (import.meta.env.VITE_DEMO === 'true') {
    try {
      const state = await readState();
      if (!state.entries.length) {
        const { simulate } = await import('@batchaman/sim');
        const data = simulate({ start: localDate(new Date().toISOString(), 'Asia/Jakarta') });
        await mutate((s) => {
          if (s.entries.length) return s;
          let next = append(s, { kind: 'KITCHEN', kitchen: data.kitchen });
          for (const batch of data.batches)
            next = append(next, {
              kind: 'BATCH',
              batch,
              drops: data.drops.filter((d) => d.batchId === batch.id),
            });
          for (const event of data.events)
            next = append(next, {
              kind: 'EVENT',
              event,
              metric: {
                eventId: event.id,
                batchId: event.batchId,
                durationMs: 5000,
                lagMinutes: (Date.parse(event.recordedAt) - Date.parse(event.occurredAt)) / 60000,
                recordedAt: event.recordedAt,
              },
            });
          return next;
        });
      }
    } catch {
      /* App presents storage recovery if initialization cannot be completed. */
    }
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
document.getElementById('root')!.textContent = t.loading;
void boot();
