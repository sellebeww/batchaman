import { expect, test } from 'vitest';
import { simulate } from '../packages/sim/src/index';
import { append, newState, project } from '../apps/web/src/store';
import { reportCSV } from '../apps/web/src/reports';
import { analyzePilot, markdown, median, parseCSV } from './analyze-pilot';
function fixture() {
  const d = simulate({ batchesPerDay: 6 });
  let s = append(newState('test-device'), { kind: 'KITCHEN', kitchen: d.kitchen });
  for (const batch of d.batches)
    s = append(s, { kind: 'BATCH', batch, drops: d.drops.filter((x) => x.batchId === batch.id) });
  for (const event of d.events)
    s = append(s, {
      kind: 'EVENT',
      event,
      metric: {
        eventId: event.id,
        batchId: event.batchId,
        durationMs: 5000,
        lagMinutes: (Date.parse(event.recordedAt) - Date.parse(event.occurredAt)) / 60000,
        recordedAt: event.recordedAt,
      },
    });
  const v = project(s);
  return {
    app: reportCSV(v, v.batches, '2026-10-06T00:00:00Z'),
    paper:
      'batch_id,paper_flagged,notes\n' + d.batches.map((b) => `${b.id},false,sintetis`).join('\n'),
  };
}
test('pilot consumes actual app export and paper; synthetic late delivery adds finding', () => {
  const f = fixture(),
    r = analyzePilot(f.app, f.paper);
  expect(r.batchCount).toBe(6);
  expect(r.entryCount).toBe(32);
  expect(r.medianSeconds).toBe(5);
  expect(r.completePercent).toBe(100);
  expect(r.additionalFindings).toEqual(['DEMO-20261005-02']);
  expect(r.negativeClockEntries).toBe(1);
  expect(r.realtimeEntries).toBe(26);
  expect(markdown(r)).toContain('Ambang batas belum diverifikasi');
});
test('missing paper is not interpreted as passed checklist', () => {
  const f = fixture();
  const r = analyzePilot(f.app, 'batch_id,paper_flagged\n');
  expect(r.additionalFindings).toEqual([]);
  expect(r.missingPaperCount).toBe(6);
});
test('CSV parser supports BOM, CRLF, commas, quotes and embedded newlines', () =>
  expect(parseCSV('\uFEFFa,b\r\n"x,y","a""b\nc"\r\n')).toEqual([
    ['a', 'b'],
    ['x,y', 'a"b\nc'],
  ]));
test.each(['a\n"unterminated', 'a\n"x"bad', 'a\nb"c'])('malformed CSV rejects %s', (s) =>
  expect(() => parseCSV(s)).toThrow(),
);
test('median empty odd even', () => {
  expect(median([])).toBeNull();
  expect(median([3, 1, 2])).toBe(2);
  expect(median([4, 1, 2, 3])).toBe(2.5);
});
test('invalid and duplicate paper entries rejected', () => {
  const f = fixture();
  expect(() => analyzePilot(f.app, 'batch_id,paper_flagged\nx,unknown')).toThrow();
  expect(() => analyzePilot(f.app, 'batch_id,paper_flagged\nx,true\nx,false')).toThrow();
});
test('missing metric columns rejected instead of inventing results', () => {
  const f = fixture();
  expect(() => analyzePilot(f.app.replace('duration_ms', 'removed'), f.paper)).toThrow();
});
