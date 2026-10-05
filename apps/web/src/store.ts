import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import {
  activeEvents,
  batchSchema,
  canonical,
  defaultThresholds,
  dropSchema,
  eventSchema,
  hashRecord,
  kitchenSchema,
  localDate,
  signEvent,
  thresholdSetSchema,
  verifyChain,
  type Batch,
  type BatchEvent,
  type Drop,
  type EventInput,
  type Kitchen,
  type ThresholdSet,
} from '@batchaman/core';
const metricSchema = z.strictObject({
  eventId: z.string(),
  batchId: z.string(),
  durationMs: z.number().min(0),
  lagMinutes: z.number(),
  recordedAt: z.iso.datetime(),
});
export type Metric = z.infer<typeof metricSchema>;
const payloadSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('KITCHEN'), kitchen: kitchenSchema }),
  z.strictObject({ kind: z.literal('THRESHOLDS'), thresholds: thresholdSetSchema }),
  z.strictObject({
    kind: z.literal('BATCH'),
    batch: batchSchema,
    drops: z.array(dropSchema).min(1),
  }),
  z.strictObject({ kind: z.literal('EVENT'), event: eventSchema, metric: metricSchema }),
  z.strictObject({ kind: z.literal('REVOKE'), eventId: z.string(), at: z.iso.datetime() }),
  z.strictObject({
    kind: z.literal('RESOLVE'),
    batchId: z.string(),
    note: z.string().trim().min(1).max(1000),
    at: z.iso.datetime(),
  }),
]);
type Payload = z.infer<typeof payloadSchema>;
const entrySchema = z.strictObject({
  payload: payloadSchema,
  prevHash: z.string(),
  hash: z.string(),
});
const stateSchema = z.strictObject({
  version: z.literal(1),
  deviceId: z.string().min(1),
  entries: z.array(entrySchema).max(100000),
  lastBackup: z.iso.datetime().nullable(),
});
export type State = z.infer<typeof stateSchema>;
export interface View {
  kitchen: Kitchen | null;
  thresholds: ThresholdSet;
  batches: Batch[];
  drops: Drop[];
  events: BatchEvent[];
  revoked: string[];
  metrics: Metric[];
  resolutions: { batchId: string; note: string; at: string }[];
}
export class StoreError extends Error {}
export class BatchDB extends Dexie {
  state!: Table<State & { id: string }, string>;
  constructor(name = 'batchaman-v1') {
    super(name);
    this.version(1).stores({ state: 'id' });
  }
}
export const db = new BatchDB(
  import.meta.env?.VITE_DEMO === 'true' ? 'batchaman-demo-v1' : 'batchaman-v1',
);
export const newState = (deviceId: string = crypto.randomUUID()): State => ({
  version: 1,
  deviceId,
  entries: [],
  lastBackup: null,
});
export function project(state: State): View {
  const v: View = {
    kitchen: null,
    thresholds: structuredClone(defaultThresholds),
    batches: [],
    drops: [],
    events: [],
    revoked: [],
    metrics: [],
    resolutions: [],
  };
  const batches = new Map<string, Batch>();
  const drops = new Map<string, Drop>();
  const events = new Map<string, BatchEvent>();
  const currentPoints = new Map<string, BatchEvent>();
  const shortCodes = new Set<string>();
  const pointKey = (e: BatchEvent) => JSON.stringify([e.batchId, e.dropId ?? null, e.type]);
  let prev = '';
  for (const entry of state.entries) {
    if (entry.prevHash !== prev || entry.hash !== hashRecord(prev, entry.payload))
      throw new StoreError('integrity');
    prev = entry.hash;
    const p = entry.payload;
    if (p.kind === 'KITCHEN') {
      if (v.kitchen) throw new StoreError('relation');
      v.kitchen = p.kitchen;
    }
    if (p.kind === 'THRESHOLDS') v.thresholds = p.thresholds;
    if (p.kind === 'BATCH') {
      if (
        !v.kitchen ||
        p.batch.kitchenId !== v.kitchen.id ||
        batches.has(p.batch.id) ||
        shortCodes.has(p.batch.shortCode) ||
        p.drops.some((d) => d.batchId !== p.batch.id || drops.has(d.id)) ||
        new Set(p.drops.map((d) => d.id)).size !== p.drops.length ||
        p.drops.reduce((n, d) => n + d.portions, 0) !== p.batch.portions
      )
        throw new StoreError('relation');
      v.batches.push(p.batch);
      v.drops.push(...p.drops);
      batches.set(p.batch.id, p.batch);
      shortCodes.add(p.batch.shortCode);
      for (const drop of p.drops) drops.set(drop.id, drop);
    }
    if (p.kind === 'EVENT') {
      const e = p.event;
      if (
        !batches.has(e.batchId) ||
        (e.dropId && drops.get(e.dropId)?.batchId !== e.batchId) ||
        events.has(e.id) ||
        p.metric.eventId !== e.id ||
        p.metric.batchId !== e.batchId ||
        p.metric.recordedAt !== e.recordedAt ||
        p.metric.lagMinutes !== (Date.parse(e.recordedAt) - Date.parse(e.occurredAt)) / 60000
      )
        throw new StoreError('relation');
      const current = currentPoints.get(pointKey(e));
      if (e.supersedes ? !current || current.id !== e.supersedes || !e.note?.trim() : !!current)
        throw new StoreError('correction');
      v.events.push(e);
      v.metrics.push(p.metric);
      events.set(e.id, e);
      currentPoints.set(pointKey(e), e);
    }
    if (p.kind === 'REVOKE') {
      const e = events.get(p.eventId);
      if (
        !e ||
        e.supersedes ||
        currentPoints.get(pointKey(e))?.id !== e.id ||
        Date.parse(p.at) - Date.parse(e.recordedAt) > 10000 ||
        Date.parse(p.at) < Date.parse(e.recordedAt)
      )
        throw new StoreError('undo');
      v.revoked.push(e.id);
      currentPoints.delete(pointKey(e));
    }
    if (p.kind === 'RESOLVE') {
      if (!batches.has(p.batchId)) throw new StoreError('relation');
      v.resolutions.push(p);
    }
  }
  if (!verifyChain(v.events)) throw new StoreError('integrity');
  return v;
}
export async function readState(database = db): Promise<State> {
  const saved = await database.state.get('main');
  if (!saved) return newState();
  const { id: _id, ...data } = saved;
  const state = stateSchema.parse(data);
  project(state);
  return state;
}
export function append(state: State, payload: Payload): State {
  const parsed = payloadSchema.parse(payload),
    prevHash = state.entries.at(-1)?.hash ?? '';
  const next = {
    ...state,
    entries: [...state.entries, { payload: parsed, prevHash, hash: hashRecord(prevHash, parsed) }],
  };
  project(next);
  return next;
}
export async function mutate(fn: (s: State, v: View) => State, database = db): Promise<State> {
  return database.transaction('rw', database.state, async () => {
    const s = await readState(database);
    const next = fn(s, project(s));
    await database.state.put({ ...next, id: 'main' });
    return next;
  });
}
export async function setup(kitchen: Kitchen, database = db) {
  return mutate((s) => append(s, { kind: 'KITCHEN', kitchen }), database);
}
export async function createBatch(
  input: {
    menuName: string;
    portions: number;
    foodProfile: Batch['foodProfile'];
    drops: Omit<Drop, 'id' | 'batchId'>[];
  },
  now: string,
  database = db,
) {
  let batchId = '';
  const state = await mutate((s, v) => {
    if (!v.kitchen) throw new StoreError('kitchen');
    const date = localDate(now, v.kitchen.timezone).replaceAll('-', '');
    const prefix = v.kitchen.code + '-' + date + '-';
    let n = 1;
    while (v.batches.some((b) => b.shortCode === prefix + String(n).padStart(2, '0'))) n++;
    batchId = crypto.randomUUID();
    const batch: Batch = {
      id: batchId,
      kitchenId: v.kitchen.id,
      shortCode: prefix + String(n).padStart(2, '0'),
      menuName: input.menuName,
      portions: input.portions,
      foodProfile: input.foodProfile,
      createdAt: now,
      threshold: structuredClone(v.thresholds[input.foodProfile]),
    };
    return append(s, {
      kind: 'BATCH',
      batch,
      drops: input.drops.map((d) => ({ ...d, id: crypto.randomUUID(), batchId })),
    });
  }, database);
  return { state, batchId };
}
export async function record(
  input: Omit<EventInput, 'id' | 'deviceId' | 'recordedAt'>,
  now: string,
  durationMs: number,
  database = db,
) {
  let eventId = '';
  let duplicate = false;
  const state = await mutate((s, v) => {
    const current = activeEvents(v.events, v.revoked).find(
      (e) => e.batchId === input.batchId && e.dropId === input.dropId && e.type === input.type,
    );
    if (current && !input.supersedes) {
      eventId = current.id;
      duplicate = true;
      return s;
    }
    const event = signEvent(
      { ...input, id: crypto.randomUUID(), deviceId: s.deviceId, recordedAt: now },
      v.events.at(-1)?.hash ?? '',
    );
    eventId = event.id;
    return append(s, {
      kind: 'EVENT',
      event,
      metric: {
        eventId,
        batchId: event.batchId,
        durationMs,
        lagMinutes: (Date.parse(now) - Date.parse(event.occurredAt)) / 60000,
        recordedAt: now,
      },
    });
  }, database);
  return { state, eventId, duplicate };
}
export async function revoke(eventId: string, now: string, database = db) {
  return mutate((s) => append(s, { kind: 'REVOKE', eventId, at: now }), database);
}
export function backupJSON(state: State, warning: string, privacy: string) {
  project(state);
  return JSON.stringify(
    {
      format: 'BatchAman',
      warning,
      privacy,
      head: state.entries.at(-1)?.hash ?? '',
      count: state.entries.length,
      state,
    },
    null,
    2,
  );
}
// Only acknowledge the exact snapshot downloaded; another tab may have written meanwhile.
export async function markBackupExported(snapshot: State, now: string, database = db) {
  z.iso.datetime().parse(now);
  return mutate(
    (current) =>
      current.deviceId === snapshot.deviceId &&
      current.entries.at(-1)?.hash === snapshot.entries.at(-1)?.hash
        ? { ...current, lastBackup: now }
        : current,
    database,
  );
}
export function parseBackup(text: string): State {
  if (text.length > 50_000_000) throw new StoreError('size');
  const file = z
    .strictObject({
      format: z.literal('BatchAman'),
      warning: z.string(),
      privacy: z.string(),
      head: z.string(),
      count: z.number().int(),
      state: stateSchema,
    })
    .parse(JSON.parse(text));
  if (
    file.count !== file.state.entries.length ||
    file.head !== (file.state.entries.at(-1)?.hash ?? '')
  )
    throw new StoreError('integrity');
  project(file.state);
  return file.state;
}
export async function restoreBackup(text: string, database = db) {
  const s = parseBackup(text);
  const restored = { ...s, deviceId: crypto.randomUUID(), lastBackup: null };
  await database.transaction('rw', database.state, () =>
    database.state.put({ ...restored, id: 'main' }),
  );
  return restored;
}
export const exportCell = (value: unknown) => {
  let s = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
export const csv = (rows: unknown[][]) =>
  '\uFEFF' + rows.map((r) => r.map(exportCell).join(',')).join('\r\n');
export function assertSame(a: unknown, b: unknown) {
  return canonical(a) === canonical(b);
}
