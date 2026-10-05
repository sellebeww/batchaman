import { calculate, localDate, localTime, type Batch } from '@batchaman/core';
import { csv, type View } from './store';
import { t } from './i18n/id';
export function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function reportRows(v: View, batches: Batch[], now: string): unknown[][] {
  const rows: unknown[][] = [
    [t.app, t.summary],
    [t.exportWarning, t.warning],
    [t.privacy],
    [
      'batch_id',
      'short_code',
      'date',
      'menu',
      'drop_id',
      'recipient',
      'route',
      'vehicle',
      'portions',
      'profile',
      'threshold_status',
      'limit_minutes',
      'danger_minutes',
      'remaining_minutes',
      'time_status',
      'complete',
      'flags',
      'source',
      'verified_by',
      'verified_at',
    ],
  ];
  for (const b of batches)
    for (const d of v.drops.filter((d) => d.batchId === b.id)) {
      const r = calculate(v.events, b.id, d.id, b.foodProfile, b.threshold, now, v.revoked);
      rows.push([
        b.id,
        b.shortCode,
        localDate(b.createdAt, v.kitchen!.timezone),
        b.menuName,
        d.id,
        d.recipientLabel,
        d.routeLabel,
        d.vehicleLabel,
        d.portions,
        b.foodProfile,
        b.threshold.status,
        b.threshold.maxMinutesInDanger,
        r.dangerMinutes,
        r.remainingMinutes,
        r.timeStatus,
        !r.incomplete,
        r.flags.join(';'),
        b.threshold.source,
        b.threshold.verifiedBy,
        b.threshold.verifiedAt,
      ]);
    }
  rows.push(
    [],
    [
      'event_id',
      'batch_id',
      'drop_id',
      'type',
      'occurred_at_utc',
      'recorded_at_utc',
      'time_local',
      'temperature_c',
      'role',
      'actor_tag',
      'note',
      'supersedes',
      'revoked',
      'device_id',
      'prev_hash',
      'hash',
      'duration_ms',
      'lag_minutes',
      'realtime_tolerance_min',
    ],
  );
  for (const e of v.events.filter((e) => batches.some((b) => b.id === e.batchId)))
    rows.push([
      e.id,
      e.batchId,
      e.dropId,
      e.type,
      e.occurredAt,
      e.recordedAt,
      localDate(e.occurredAt, v.kitchen!.timezone) +
        ' ' +
        localTime(e.occurredAt, v.kitchen!.timezone),
      e.tempC,
      e.role,
      e.actorTag,
      e.note,
      e.supersedes,
      v.revoked.includes(e.id),
      e.deviceId,
      e.prevHash,
      e.hash,
      v.metrics.find((m) => m.eventId === e.id)?.durationMs,
      v.metrics.find((m) => m.eventId === e.id)?.lagMinutes,
      v.batches.find((b) => b.id === e.batchId)!.threshold.realtimeToleranceMin,
    ]);
  return rows;
}
export const reportCSV = (v: View, batches: Batch[], now: string) =>
  csv(reportRows(v, batches, now));
export function metricsCSV(v: View) {
  return csv([
    [
      'event_id',
      'batch_id',
      'duration_ms',
      'lag_minutes',
      'recorded_at',
      'realtime_tolerance_min',
      'warning',
      'privacy',
    ],
    ...v.metrics.map((m) => [
      m.eventId,
      m.batchId,
      m.durationMs,
      m.lagMinutes,
      m.recordedAt,
      v.batches.find((b) => b.id === m.batchId)!.threshold.realtimeToleranceMin,
      t.warning,
      t.privacy,
    ]),
  ]);
}
