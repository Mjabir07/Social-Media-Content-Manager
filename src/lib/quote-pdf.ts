import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Render a professional A4 quotation PDF with pdf-lib (pure JS, serverless-safe —
 * no headless browser, no external font files). Returns raw PDF bytes.
 */

export type QuotePdfData = {
  numberLabel: string;
  title: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  currency: string;
  validUntil: string | null; // ISO
  notes: string | null;
  lines: { description: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  fromName?: string;
  fromEmail?: string;
};

const BRAND = rgb(0.031, 0.486, 0.98); // #087CFA
const INK = rgb(0.04, 0.13, 0.2);
const MUTED = rgb(0.36, 0.44, 0.53);
const LINE = rgb(0.82, 0.86, 0.9);

function money(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export async function generateQuotePdf(q: QuotePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 portrait, points
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const M = 48; // margin
  let y = height - M;

  const text = (s: string, x: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color });
  const right = (s: string, xRight: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(s, { x: xRight - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color });

  // Header band
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: rgb(0.012, 0.078, 0.18) });
  text(q.fromName ?? "AZMIN Digital", M, height - 44, 20, bold, rgb(1, 1, 1));
  text("Digital OS", M, height - 62, 10, font, rgb(0.72, 0.87, 0.93));
  right("QUOTATION", width - M, height - 44, 18, bold, rgb(1, 1, 1));
  right(q.numberLabel, width - M, height - 64, 11, font, rgb(0.72, 0.87, 0.93));
  y = height - 96 - 34;

  // Meta row
  text("Prepared for", M, y, 9, bold, MUTED);
  right("Date", width - M, y, 9, bold, MUTED);
  y -= 15;
  text(q.contactName, M, y, 12, bold);
  right(new Date().toLocaleDateString("en-GB"), width - M, y, 11);
  y -= 14;
  if (q.contactEmail) { text(q.contactEmail, M, y, 10, font, MUTED); y -= 12; }
  if (q.contactPhone) { text(q.contactPhone, M, y, 10, font, MUTED); y -= 12; }
  if (q.validUntil) { right(`Valid until ${new Date(q.validUntil).toLocaleDateString("en-GB")}`, width - M, y + 12, 10, font, MUTED); }

  y -= 16;
  text(q.title, M, y, 14, bold, BRAND);
  y -= 22;

  // Table header
  const colDesc = M;
  const colQty = width - M - 210;
  const colUnit = width - M - 120;
  const colTotal = width - M;
  page.drawRectangle({ x: M - 6, y: y - 6, width: width - 2 * M + 12, height: 22, color: rgb(0.9, 0.94, 0.99) });
  text("DESCRIPTION", colDesc, y, 9, bold, MUTED);
  right("QTY", colQty + 24, y, 9, bold, MUTED);
  right("UNIT", colUnit + 40, y, 9, bold, MUTED);
  right("AMOUNT", colTotal, y, 9, bold, MUTED);
  y -= 24;

  // Rows
  for (const l of q.lines) {
    const lineTotal = l.quantity * l.unitPriceCents;
    text(l.description.slice(0, 60), colDesc, y, 10.5);
    right(String(l.quantity), colQty + 24, y, 10.5);
    right(money(l.unitPriceCents, q.currency), colUnit + 40, y, 10.5);
    right(money(lineTotal, q.currency), colTotal, y, 10.5);
    y -= 16;
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: width - M, y: y + 4 }, thickness: 0.5, color: LINE });
    y -= 6;
  }

  // Total
  y -= 6;
  right("Total", colUnit + 40, y, 12, bold, MUTED);
  right(money(q.subtotalCents, q.currency), colTotal, y, 14, bold, BRAND);
  y -= 34;

  // Notes
  if (q.notes) {
    text("Notes", M, y, 9, bold, MUTED);
    y -= 14;
    for (const chunk of wrap(q.notes, 95)) { text(chunk, M, y, 10, font, INK); y -= 13; }
    y -= 8;
  }

  // Footer
  text("Reply to approve and we'll get started.", M, 70, 10, font, MUTED);
  page.drawLine({ start: { x: M, y: 58 }, end: { x: width - M, y: 58 }, thickness: 0.5, color: LINE });
  text(q.fromName ?? "AZMIN Digital", M, 44, 9, bold, INK);
  if (q.fromEmail) right(q.fromEmail, width - M, 44, 9, font, MUTED);

  return doc.save();
}

// Naive word-wrap to a character budget per line.
function wrap(s: string, max: number): string[] {
  const words = s.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) { if (cur) out.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  return out.slice(0, 12);
}
