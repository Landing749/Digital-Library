import { QRCodeSVG } from 'qrcode.react';

export default function BookQRLabel({ book }) {
  return (
    <div className="catalog-card p-4 w-56 print:shadow-none flex flex-col items-center gap-2 text-center">
      <QRCodeSVG value={book.id} size={120} />
      <p className="font-display text-sm leading-tight">{book.title}</p>
      <p className="font-mono text-[11px] text-ink-500">{book.isbn || book.id}</p>
    </div>
  );
}
