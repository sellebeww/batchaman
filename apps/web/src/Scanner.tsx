import { useEffect, useRef, useState } from 'react';
import { t } from './i18n/id';
type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
export default function Scanner({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false,
      stream: MediaStream | undefined,
      controls: { stop: () => void } | undefined,
      frame = 0;
    const start = async () => {
      try {
        const Native = (
          window as unknown as { BarcodeDetector?: new (x: { formats: string[] }) => Detector }
        ).BarcodeDetector;
        if (Native) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
          if (disposed) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          video.current!.srcObject = stream;
          await video.current!.play();
          const detector = new Native({ formats: ['qr_code'] });
          const tick = async () => {
            if (disposed) return;
            try {
              const found = await detector.detect(video.current!);
              if (found[0]) {
                onCode(found[0].rawValue);
                return;
              }
            } catch {
              /* retry next frame */
            }
            frame = window.setTimeout(() => void tick(), 300);
          };
          void tick();
        } else {
          const { BrowserQRCodeReader } = await import('@zxing/browser');
          if (disposed) return;
          controls = await new BrowserQRCodeReader().decodeFromVideoDevice(
            undefined,
            video.current!,
            (result) => {
              if (result && !disposed) onCode(result.getText());
            },
          );
          if (disposed) controls.stop();
        }
      } catch {
        stream?.getTracks().forEach((track) => track.stop());
        controls?.stop();
        if (!disposed) setError(t.cameraError);
      }
    };
    void start();
    return () => {
      disposed = true;
      clearTimeout(frame);
      stream?.getTracks().forEach((t) => t.stop());
      controls?.stop();
    };
  }, [onCode]);
  return (
    <section className="panel">
      <h2>{t.scan}</h2>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <video ref={video} muted playsInline aria-label={t.scan} />
      )}
      <button onClick={onClose}>{t.stopScan}</button>
    </section>
  );
}
