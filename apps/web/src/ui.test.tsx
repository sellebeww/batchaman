// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { db, setup, createBatch, project, readState } from './store';
import { t } from './i18n/id';
afterEach(async () => {
  cleanup();
  await db.delete();
  await db.open();
  vi.restoreAllMocks();
});
test('AC-14 status strings never label food aman/tidak aman', () => {
  const strings = [
    ...Object.values(t.timeNames),
    ...Object.values(t.flagNames),
    t.complete,
    t.incomplete,
  ];
  for (const s of strings) expect(s).not.toMatch(/\b(?:tidak )?aman\b/i);
  const { aboutItems: _about, ...ui } = t;
  expect(JSON.stringify(ui)).not.toMatch(/\baman\b/i);
});
test('AC-01 two taps from selected batch, AC-02 automatic time, AC-13 warning', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  await setup({
    id: 'k',
    name: 'Dapur Sintetis',
    code: 'SYN',
    timezone: 'Asia/Jakarta',
    thresholdProfileId: 'default',
  });
  await createBatch(
    {
      menuName: 'Menu Sintetis',
      portions: 1,
      foodProfile: 'COOKED_HOT',
      drops: [{ recipientLabel: 'Tujuan Sintetis', portions: 1 }],
    },
    new Date().toISOString(),
  );
  render(<App />);
  fireEvent.click(await screen.findByText('Menu Sintetis'));
  fireEvent.click(screen.getByRole('button', { name: /Selesai masak/ }));
  fireEvent.click(screen.getByRole('button', { name: t.confirm }));
  await screen.findByText(t.success);
  const v = project(await readState());
  expect(v.events).toHaveLength(1);
  expect(v.events[0]!.occurredAt).toBe(v.events[0]!.recordedAt);
  expect(screen.getByText(t.warning)).toBeTruthy();
  await waitFor(() => expect(v.metrics[0]!.durationMs).toBeGreaterThanOrEqual(0));
});
