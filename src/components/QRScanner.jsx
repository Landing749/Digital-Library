import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

let scannerIdCounter = 0;

/**
 * Renders a live camera scanner. Calls onScan(text) once per successful
 * decode (debounced) — used for physical-book check-in/out and inventory.
 * Each book/asset should have a QR code encoding its bookId (or ISBN),
 * printed on a spine label / bookplate.
 */
export default function QRScanner({ onScan, active = true }) {
  const elId = useRef(`qr-region-${scannerIdCounter++}`);
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ text: null, at: 0 });

  useEffect(() => {
    if (!active) return;
    const scanner = new Html5Qrcode(elId.current);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const now = Date.now();
          if (decodedText === lastScanRef.current.text && now - lastScanRef.current.at < 2500) {
            return; // debounce repeat reads of the same code
          }
          lastScanRef.current = { text: decodedText, at: now };
          onScan(decodedText);
        },
        () => {} // ignore per-frame decode failures
      )
      .catch((err) => {
        console.error('Camera start failed', err);
      });

    return () => {
      if (stopped) return;
      stopped = true;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [active]);

  return (
    <div className="space-y-2">
      <div id={elId.current} className="rounded-sm overflow-hidden border border-ink-900/15 bg-ink-900/5" />
      <p className="text-xs text-ink-500 text-center">Point the camera at a book's spine label / QR code.</p>
    </div>
  );
}
