import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { defaultThresholds, signEvent } from '@batchaman/core';
import {
  append,
  backupJSON,
  BatchDB,
  createBatch,
  csv,
  mutate,
  newState,
  parseBackup,
  project,
  readState,
  record,
  restoreBackup,
  revoke,
  setup,
} from './store';
const at = (s: number) => new Date(Date.parse('2026-10-05T00:00:00Z') + s * 1000).toISOString();
let db: BatchDB;
let batchId: string;
beforeEach(async () => {
  db = new BatchDB('test-' + crypto.randomUUID());
  await setup(
    {
      id: 'k',
      name: 'Dapur Sintetis',
      code: 'SYN',
      timezone: 'Asia/Jakarta',
      thresholdProfileId: 'placeholder',
    },
    db,
  );
  batchId = (
    await createBatch(
      {
        menuName: 'Sintetis',
        portions: 100,
        foodProfile: 'COOKED_HOT',
        drops: [{ recipientLabel: 'Tujuan sintetis', portions: 100 }],
      },
      at(0),
      db,
    )
  ).batchId;
});
afterEach(async () => {
  await db.delete();
});
const input = () => ({
  batchId,
  type: 'COOK_DONE' as const,
  role: 'COOK' as const,
  occurredAt: at(0),
});
test('AC-03 concurrent double confirmation creates one event and one metric', async () => {
  const [a, b] = await Promise.all([
    record(input(), at(0), 1000, db),
    record(input(), at(1), 1000, db),
  ]);
  expect(a.eventId).toBe(b.eventId);
  const v = project(await readState(db));
  expect(v.events).toHaveLength(1);
  expect(v.metrics).toHaveLength(1);
});
test('AC-04 undo appends, expired undo rejects without mutation', async () => {
  const a = await record(input(), at(0), 1000, db);
  await revoke(a.eventId, at(9), db);
  const v = project(await readState(db));
  expect(v.events).toHaveLength(1);
  expect(v.revoked).toEqual([a.eventId]);
  const b = await record(input(), at(10), 1000, db);
  await expect(revoke(b.eventId, at(21), db)).rejects.toThrow();
  expect(project(await readState(db)).events).toHaveLength(2);
});
test('AC-04 correction keeps original signed event and requires reason', async () => {
  const a = await record(input(), at(0), 1000, db);
  await expect(record({ ...input(), supersedes: a.eventId }, at(20), 1000, db)).rejects.toThrow();
  await record(
    { ...input(), supersedes: a.eventId, note: 'Waktu diperiksa ulang', occurredAt: at(-1200) },
    at(20),
    1000,
    db,
  );
  expect(project(await readState(db)).events).toHaveLength(2);
});
test('AC-08 backup restore roundtrip and device identity renewed', async () => {
  await record(input(), at(0), 1234, db);
  const state = await readState(db),
    json = backupJSON(state, 'warning', 'privacy');
  expect(parseBackup(json)).toEqual(state);
  const restored = await restoreBackup(json, db);
  expect(project(restored)).toEqual(project(state));
  expect(restored.deviceId).not.toBe(state.deviceId);
});
test('corrupted JSON or tampered payload leaves previous data intact', async () => {
  const before = await readState(db);
  await expect(restoreBackup('{bad', db)).rejects.toThrow();
  const file = JSON.parse(backupJSON(before, 'w', 'p'));
  file.state.entries[0].payload.kitchen.name = 'changed';
  await expect(restoreBackup(JSON.stringify(file), db)).rejects.toThrow();
  expect(await readState(db)).toEqual(before);
});
test('invalid foreign key with recomputed hash rejected', async () => {
  const state = await readState(db);
  const event = signEvent(
    { ...input(), batchId: 'unknown', id: 'x', deviceId: 'd', recordedAt: at(0) },
    '',
  );
  expect(() =>
    append(state, {
      kind: 'EVENT',
      event,
      metric: { eventId: 'x', batchId: 'unknown', durationMs: 1, lagMinutes: 0, recordedAt: at(0) },
    }),
  ).toThrow();
});
test('AC-11 concurrent batch creation produces unique short codes', async () => {
  const i = {
    menuName: 'Sintetis',
    portions: 1,
    foodProfile: 'COOKED_HOT' as const,
    drops: [{ recipientLabel: 'Tujuan', portions: 1 }],
  };
  await Promise.all([createBatch(i, at(0), db), createBatch(i, at(0), db)]);
  const b = project(await readState(db)).batches;
  expect(new Set(b.map((b) => b.shortCode)).size).toBe(3);
});
test('AC-13 threshold import logged, old snapshots unchanged', async () => {
  const old = project(await readState(db)).batches[0]!.threshold;
  const thresholds = structuredClone(defaultThresholds);
  thresholds.COOKED_HOT = {
    ...thresholds.COOKED_HOT,
    status: 'VERIFIED',
    verifiedBy: 'Ahli sintetis',
    verifiedAt: at(0),
  };
  await mutate((s) => append(s, { kind: 'THRESHOLDS', thresholds }), db);
  const v = project(await readState(db));
  expect(v.thresholds.COOKED_HOT.status).toBe('VERIFIED');
  expect(v.batches[0]!.threshold).toEqual(old);
});
test('AC-15 metrics record duration and lag locally', async () => {
  await record(input(), at(1200), 4321, db);
  expect(project(await readState(db)).metrics[0]).toMatchObject({
    durationMs: 4321,
    lagMinutes: 20,
  });
});
test('quota failure does not report success or erase prior state', async () => {
  const before = await readState(db),
    put = vi
      .spyOn(db.state, 'put')
      .mockRejectedValue(new DOMException('Full', 'QuotaExceededError'));
  await expect(record(input(), at(0), 1, db)).rejects.toThrow();
  put.mockRestore();
  expect(await readState(db)).toEqual(before);
});
test('CSV neutralizes formulas and quotes embedded values', () =>
  expect(csv([['=1+1', '\n@SUM(1)', '"quoted"']])).toContain('"\'=1+1"'));
test('empty state valid and truncated backup detected by count/head', () => {
  const s = newState();
  expect(project(s).events).toEqual([]);
  const a = JSON.parse(backupJSON(s, 'w', 'p'));
  a.count = 1;
  expect(() => parseBackup(JSON.stringify(a))).toThrow();
});
