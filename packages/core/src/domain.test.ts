import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import {
  activeEvents,
  aggregate,
  canonical,
  calculate,
  defaultThresholds,
  eventSchema,
  flagsFor,
  hashRecord,
  kitchenSchema,
  signEvent,
  thresholdSchema,
  verifyChain,
  localDate,
  localTime,
  fromLocal,
  type BatchEvent,
  type EventInput,
} from './index';
const base = Date.parse('2026-10-04T19:00:00Z');
const at = (m: number) => new Date(base + m * 60000).toISOString();
const p = () => structuredClone(defaultThresholds.COOKED_HOT);
function ev(
  type: EventInput['type'],
  m: number,
  tempC?: number,
  extra: Partial<EventInput> = {},
): BatchEvent {
  return signEvent(
    {
      id: `${type}-${m}`,
      batchId: 'b',
      ...(type === 'ARRIVED' || type === 'SERVE_START' ? { dropId: 'd' } : {}),
      type,
      role: 'COOK',
      occurredAt: at(m),
      recordedAt: at(m),
      deviceId: 'device',
      ...(tempC === undefined ? {} : { tempC }),
      ...extra,
    },
    '',
  );
}
const full = (temps?: number) => [
  ev('COOK_DONE', 0, temps),
  ev('PACKED', 10, temps),
  ev('LOADED', 20, temps),
  ev('ARRIVED', 60, temps),
  ev('SERVE_START', 80, temps),
];
const calc = (
  events: BatchEvent[],
  now = at(80),
  profile: 'COOKED_HOT' | 'COLD_CHAIN' | 'DRY_LOW_RISK' = 'COOKED_HOT',
) => calculate(events, 'b', 'd', profile, p(), now);
describe('exposure and AC-05', () => {
  test('missing temperatures conservatively count every minute', () =>
    expect(calc(full()).dangerMinutes).toBe(80));
  test('both endpoints must meet hot threshold', () =>
    expect(calc(full(60)).dangerMinutes).toBe(0));
  test('one cold hot-chain endpoint counts adjacent intervals', () => {
    const e = full(65);
    e[2] = ev('LOADED', 20, 59);
    expect(calc(e).dangerMinutes).toBe(50);
  });
  test('cold profile both endpoints', () =>
    expect(calc(full(5), at(80), 'COLD_CHAIN').dangerMinutes).toBe(0));
  test('cold profile warm readings', () =>
    expect(calc(full(6), at(80), 'COLD_CHAIN').dangerMinutes).toBe(80));
  test('dry has no time rule even after limit', () =>
    expect(calc(full(), at(400), 'DRY_LOW_RISK')).toMatchObject({
      dangerMinutes: null,
      timeStatus: 'NO_RULE',
      remainingMinutes: null,
    }));
  test.each([
    [89, 'OK'],
    [90, 'PERHATIAN'],
    [120, 'PERHATIAN'],
    [121, 'MELEWATI_BATAS'],
  ] as const)('boundary %s => %s', (m, status) =>
    expect(calc([ev('COOK_DONE', 0)], at(m)).timeStatus).toBe(status),
  );
  test('incomplete never hides exceeded status', () =>
    expect(calc([ev('COOK_DONE', 0)], at(130))).toMatchObject({
      timeStatus: 'MELEWATI_BATAS',
      incomplete: true,
      ongoing: true,
      remainingMinutes: -10,
    }));
  test('missing cook is unknown, never zero/OK', () =>
    expect(calc([ev('LOADED', 20)])).toMatchObject({
      dangerMinutes: null,
      timeStatus: 'UNKNOWN',
      incomplete: true,
    }));
  test('PACKED recommended, not required', () =>
    expect(calc(full().filter((e) => e.type !== 'PACKED')).incomplete).toBe(false));
  test('ongoing tail has no assumed temperature', () =>
    expect(calc(full(65).slice(0, 4), at(80)).dangerMinutes).toBe(20));
  test('stops at serving, ignores later events', () =>
    expect(calc([...full(), ev('PACKED', 200)], at(300)).dangerMinutes).toBe(80));
  test('isolation between batch and drop', () =>
    expect(
      calc([
        ...full(),
        ev('SERVE_START', 30, undefined, { batchId: 'x' }),
        ev('ARRIVED', 99, undefined, { dropId: 'other' }),
      ]).dangerMinutes,
    ).toBe(80));
  test('exact duplicate ignored', () =>
    expect(calc([...full(), full()[0]!])).toEqual(calc(full())));
  test('conflicting duplicate id rejected', () =>
    expect(() =>
      activeEvents([ev('COOK_DONE', 0), ev('LOADED', 2, undefined, { id: 'COOK_DONE-0' })]),
    ).toThrow());
  test('correction supersedes and chained correction', () => {
    const a = ev('SERVE_START', 80),
      b = ev('SERVE_START', 100, undefined, { supersedes: a.id }),
      c = ev('SERVE_START', 140, undefined, { supersedes: b.id });
    expect(calc([...full(), b, c]).dangerMinutes).toBe(140);
  });
  test('revocation removes only cancelled record; original correction target stays superseded', () => {
    const a = ev('COOK_DONE', 0),
      b = ev('COOK_DONE', 10, undefined, { supersedes: a.id });
    expect(activeEvents([a, b], [b.id])).toEqual([]);
  });
  test('multiple destinations get independent exposure', () => {
    const e = [
      ...full(),
      ev('ARRIVED', 100, undefined, { dropId: 'd2' }),
      ev('SERVE_START', 180, undefined, { dropId: 'd2' }),
    ];
    const r = calculate(e, 'b', 'd2', 'COOKED_HOT', p(), at(200));
    expect(r.dangerMinutes).toBe(180);
    expect(aggregate([calc(e), r])).toMatchObject({
      timeStatus: 'MELEWATI_BATAS',
      incomplete: false,
    });
  });
  test('aggregate completeness independent of worst time', () =>
    expect(aggregate([calc(full()), calc([ev('COOK_DONE', 0)], at(200))])).toMatchObject({
      incomplete: true,
      timeStatus: 'MELEWATI_BATAS',
    }));
  test('empty aggregate unknown', () =>
    expect(aggregate([])).toMatchObject({ timeStatus: 'UNKNOWN', incomplete: true }));
  test('dry aggregate no time rule', () =>
    expect(aggregate([calc(full(), at(200), 'DRY_LOW_RISK')]).timeStatus).toBe('NO_RULE'));
  test('serve before cook has unknown exposure and anomaly', () =>
    expect(calc([ev('SERVE_START', -1), ...full().slice(0, 4)])).toMatchObject({
      timeStatus: 'UNKNOWN',
      flags: expect.arrayContaining(['URUTAN_ANEH']),
    }));
  test('future cook flags clock', () =>
    expect(calc([ev('COOK_DONE', 100)], at(80)).flags).toContain('JAM_PERANGKAT_MENCURIGAKAN'));
  test('invalid now rejected', () => expect(() => calc(full(), 'invalid')).toThrow());
});
describe('quality AC-02', () => {
  test('late recorded > tolerance', () =>
    expect(
      flagsFor([ev('COOK_DONE', 0, undefined, { recordedAt: at(11) })], p(), at(20)),
    ).toContain('DIISI_BELAKANGAN'));
  test('exact tolerance not late', () =>
    expect(
      flagsFor([ev('COOK_DONE', 0, undefined, { recordedAt: at(10) })], p(), at(20)),
    ).not.toContain('DIISI_BELAKANGAN'));
  test('input order anomaly separate from exposure', () =>
    expect(flagsFor([...full()].reverse(), p(), at(100))).toContain('URUTAN_ANEH'));
  test('serve before arrive', () =>
    expect(
      calc([ev('COOK_DONE', 0), ev('LOADED', 10), ev('SERVE_START', 20), ev('ARRIVED', 30)]).flags,
    ).toContain('URUTAN_ANEH'));
  test('clock backwards same device', () =>
    expect(
      flagsFor(
        [ev('COOK_DONE', 0), ev('LOADED', 5, undefined, { recordedAt: at(-5) })],
        p(),
        at(20),
      ),
    ).toContain('JAM_PERANGKAT_MENCURIGAKAN'));
  test('clock large jump', () =>
    expect(flagsFor([ev('COOK_DONE', 0), ev('LOADED', 1500)], p(), at(1600))).toContain(
      'JAM_PERANGKAT_MENCURIGAKAN',
    ));
  test('devices do not share clock previous', () =>
    expect(
      flagsFor(
        [
          ev('COOK_DONE', 10),
          ev('LOADED', 20, undefined, { deviceId: 'other', recordedAt: at(5) }),
        ],
        p(),
        at(30),
      ),
    ).toContain('JAM_PERANGKAT_MENCURIGAKAN'));
  test('normal no flags', () => expect(flagsFor(full(), p(), at(80))).toEqual([]));
});
describe('schemas and time', () => {
  test.each([-31, 121, NaN, Infinity])('reject implausible temp %s', (temp) =>
    expect(eventSchema.safeParse({ ...ev('COOK_DONE', 0), tempC: temp }).success).toBe(false),
  );
  test.each([-30, 120])('accept range endpoint %s', (temp) =>
    expect(eventSchema.safeParse(ev('COOK_DONE', 0, temp)).success).toBe(true),
  );
  test('arrival requires drop', () =>
    expect(eventSchema.safeParse({ ...ev('ARRIVED', 0), dropId: undefined }).success).toBe(false));
  test('global point rejects drop', () =>
    expect(eventSchema.safeParse({ ...ev('COOK_DONE', 0), dropId: 'd' }).success).toBe(false));
  test('reject verified without expert/date', () =>
    expect(thresholdSchema.safeParse({ ...p(), status: 'VERIFIED' }).success).toBe(false));
  test('verified metadata valid', () =>
    expect(
      thresholdSchema.safeParse({
        ...p(),
        status: 'VERIFIED',
        verifiedBy: 'Ahli sintetis',
        verifiedAt: at(0),
      }).success,
    ).toBe(true));
  test('strict schema rejects extras', () =>
    expect(thresholdSchema.safeParse({ ...p(), unexpected: 1 }).success).toBe(false));
  test('invalid limits rejected', () =>
    expect(
      thresholdSchema.safeParse({ ...p(), maxMinutesInDanger: 0, warnFraction: 2 }).success,
    ).toBe(false));
  test('kitchen timezone restricted', () =>
    expect(
      kitchenSchema.safeParse({
        id: 'k',
        name: 'Sintetis',
        code: 'SYN',
        timezone: 'UTC',
        thresholdProfileId: 'default',
      }).success,
    ).toBe(false));
  test.each([
    ['Asia/Jakarta', '02:00'],
    ['Asia/Makassar', '03:00'],
    ['Asia/Jayapura', '04:00'],
  ] as const)('UTC to %s', (tz, time) => {
    expect(localDate(at(0), tz)).toBe('2026-10-05');
    expect(localTime(at(0), tz)).toBe(time);
    expect(fromLocal(`2026-10-05T${time}`, tz)).toBe(at(0));
  });
  test('cross midnight 23:00 to 02:00', () =>
    expect(calc([ev('COOK_DONE', -180), ev('SERVE_START', 0)]).dangerMinutes).toBe(180));
  test('02:00 to 08:00', () =>
    expect(calc([ev('COOK_DONE', 0), ev('SERVE_START', 360)]).dangerMinutes).toBe(360));
  test('invalid local date rejected', () =>
    expect(() => fromLocal('garbage', 'Asia/Jakarta')).toThrow());
});
describe('AC-09 canonical SHA-256 chain', () => {
  test('key order deterministic nested', () =>
    expect(canonical({ b: 2, a: { z: 1, k: [1, 'x'] } })).toBe(
      canonical({ a: { k: [1, 'x'], z: 1 }, b: 2 }),
    ));
  test('undefined object fields omitted', () =>
    expect(canonical({ x: undefined, a: null })).toBe('{"a":null}'));
  test('invalid canonical values rejected', () => {
    expect(() => canonical(NaN)).toThrow();
    expect(() => canonical(undefined)).toThrow();
  });
  test('known SHA-256 empty vector', () => expect(hashRecord('', '')).toHaveLength(64));
  test('valid chain and tampering insertion reorder', () => {
    const a = ev('COOK_DONE', 0),
      b = signEvent({ ...ev('LOADED', 20), id: 'b' }, a.hash);
    expect(verifyChain([a, b])).toBe(true);
    expect(verifyChain([{ ...a, tempC: 88 }, b])).toBe(false);
    expect(verifyChain([a, a, b])).toBe(false);
    expect(verifyChain([b, a])).toBe(false);
    expect(verifyChain([])).toBe(true);
  });
  test('wrong head rejected', () => expect(verifyChain([ev('COOK_DONE', 0)], 'wrong')).toBe(false));
});
describe('properties', () => {
  test('adding unmeasured delay never improves time status', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 }), (a, b) => {
        expect(calc([ev('COOK_DONE', 0)], at(a + b)).dangerMinutes!).toBeGreaterThanOrEqual(
          calc([ev('COOK_DONE', 0)], at(a)).dangerMinutes!,
        );
      }),
    ));
  test('inserting temperature-qualified point cannot increase exposure', () =>
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 79 }), (m) => {
        const e = [ev('COOK_DONE', 0, 65), ev('SERVE_START', 80, 65)];
        expect(calc([...e, ev('PACKED', m, 65)]).dangerMinutes!).toBeLessThanOrEqual(
          calc(e).dangerMinutes!,
        );
      }),
    ));
  test('permutation does not change exposure and time status', () =>
    fc.assert(
      fc.property(fc.shuffledSubarray(full(), { minLength: 5, maxLength: 5 }), (e) => {
        expect(calc(e).dangerMinutes).toBe(calc(full()).dangerMinutes);
        expect(calc(e).timeStatus).toBe(calc(full()).timeStatus);
      }),
    ));
  test('identical input gives identical result', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (m) => {
        expect(calc(full(), at(m))).toEqual(calc(full(), at(m)));
      }),
    ));
});
test('property measured qualifying midpoint with arbitrary endpoints never increases exposure', () =>
  fc.assert(
    fc.property(
      fc.integer({ min: -30, max: 120 }),
      fc.integer({ min: -30, max: 120 }),
      fc.integer({ min: 1, max: 79 }),
      (a, b, m) => {
        for (const profile of ['COOKED_HOT', 'COLD_CHAIN'] as const) {
          const e = [ev('COOK_DONE', 0, a), ev('SERVE_START', 80, b)];
          const baseline = calc(e, at(80), profile);
          const inserted = calc(
            [...e, ev('PACKED', m, profile === 'COOKED_HOT' ? 60 : 5)],
            at(80),
            profile,
          );
          expect(inserted.dangerMinutes!).toBeLessThanOrEqual(baseline.dangerMinutes!);
        }
      },
    ),
  ));
