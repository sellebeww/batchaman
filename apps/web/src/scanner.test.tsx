// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import Scanner from './Scanner';
import { t } from './i18n/id';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test('camera tracks stop immediately when video initialization fails', async () => {
  const stop = vi.fn();
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) },
  });
  vi.stubGlobal('BarcodeDetector', class {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('play failed'));
  render(<Scanner onCode={vi.fn()} onClose={vi.fn()} />);
  await screen.findByText(t.cameraError);
  expect(stop).toHaveBeenCalled();
});
