// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { enableAudio, notifyWarning } from './alerts';
test('AC-06 enabled audio emits short tone; mute suppresses tone but preserves vibration', () => {
  const start = vi.fn(),
    stop = vi.fn(),
    vibrate = vi.fn();
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'running';
      currentTime = 10;
      destination = {};
      resume() {
        return Promise.resolve();
      }
      createOscillator() {
        return { frequency: { value: 0 }, connect: vi.fn(), start, stop };
      }
      createGain() {
        return { gain: { value: 0 }, connect: vi.fn() };
      }
    },
  );
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
  enableAudio();
  notifyWarning(true);
  expect(start).toHaveBeenCalledOnce();
  expect(stop).toHaveBeenCalledWith(10.15);
  notifyWarning(false);
  expect(start).toHaveBeenCalledOnce();
  expect(vibrate).toHaveBeenCalledTimes(2);
  vi.unstubAllGlobals();
});
