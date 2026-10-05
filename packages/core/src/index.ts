import { z } from 'zod';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import defaults from '../config/thresholds.default.json';
export const DOMAIN_VERSION = 1;
export const EVENT_TYPES = ['COOK_DONE', 'PACKED', 'LOADED', 'ARRIVED', 'SERVE_START'] as const;
export const ROLES = ['COOK', 'PACKER', 'DRIVER', 'RECEIVER', 'SUPERVISOR'] as const;
export const FOOD_PROFILES = ['COOKED_HOT', 'COLD_CHAIN', 'DRY_LOW_RISK'] as const;
export const ZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export type Role = (typeof ROLES)[number];
export type FoodProfile = (typeof FOOD_PROFILES)[number];
export type Zone = (typeof ZONES)[number];
const id = z.string().trim().min(1).max(100);
const iso = z.iso.datetime();
export const thresholdSchema = z
  .strictObject({
    id,
    hotHoldC: z.number().min(-30).max(120),
    coldMaxC: z.number().min(-30).max(120),
    maxMinutesInDanger: z.number().positive().max(10080),
    warnFraction: z.number().gt(0).lt(1),
    realtimeToleranceMin: z.number().min(0).max(1440),
    status: z.enum(['UNVERIFIED', 'VERIFIED']),
    source: z.string().trim().min(1).max(2000),
    verifiedBy: z.string().trim().min(1).max(200).nullable(),
    verifiedAt: iso.nullable(),
  })
  .refine((p) => p.hotHoldC > p.coldMaxC)
  .refine((p) => p.status !== 'VERIFIED' || (p.verifiedBy !== null && p.verifiedAt !== null));
export type Threshold = z.infer<typeof thresholdSchema>;
export const thresholdSetSchema = z.strictObject({
  COOKED_HOT: thresholdSchema,
  COLD_CHAIN: thresholdSchema,
  DRY_LOW_RISK: thresholdSchema,
});
export type ThresholdSet = z.infer<typeof thresholdSetSchema>;
export const defaultThresholds = thresholdSetSchema.parse(defaults);
export const kitchenSchema = z.strictObject({
  id,
  name: z.string().trim().min(1).max(100),
  code: z.string().regex(/^[A-Z0-9]{2,12}$/),
  timezone: z.enum(ZONES),
  thresholdProfileId: id,
});
export type Kitchen = z.infer<typeof kitchenSchema>;
export const batchSchema = z.strictObject({
  id,
  shortCode: id,
  kitchenId: id,
  menuName: z.string().trim().min(1).max(120),
  portions: z.number().int().positive().max(100000),
  foodProfile: z.enum(FOOD_PROFILES),
  createdAt: iso,
  voidedAt: iso.optional(),
  voidReason: z.string().min(1).max(500).optional(),
  threshold: thresholdSchema,
});
export type Batch = z.infer<typeof batchSchema>;
export const dropSchema = z.strictObject({
  id,
  batchId: id,
  recipientLabel: z.string().trim().min(1).max(120),
  portions: z.number().int().positive().max(100000),
  routeLabel: z.string().max(100).optional(),
  vehicleLabel: z.string().max(100).optional(),
});
export type Drop = z.infer<typeof dropSchema>;
const eventFields = {
  id,
  batchId: id,
  dropId: id.optional(),
  type: z.enum(EVENT_TYPES),
  role: z.enum(ROLES),
  actorTag: z.string().max(30).optional(),
  occurredAt: iso,
  recordedAt: iso,
  tempC: z.number().min(-30).max(120).optional(),
  note: z.string().max(1000).optional(),
  supersedes: id.optional(),
  deviceId: id,
};
const dropValid = (e: { type: EventType; dropId?: string }) =>
  e.type === 'ARRIVED' || e.type === 'SERVE_START' ? !!e.dropId : e.dropId === undefined;
export const eventInputSchema = z.strictObject(eventFields).refine(dropValid);
export const eventSchema = z
  .strictObject({ ...eventFields, prevHash: z.string(), hash: z.string().regex(/^[a-f0-9]{64}$/) })
  .refine(dropValid);
export type EventInput = z.infer<typeof eventInputSchema>;
export type BatchEvent = z.infer<typeof eventSchema>;
export function canonical(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (typeof value === 'object' && value !== null)
    return (
      '{' +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  throw new Error('Non-canonical value');
}
export function hashRecord(prevHash: string, payload: unknown): string {
  return bytesToHex(sha256(utf8ToBytes(prevHash + canonical(payload))));
}
export function signEvent(input: EventInput, prevHash: string): BatchEvent {
  // Allow callers to re-sign a projection but never include prior hashes.
  const { hash: _hash, prevHash: _prev, ...raw } = input as BatchEvent;
  const payload = eventInputSchema.parse(raw);
  return { ...payload, prevHash, hash: hashRecord(prevHash, payload) };
}
export function verifyChain(events: BatchEvent[], expectedHead?: string): boolean {
  let previous = '';
  const ids = new Set<string>();
  for (const event of events) {
    const { hash, prevHash, ...payload } = event;
    if (
      ids.has(event.id) ||
      !eventSchema.safeParse(event).success ||
      prevHash !== previous ||
      hash !== hashRecord(prevHash, payload)
    )
      return false;
    ids.add(event.id);
    previous = hash;
  }
  return expectedHead === undefined || previous === expectedHead;
}
export function activeEvents(events: BatchEvent[], revoked: readonly string[] = []): BatchEvent[] {
  const unique = new Map<string, BatchEvent>();
  for (const e of events) {
    const old = unique.get(e.id);
    if (old && canonical(old) !== canonical(e)) throw new Error('Conflicting event ID');
    unique.set(e.id, e);
  }
  const replaced = new Set([
    ...revoked,
    ...events.flatMap((e) => (e.supersedes ? [e.supersedes] : [])),
  ]);
  return [...unique.values()].filter((e) => !replaced.has(e.id));
}
export type QualityFlag = 'DIISI_BELAKANGAN' | 'URUTAN_ANEH' | 'JAM_PERANGKAT_MENCURIGAKAN';
export type TimeStatus = 'OK' | 'PERHATIAN' | 'MELEWATI_BATAS' | 'UNKNOWN' | 'NO_RULE';
export function flagsFor(events: BatchEvent[], p: Threshold, now: string): QualityFlag[] {
  const flags = new Set<QualityFlag>();
  const previousDevice = new Map<string, number>();
  const previousRoute = new Map<string, { time: number; rank: number }>();
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error('Invalid now');
  for (const e of events) {
    const occurred = Date.parse(e.occurredAt),
      recorded = Date.parse(e.recordedAt),
      prev = previousDevice.get(e.deviceId);
    if (recorded - occurred > p.realtimeToleranceMin * 60000) flags.add('DIISI_BELAKANGAN');
    if (
      recorded < occurred ||
      occurred > nowMs ||
      recorded > nowMs ||
      (prev !== undefined && (recorded < prev || recorded - prev > 86400000))
    )
      flags.add('JAM_PERANGKAT_MENCURIGAKAN');
    previousDevice.set(e.deviceId, recorded);
    const key = e.batchId + ':' + (e.dropId ?? '*'),
      prior = previousRoute.get(key),
      rank = EVENT_TYPES.indexOf(e.type);
    if (prior && (occurred < prior.time || rank < prior.rank)) flags.add('URUTAN_ANEH');
    previousRoute.set(key, { time: occurred, rank });
  }
  return [...flags].sort();
}
export interface Exposure {
  dangerMinutes: number | null;
  remainingMinutes: number | null;
  timeStatus: TimeStatus;
  incomplete: boolean;
  missing: EventType[];
  ongoing: boolean;
  flags: QualityFlag[];
}
export function calculate(
  events: BatchEvent[],
  batchId: string,
  dropId: string,
  profile: FoodProfile,
  p: Threshold,
  now: string,
  revoked: readonly string[] = [],
): Exposure {
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error('Invalid now');
  const e = activeEvents(events, revoked).filter(
    (e) => e.batchId === batchId && (e.dropId === undefined || e.dropId === dropId),
  );
  const flags = new Set(flagsFor(e, p, now));
  const ordered = [...e].sort(
    (a, b) =>
      Date.parse(a.occurredAt) - Date.parse(b.occurredAt) ||
      EVENT_TYPES.indexOf(a.type) - EVENT_TYPES.indexOf(b.type) ||
      a.id.localeCompare(b.id),
  );
  for (let i = 1; i < ordered.length; i++)
    if (EVENT_TYPES.indexOf(ordered[i]!.type) < EVENT_TYPES.indexOf(ordered[i - 1]!.type))
      flags.add('URUTAN_ANEH');
  const required: EventType[] = ['COOK_DONE', 'LOADED', 'ARRIVED', 'SERVE_START'];
  const missing = required.filter((t) => !e.some((e) => e.type === t));
  const start = ordered.find((e) => e.type === 'COOK_DONE'),
    end = ordered.find((e) => e.type === 'SERVE_START');
  const result: Exposure = {
    dangerMinutes: null,
    remainingMinutes: null,
    timeStatus: 'UNKNOWN',
    incomplete: missing.length > 0,
    missing,
    ongoing: !end,
    flags: [...flags].sort(),
  };
  if (profile === 'DRY_LOW_RISK') return { ...result, timeStatus: 'NO_RULE' };
  if (!start || Date.parse(start.occurredAt) > nowMs || (end && end.occurredAt < start.occurredAt))
    return result;
  const until = end ? Date.parse(end.occurredAt) : nowMs;
  const points = ordered.filter(
    (e) =>
      Date.parse(e.occurredAt) >= Date.parse(start.occurredAt) && Date.parse(e.occurredAt) <= until,
  );
  const holds = (temp: number | undefined) =>
    temp !== undefined && (profile === 'COOKED_HOT' ? temp >= p.hotHoldC : temp <= p.coldMaxC);
  let danger = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!;
    if (!(holds(a.tempC) && holds(b.tempC)))
      danger += (Date.parse(b.occurredAt) - Date.parse(a.occurredAt)) / 60000;
  }
  if (!end) danger += Math.max(0, (until - Date.parse(points.at(-1)!.occurredAt)) / 60000);
  return {
    ...result,
    dangerMinutes: danger,
    remainingMinutes: p.maxMinutesInDanger - danger,
    timeStatus:
      danger > p.maxMinutesInDanger
        ? 'MELEWATI_BATAS'
        : danger >= p.maxMinutesInDanger * p.warnFraction
          ? 'PERHATIAN'
          : 'OK',
  };
}
export function aggregate(results: Exposure[]): { timeStatus: TimeStatus; incomplete: boolean } {
  const rank: Record<TimeStatus, number> = {
    NO_RULE: 0,
    UNKNOWN: 1,
    OK: 2,
    PERHATIAN: 3,
    MELEWATI_BATAS: 4,
  };
  return {
    timeStatus: results.length
      ? results.reduce(
          (a, b) => (rank[b.timeStatus] > rank[a] ? b.timeStatus : a),
          results[0]!.timeStatus,
        )
      : 'UNKNOWN',
    incomplete: !results.length || results.some((r) => r.incomplete),
  };
}
export function localDate(utc: string, zone: Zone): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(utc));
}
export function localTime(utc: string, zone: Zone): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(utc));
}
export function fromLocal(value: string, zone: Zone): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Invalid local timestamp');
  const offset: Record<Zone, string> = {
    'Asia/Jakarta': '+07:00',
    'Asia/Makassar': '+08:00',
    'Asia/Jayapura': '+09:00',
  };
  const parsed = new Date(value + ':00' + offset[zone]);
  if (
    !Number.isFinite(parsed.getTime()) ||
    localDate(parsed.toISOString(), zone) + 'T' + localTime(parsed.toISOString(), zone) !== value
  )
    throw new Error('Invalid local timestamp');
  return parsed.toISOString();
}
export interface SyncAdapter {
  push(events: readonly BatchEvent[]): Promise<void>;
  pull(cursor?: string): Promise<readonly BatchEvent[]>;
}
export interface SensorAdapter {
  readTemperature(): Promise<{ tempC: number; measuredAt: string }>;
}
