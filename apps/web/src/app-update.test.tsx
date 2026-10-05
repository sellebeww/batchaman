// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppUpdate } from './AppUpdate';
import { t } from './i18n/id';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function workerState(existing = true) {
  const worker = Object.assign(new EventTarget(), { postMessage: vi.fn() });
  const registration = Object.assign(new EventTarget(), {
    waiting: worker as typeof worker | null,
    installing: null as typeof worker | null,
    update: vi.fn().mockResolvedValue(undefined),
  });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: existing ? worker : null,
    ready: Promise.resolve(registration),
  });
  vi.stubGlobal('navigator', { serviceWorker, onLine: true });
  return { worker, registration };
}

test('an available update waits for consent, preserving an unfinished form', async () => {
  const { worker } = workerState();
  render(
    <>
      <input aria-label="Catatan belum disimpan" defaultValue="Menu siang" />
      <AppUpdate />
    </>,
  );
  await screen.findByText(t.updateReady);
  expect(worker.postMessage).not.toHaveBeenCalled();
  expect((screen.getByLabelText('Catatan belum disimpan') as HTMLInputElement).value).toBe(
    'Menu siang',
  );
  fireEvent.click(screen.getByRole('button', { name: t.updateAction }));
  expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  expect((screen.getByRole('button', { name: t.updateBusy }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});

test('first install stays quiet and updates installed later become discoverable', async () => {
  const { registration, worker } = workerState(false);
  const first = render(<AppUpdate />);
  await act(async () => {});
  expect(screen.queryByText(t.updateReady)).toBeNull();
  first.unmount();
  const state = workerState();
  state.registration.waiting = null;
  state.registration.installing = worker;
  render(<AppUpdate />);
  await act(async () => {});
  expect(screen.queryByText(t.updateReady)).toBeNull();
  await act(async () => {
    state.registration.waiting = registration.waiting;
    worker.dispatchEvent(new Event('statechange'));
  });
  expect(screen.getByText(t.updateReady)).toBeTruthy();
});
