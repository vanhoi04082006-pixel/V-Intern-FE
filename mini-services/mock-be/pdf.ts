// pdf.ts — tiny generators for plausible binary payloads (PDF / XLSX).

function ascii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Build a minimal, structurally valid single-page PDF (a few hundred bytes). */
export function buildPdf(title: string, lines: string[]): Uint8Array {
  const content = [title, ...lines]
    .map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 56 ${772 - i * 22} Td (${esc(ascii(l))}) Tj ET`)
    .join("\n");

  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

/** ~50 plausible bytes starting with a ZIP local-file header (what xlsx is). */
export function buildXlsx(): Uint8Array {
  const bytes = new Uint8Array(50);
  bytes.set([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00]);
  for (let i = 10; i < 50; i++) bytes[i] = (i * 37 + 11) & 0xff;
  return bytes;
}
