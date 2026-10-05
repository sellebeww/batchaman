import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** RFC4180-style parser: quoted newlines/commas, escaped quotes, BOM and CRLF. */
export function parseCSV(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false,
    closed = false;
  const finish = () => {
    row.push(cell);
    cell = '';
    closed = false;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) throw new Error('CSV: tanda kutip tidak sesuai');
      quoted = true;
    } else if (c === ',') finish();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      finish();
      rows.push(row);
      row = [];
    } else {
      if (closed) throw new Error('CSV: karakter setelah tanda kutip');
      cell += c;
    }
  }
  if (quoted) throw new Error('CSV: tanda kutip belum ditutup');
  if (cell || row.length || closed) {
    finish();
    rows.push(row);
  }
  return rows;
}
function section(rows: string[][], first: string, required: string[]): Record<string, string>[] {
  const start = rows.findIndex((r) => r[0] === first && required.every((key) => r.includes(key)));
  if (start < 0)
    throw new Error(`Kolom ${first} tidak ditemukan. Gunakan ekspor aplikasi terbaru.`);
  const header = rows[start]!;
  if (new Set(header).size !== header.length) throw new Error('CSV: nama kolom ganda');
  const result: Record<string, string>[] = [];
  for (const row of rows.slice(start + 1)) {
    if (row.every((x) => x === '')) break;
    if (row.length !== header.length) throw new Error('CSV: jumlah kolom tidak cocok');
    result.push(Object.fromEntries(header.map((key, i) => [key, row[i]!])));
  }
  return result;
}
function number(value: string | undefined, name: string): number {
  if (value === undefined || value.trim() === '') throw new Error(`Nilai ${name} tidak ada`);
  const parsed = Number(value.replace(/^'(?=-\d)/, ''));
  if (!Number.isFinite(parsed)) throw new Error(`Nilai ${name} bukan angka`);
  return parsed;
}
function bool(value: string | undefined): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('Nilai boolean harus true atau false');
}
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}
export function analyzePilot(appCSV: string, paperCSV: string) {
  const rows = parseCSV(appCSV),
    summaries = section(rows, 'batch_id', [
      'short_code',
      'drop_id',
      'time_status',
      'complete',
      'threshold_status',
    ]);
  const events = section(rows, 'event_id', [
    'batch_id',
    'revoked',
    'duration_ms',
    'lag_minutes',
    'realtime_tolerance_min',
  ]);
  const paper = section(parseCSV(paperCSV), 'batch_id', ['paper_flagged']);
  const batches = new Map<string, { complete: boolean; exceeded: boolean; code: string }>(),
    dropIds = new Set<string>();
  for (const r of summaries) {
    if (!r.batch_id || !r.drop_id || dropIds.has(r.drop_id))
      throw new Error('Identitas batch/tujuan kosong atau ganda');
    dropIds.add(r.drop_id);
    const old = batches.get(r.batch_id);
    batches.set(r.batch_id, {
      complete: (old?.complete ?? true) && bool(r.complete),
      exceeded: (old?.exceeded ?? false) || r.time_status === 'MELEWATI_BATAS',
      code: r.short_code!,
    });
  }
  const paperByBatch = new Map<string, boolean>();
  for (const r of paper) {
    if (!r.batch_id || paperByBatch.has(r.batch_id))
      throw new Error('Checklist: batch kosong atau ganda');
    paperByBatch.set(r.batch_id, bool(r.paper_flagged));
  }
  let realtime = 0,
    entries = 0,
    negativeClockEntries = 0,
    revokedEntries = 0;
  const durations: number[] = [],
    eventIds = new Set<string>();
  for (const r of events) {
    if (!r.event_id || eventIds.has(r.event_id) || !batches.has(r.batch_id!))
      throw new Error('Entri ganda atau referensi batch tidak ada');
    eventIds.add(r.event_id);
    if (bool(r.revoked)) {
      revokedEntries++;
      continue;
    }
    const lag = number(r.lag_minutes, 'lag_minutes'),
      duration = number(r.duration_ms, 'duration_ms'),
      tolerance = number(r.realtime_tolerance_min, 'realtime_tolerance_min');
    if (duration < 0 || tolerance < 0) throw new Error('Durasi/toleransi tidak boleh negatif');
    entries++;
    durations.push(duration / 1000);
    if (lag < 0) negativeClockEntries++;
    else if (lag <= tolerance) realtime++;
  }
  const additionalFindings = [...batches]
    .filter(([id, b]) => b.exceeded && paperByBatch.get(id) === false)
    .map(([, b]) => b.code);
  const missingPaper = [...batches.keys()].filter((id) => !paperByBatch.has(id));
  const unmatchedPaper = [...paperByBatch.keys()].filter((id) => !batches.has(id));
  return {
    batchCount: batches.size,
    entryCount: entries,
    realtimeEntries: realtime,
    realtimePercent: entries ? (100 * realtime) / entries : null,
    medianSeconds: median(durations),
    additionalFindings,
    completeBatchCount: [...batches.values()].filter((b) => b.complete).length,
    completePercent: batches.size
      ? (100 * [...batches.values()].filter((b) => b.complete).length) / batches.size
      : null,
    missingPaperCount: missingPaper.length,
    unmatchedPaperCount: unmatchedPaper.length,
    negativeClockEntries,
    revokedEntries,
    unverifiedDrops: summaries.filter((r) => r.threshold_status === 'UNVERIFIED').length,
  };
}
export function markdown(r: ReturnType<typeof analyzePilot>): string {
  const percent = (v: number | null) => (v === null ? 'Tidak tersedia' : v.toFixed(1) + '%');
  return `# Ringkasan pilot BatchAman\n\nAmbang batas belum diverifikasi oleh ahli. Jangan dipakai sebagai satu-satunya dasar keputusan keamanan pangan.\nData ekspor harus disimpan dan dibagikan dengan hati-hati.\n\n| Metrik | Hasil | Target pilot |\n|---|---:|---|\n| Entri real-time | ${percent(r.realtimePercent)} (${r.realtimeEntries}/${r.entryCount}) | ≥70% |\n| Median durasi entri | ${r.medianSeconds === null ? 'Tidak tersedia' : r.medianSeconds.toFixed(2) + ' detik'} | <15 detik |\n| Batch melewati batas aplikasi, tidak ditandai kertas | ${r.additionalFindings.length} | Nilai tambah terukur, perlu pemeriksaan |\n| Batch lengkap | ${percent(r.completePercent)} (${r.completeBatchCount}/${r.batchCount}) | Laporkan tanpa menyamarkan data hilang |\n\nChecklist tidak tersedia untuk ${r.missingPaperCount} batch aplikasi; ${r.unmatchedPaperCount} batch kertas tidak ditemukan di ekspor. Data hilang tidak dianggap lolos checklist.\nEntri dengan lag negatif: ${r.negativeClockEntries}; tidak dihitung real-time. Entri dibatalkan: ${r.revokedEntries}; dikeluarkan dari metrik entri. Koreksi tetap dihitung sebagai pekerjaan entri.\nTujuan dengan ambang UNVERIFIED: ${r.unverifiedDrops}. Temuan tambahan bukan bukti keracunan atau kelayakan pangan.\n\n## Batch untuk pemeriksaan\n\n${r.additionalFindings.length ? r.additionalFindings.map((code) => '- ' + code.replace(/[\r\n<>]/g, ' ')).join('\n') : 'Tidak ada temuan tambahan pada pasangan data yang tersedia.'}\n\n## Umpan balik kualitatif\n\nIsi manual dari wawancara: hambatan pencatatan, hal yang diabaikan, dan perubahan yang diusulkan. CSV tidak dapat menggantikan wawancara.\n\n## Keputusan manusia\n\nTinjau kriteria berhenti/ubah arah di docs/FIELD_TEST.md bersama staf dan ahli. Jangan menyimpulkan kelayakan pangan atau kelayakan kontrak dari angka ini saja.\n`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [app, paper, out = 'pilot-summary.md'] = process.argv.slice(2);
  if (!app || !paper) {
    console.error('Pemakaian: pnpm pilot ekspor-aplikasi.csv checklist-kertas.csv [ringkasan.md]');
    process.exitCode = 1;
  } else
    try {
      const result = analyzePilot(readFileSync(app, 'utf8'), readFileSync(paper, 'utf8'));
      writeFileSync(out, markdown(result));
      console.log(JSON.stringify(result, null, 2));
      console.log(`Ringkasan ditulis ke ${out}`);
    } catch (e) {
      console.error(e instanceof Error ? e.message : 'Berkas tidak dapat dibaca');
      process.exitCode = 1;
    }
}
