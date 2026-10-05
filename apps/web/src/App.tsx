import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  activeEvents,
  aggregate,
  calculate,
  EVENT_TYPES,
  FOOD_PROFILES,
  fromLocal,
  localDate,
  localTime,
  ROLES,
  thresholdSetSchema,
  ZONES,
  type Batch,
  type BatchEvent,
  type EventType,
  type Exposure,
  type FoodProfile,
  type Kitchen,
  type Role,
} from '@batchaman/core';
import {
  append,
  backupJSON,
  markBackupExported,
  createBatch,
  mutate,
  newState,
  project,
  readState,
  record,
  restoreBackup,
  revoke,
  setup,
  type State,
  type View,
} from './store';
import { t } from './i18n/id';
import { Icon } from './Icon';
import { AppUpdate } from './AppUpdate';
import { demoDate } from './demo';
import { download, metricsCSV, reportCSV } from './reports';
import { enableAudio, notifyWarning } from './alerts';
const Scanner = lazy(() => import('./Scanner'));
type Screen = 'today' | 'create' | 'detail' | 'confirm' | 'trace' | 'data' | 'about' | 'label';
const emptyView = () => project(newState());
const nowISO = () => new Date().toISOString();
const dateTime = (utc: string, k: Kitchen) =>
  localDate(utc, k.timezone) + ' ' + localTime(utc, k.timezone);
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Status({ r }: { r: Exposure }) {
  return (
    <div className={'status ' + r.timeStatus}>
      <strong>
        {r.timeStatus === 'MELEWATI_BATAS' ? '! ' : r.timeStatus === 'PERHATIAN' ? '△ ' : '◷ '}
        {t.timeNames[r.timeStatus]}
      </strong>
      <div>
        {r.incomplete ? t.incomplete : t.complete} · {r.ongoing ? t.ongoing : t.finished}
      </div>
      {r.remainingMinutes !== null && (
        <p>
          {r.remainingMinutes < 0 ? t.overdue : t.remaining}:{' '}
          <b>
            {r.remainingMinutes < 0
              ? Math.ceil(-r.remainingMinutes)
              : Math.floor(r.remainingMinutes)}{' '}
            {t.minutes}
          </b>{' '}
          · {t.exposure}: {Math.ceil(r.dangerMinutes!)} {t.minutes}
        </p>
      )}
      {r.flags.length > 0 && (
        <ul>
          {r.flags.map((f) => (
            <li key={f}>{t.flagNames[f]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
function KitchenForm({ onSave }: { onSave: (k: Kitchen) => Promise<void> }) {
  return (
    <form
      className="panel stack"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void onSave({
          id: crypto.randomUUID(),
          name: String(f.get('name')),
          code: String(f.get('code')).toUpperCase(),
          timezone: String(f.get('zone')) as Kitchen['timezone'],
          thresholdProfileId: 'placeholder-v1',
        });
      }}
    >
      <h1>{t.welcome}</h1>
      <p>{t.intro}</p>
      <Field label={t.kitchenName}>
        <input name="name" required maxLength={100} />
      </Field>
      <Field label={t.kitchenCode}>
        <input name="code" required pattern="[A-Za-z0-9]{2,12}" maxLength={12} />
      </Field>
      <Field label={t.zone}>
        <select name="zone">
          {ZONES.map((z, i) => (
            <option key={z} value={z}>
              {['WIB', 'WITA', 'WIT'][i]}
            </option>
          ))}
        </select>
      </Field>
      <p>{t.timezoneHint}</p>
      <button className="primary">{t.start}</button>
    </form>
  );
}
function BatchForm({
  onSave,
}: {
  onSave: (input: Parameters<typeof createBatch>[0]) => Promise<void>;
}) {
  const [dest, setDest] = useState([
    { recipientLabel: '', portions: 100, routeLabel: '', vehicleLabel: '' },
  ]);
  const [portions, setPortions] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (i: number, key: string, value: string | number) =>
    setDest((d) => d.map((x, n) => (n === i ? { ...x, [key]: value } : x)));
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      portions = Number(f.get('portions'));
    if (dest.reduce((s, d) => s + d.portions, 0) !== portions) {
      setError(t.invalidPortions);
      return;
    }
    setBusy(true);
    try {
      await onSave({
        menuName: String(f.get('menu')),
        portions,
        foodProfile: String(f.get('profile')) as FoodProfile,
        drops: dest,
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={(e) => void submit(e)} className="stack">
      <h1>{t.create}</h1>
      <div className="panel stack">
        <Field label={t.menu}>
          <input name="menu" required maxLength={120} />
        </Field>
        <Field label={t.portions}>
          <input
            name="portions"
            type="number"
            min={1}
            max={100000}
            value={portions}
            onChange={(e) => setPortions(Number(e.target.value))}
            required
          />
        </Field>
        <Field label={t.profile}>
          <select name="profile">
            {FOOD_PROFILES.map((p) => (
              <option key={p} value={p}>
                {t.foodNames[p]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <h2>{t.destinations}</h2>
      {dest.map((d, i) => (
        <fieldset className="panel stack" key={i}>
          <legend>
            {t.destinations} {i + 1}
          </legend>
          <Field label={t.recipient}>
            <input
              required
              maxLength={120}
              value={d.recipientLabel}
              onChange={(e) => update(i, 'recipientLabel', e.target.value)}
            />
          </Field>
          <Field label={t.portions}>
            <input
              required
              type="number"
              min={1}
              max={100000}
              value={d.portions}
              onChange={(e) => update(i, 'portions', Number(e.target.value))}
            />
          </Field>
          <Field label={t.route}>
            <input
              value={d.routeLabel}
              maxLength={100}
              onChange={(e) => update(i, 'routeLabel', e.target.value)}
            />
          </Field>
          <Field label={t.vehicle}>
            <input
              value={d.vehicleLabel}
              maxLength={100}
              onChange={(e) => update(i, 'vehicleLabel', e.target.value)}
            />
          </Field>
          {dest.length > 1 && (
            <button type="button" onClick={() => setDest(dest.filter((_, j) => j !== i))}>
              {t.remove}
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() =>
          setDest([
            ...dest,
            { recipientLabel: '', portions: 100, routeLabel: '', vehicleLabel: '' },
          ])
        }
      >
        + {t.addDrop}
      </button>
      <p className="allocation-summary" role="status">
        {t.portionsAssigned}:{' '}
        <strong>
          {dest.reduce((sum, d) => sum + d.portions, 0)} / {portions}
        </strong>
      </p>
      <p>{t.createHint}</p>
      {error && <p role="alert">{error}</p>}
      <button className="primary" disabled={busy}>
        {t.create}
      </button>
    </form>
  );
}
function QR({ code }: { code: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    void import('qrcode')
      .then((q) => q.toDataURL(code, { width: 240, margin: 2, errorCorrectionLevel: 'M' }))
      .then((s) => {
        if (active) setUrl(s);
      });
    return () => {
      active = false;
    };
  }, [code]);
  return url ? (
    <img className="qr" src={url} width={240} height={240} alt={`${t.label}: ${code}`} />
  ) : (
    <p>{t.loading}</p>
  );
}
export default function App() {
  const [state, setState] = useState<State>(newState),
    [view, setView] = useState<View>(emptyView),
    [loading, setLoading] = useState(true),
    [screen, setScreen] = useState<Screen>('today'),
    [batchId, setBatchId] = useState(''),
    [dropId, setDropId] = useState(''),
    [point, setPoint] = useState<EventType>('COOK_DONE'),
    [correction, setCorrection] = useState<BatchEvent | null>(null),
    [now, setNow] = useState(nowISO),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [online, setOnline] = useState(navigator.onLine),
    [date, setDate] = useState(''),
    [query, setQuery] = useState(''),
    [batchFilter, setBatchFilter] = useState<'all' | 'attention' | 'incomplete'>('all'),
    [sound, setSound] = useState(false),
    [undo, setUndo] = useState<{ id: string; deadline: number } | null>(null),
    [scan, setScan] = useState(false),
    [code, setCode] = useState(''),
    [labelSize, setLabelSize] = useState('a6'),
    [busy, setBusy] = useState(false),
    [persistMessage, setPersistMessage] = useState('');
  const entryStart = useRef(performance.now()),
    confirmLock = useRef(false),
    seenAlerts = useRef(new Set<string>());
  const heading = useRef<HTMLElement>(null);
  const apply = useCallback((s: State) => {
    const v = project(s);
    setState(s);
    setView(v);
  }, []);
  const refresh = useCallback(async () => {
    try {
      apply(await readState());
      setError('');
    } catch {
      setView(emptyView());
      setState(newState());
      setError(t.hashInvalid);
      setScreen('data');
    } finally {
      setLoading(false);
    }
  }, [apply]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => setNow(nowISO()), 1000);
    const visible = () => {
      setNow(nowISO());
      if (document.visibilityState === 'visible') void refresh();
    };
    const connectivity = () => setOnline(navigator.onLine);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', connectivity);
    window.addEventListener('offline', connectivity);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', connectivity);
      window.removeEventListener('offline', connectivity);
    };
  }, [refresh]);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [screen]);
  useEffect(() => {
    if (undo && performance.now() > undo.deadline) setUndo(null);
  }, [now, undo]);
  const kitchen = view.kitchen,
    batch = view.batches.find((b) => b.id === batchId),
    batchDrops = view.drops.filter((d) => d.batchId === batchId);
  const results = useMemo(
    () =>
      new Map(
        view.drops.map((d) => {
          const b = view.batches.find((b) => b.id === d.batchId)!;
          return [
            d.id,
            calculate(view.events, b.id, d.id, b.foodProfile, b.threshold, now, view.revoked),
          ];
        }),
      ),
    [view, now],
  );
  useEffect(() => {
    for (const [id, r] of results) {
      if (r.timeStatus === 'PERHATIAN' || r.timeStatus === 'MELEWATI_BATAS') {
        const key = id + r.timeStatus;
        if (!seenAlerts.current.has(key)) {
          seenAlerts.current.add(key);
          notifyWarning(sound);
        }
      }
    }
  }, [results, sound]);
  const warning =
    !kitchen ||
    Object.values(view.thresholds).some((p) => p.status === 'UNVERIFIED') ||
    view.batches.some((b) => b.threshold.status === 'UNVERIFIED');
  const go = (s: Screen) => {
    setScreen(s);
    setError('');
    setMessage('');
    setScan(false);
  };
  const openBatch = (b: Batch) => {
    setBatchId(b.id);
    setDropId(view.drops.find((d) => d.batchId === b.id)!.id);
    entryStart.current = performance.now();
    go('detail');
  };
  const openCode = useCallback(
    (raw: string) => {
      const b = view.batches.find((b) => b.shortCode.toUpperCase() === raw.trim().toUpperCase());
      setScan(false);
      if (b) {
        setBatchId(b.id);
        setDropId(view.drops.find((d) => d.batchId === b.id)!.id);
        entryStart.current = performance.now();
        setScreen('detail');
        setError('');
      } else setError(t.notFound);
    },
    [view],
  );
  const run = async (action: () => Promise<void>) => {
    setError('');
    try {
      await action();
    } catch {
      setError(t.error);
    }
  };
  const selectPoint = (type: EventType, old: BatchEvent | null = null) => {
    setPoint(type);
    setCorrection(old);
    setScreen('confirm');
    setError('');
    setMessage('');
    setUndo(null);
  };
  const currentEvents = activeEvents(view.events, view.revoked);
  const confirm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirmLock.current) return;
    confirmLock.current = true;
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const temp = String(form.get('temperature') ?? '').trim(),
        note = String(form.get('note') ?? '');
      if (
        temp !== '' &&
        (!Number.isFinite(Number(temp)) || Number(temp) < -30 || Number(temp) > 120)
      ) {
        setError(t.invalidTemp);
        return;
      }
      if (correction && !note.trim()) {
        setError(t.correctionReason);
        return;
      }
      const timestamp = nowISO(),
        adjusted = String(form.get('occurred') ?? '');
      const result = await record(
        {
          batchId,
          type: point,
          ...(point === 'ARRIVED' || point === 'SERVE_START' ? { dropId } : {}),
          role: String(form.get('role') || 'COOK') as Role,
          occurredAt: adjusted ? fromLocal(adjusted, kitchen!.timezone) : timestamp,
          ...(temp ? { tempC: Number(temp) } : {}),
          ...(note ? { note } : {}),
          ...(form.get('actor') ? { actorTag: String(form.get('actor')) } : {}),
          ...(correction ? { supersedes: correction.id } : {}),
        },
        timestamp,
        Math.max(0, performance.now() - entryStart.current),
      );
      apply(result.state);
      setMessage(result.duplicate ? t.duplicate : t.success);
      if (!result.duplicate && !correction)
        setUndo({ id: result.eventId, deadline: performance.now() + 10000 });
      navigator.vibrate?.(60);
      setScreen('detail');
      setNow(timestamp);
      entryStart.current = performance.now();
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
      confirmLock.current = false;
    }
  };
  const today = kitchen ? localDate(now, kitchen.timezone) : '';
  const latestDemoDate =
    kitchen?.code === 'DEMO'
      ? view.batches
          .map((b) => localDate(b.createdAt, kitchen.timezone))
          .sort()
          .at(-1)
      : undefined;
  const selectedDate = date || latestDemoDate || today;
  const filtered = view.batches.filter(
    (b) =>
      (screen === 'trace'
        ? !date || localDate(b.createdAt, kitchen!.timezone) === date
        : localDate(b.createdAt, kitchen!.timezone) === selectedDate) &&
      (!query.trim() ||
        [
          b.shortCode,
          b.menuName,
          ...view.drops.filter((d) => d.batchId === b.id).map((d) => d.recipientLabel),
        ].some((s) => s.toLowerCase().includes(query.trim().toLowerCase()))),
  );
  const batchStatus = (b: Batch) =>
    aggregate(view.drops.filter((d) => d.batchId === b.id).map((d) => results.get(d.id)!));
  const needsAttention = (b: Batch) =>
    ['PERHATIAN', 'MELEWATI_BATAS'].includes(batchStatus(b).timeStatus);
  const visibleBatches = filtered.filter(
    (b) =>
      batchFilter === 'all' ||
      (batchFilter === 'attention' ? needsAttention(b) : batchStatus(b).incomplete),
  );
  const exportBatches = (batches: Batch[]) =>
    download('batchaman-ringkasan.csv', reportCSV(view, batches, now), 'text/csv;charset=utf-8');
  const persist = async () => {
    try {
      const granted = await navigator.storage?.persist?.();
      setPersistMessage(granted ? t.persistYes : t.persistNo);
    } catch {
      setPersistMessage(t.persistNo);
    }
  };
  const doBackup = async () => {
    const snapshot = await readState();
    download(
      'batchaman-cadangan.json',
      backupJSON(snapshot, t.warning, t.privacy),
      'application/json',
    );
    const s = await markBackupExported(snapshot, nowISO());
    apply(s);
  };
  const synthetic = async () =>
    run(async () => {
      const { simulate } = await import('@batchaman/sim');
      const data = simulate({ start: demoDate(now) });
      let s = append(newState(), { kind: 'KITCHEN', kitchen: data.kitchen });
      for (const b of data.batches)
        s = append(s, {
          kind: 'BATCH',
          batch: b,
          drops: data.drops.filter((d) => d.batchId === b.id),
        });
      for (const event of data.events)
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
      await mutate((old) => {
        if (old.entries.length) throw new Error('not empty');
        return s;
      });
      apply(s);
      setScreen('today');
    });
  if (loading)
    return (
      <main>
        <p>{t.loading}</p>
      </main>
    );
  return (
    <>
      <a className="skip-link" href="#main-content">
        {t.skip}
      </a>
      <header className="topbar">
        <div className="brand">
          <img
            className="brandmark"
            src="./brand/batchaman-mark.png"
            alt=""
            width="48"
            height="48"
          />
          <div>
            <b>{t.app}</b>
            <small>{kitchen?.name ?? t.tagline}</small>
          </div>
        </div>
        <span className={'connection ' + (online ? '' : 'is-offline')}>
          <span className="connection-dot" aria-hidden="true" />
          {online ? t.online : t.offline}
        </span>
      </header>
      <div className="shell">
        <aside className="sidebar no-print">
          <p className="eyebrow">{t.workspace}</p>
          {kitchen && (
            <div className="kitchen-badge">
              <span>{kitchen.code.slice(0, 2)}</span>
              <div>
                <strong>{kitchen.name}</strong>
                <small>
                  {kitchen.code} · {t.zones[kitchen.timezone]}
                </small>
              </div>
            </div>
          )}
          <nav aria-label={t.app}>
            {(['today', 'create', 'trace', 'data', 'about'] as const).map((s) => (
              <button
                key={s}
                aria-current={
                  screen === s || (s === 'today' && ['detail', 'confirm', 'label'].includes(screen))
                    ? 'page'
                    : undefined
                }
                onClick={() => {
                  if (s === 'today') {
                    setDate('');
                    setQuery('');
                    setBatchFilter('all');
                  }
                  go(s);
                }}
                disabled={!kitchen && (s === 'create' || s === 'trace')}
              >
                <Icon name={s} />
                {t[s]}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <Icon name="local" />
            <strong>{t.localTitle}</strong>
            <p>{t.localHint}</p>
            <small>{t.privacy}</small>
          </div>
        </aside>
        <main id="main-content" ref={heading} tabIndex={-1} className={'content screen-' + screen}>
          <AppUpdate />
          {warning && (
            <aside className="warning" role="note">
              <b aria-hidden="true">!</b>
              <span>{t.warning}</span>
            </aside>
          )}
          {(kitchen?.code === 'DEMO' || import.meta.env.VITE_DEMO === 'true') && (
            <p className="demo">{t.demo}</p>
          )}
          {error && (
            <div className="error no-print" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="success no-print" role="status">
              <strong>{message}</strong>
              {undo && (
                <>
                  <p>{t.undoHint}</p>
                  <button
                    onClick={() => {
                      if (performance.now() > undo.deadline) {
                        setError(t.undoExpired);
                        return;
                      }
                      void run(async () => {
                        apply(await revoke(undo.id, nowISO()));
                        setUndo(null);
                        setMessage(t.undone);
                      });
                    }}
                  >
                    {t.undo}
                  </button>
                </>
              )}
            </div>
          )}
          {!kitchen && screen !== 'about' && screen !== 'data' ? (
            <>
              <KitchenForm
                onSave={async (k) =>
                  run(async () => {
                    apply(await setup(k));
                    void persist();
                  })
                }
              />
              <p>{t.fresh}</p>
              <button onClick={() => void synthetic()}>{t.demoAction}</button>
              <button onClick={() => go('data')}>{t.restore}</button>
            </>
          ) : (
            <>
              {(screen === 'today' || screen === 'trace') && (
                <>
                  <div
                    className={'page-heading ' + (screen === 'today' ? 'dashboard-heading' : '')}
                  >
                    <div>
                      <p className="eyebrow">
                        {kitchen?.code} · {kitchen && t.zones[kitchen.timezone]}
                      </p>
                      <h1>
                        {screen === 'today'
                          ? selectedDate === today
                            ? t.today
                            : 'Ringkasan batch'
                          : t.summary}
                      </h1>
                      <p className="heading-caption">
                        {screen === 'today' ? t.dashboardIntro : t.scanHint}
                      </p>
                    </div>
                    {screen === 'today' && (
                      <button className="primary" onClick={() => go('create')}>
                        <Icon name="create" /> {t.create}
                      </button>
                    )}
                  </div>
                  <section className="stats-grid" aria-label={t.summaryLabel}>
                    <div className="stat-card">
                      <span className="stat-icon">
                        <Icon name="tray" />
                      </span>
                      <span>{t.totalBatches}</span>
                      <strong>{filtered.length}</strong>
                      <small>{t.summaryLabel}</small>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">
                        <Icon name="pin" />
                      </span>
                      <span>{t.totalPortions}</span>
                      <strong>
                        {filtered.reduce((n, b) => n + b.portions, 0).toLocaleString('id-ID')}
                      </strong>
                      <small>{t.unitsPortions}</small>
                    </div>
                    <div className="stat-card stat-attention">
                      <span className="stat-icon">
                        <Icon name="warning" />
                      </span>
                      <span>{t.needAttention}</span>
                      <strong>{filtered.filter(needsAttention).length}</strong>
                      <small>{t.attentionHint}</small>
                    </div>
                  </section>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">{t.dashboardHint}</p>
                      <h2>{t.batchList}</h2>
                    </div>
                  </div>
                  <div className="panel filters">
                    <Field label={t.date}>
                      <input
                        type="date"
                        value={screen === 'today' ? selectedDate : date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </Field>
                    {screen === 'trace' && (
                      <button onClick={() => setDate('')}>{t.clearDate}</button>
                    )}
                    <Field label={t.search}>
                      <input
                        type="search"
                        placeholder="Kode, menu, atau tujuan…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </Field>
                    <button onClick={() => exportBatches(filtered)}>
                      {screen === 'today' ? t.exportDaily : t.exportCsv}
                    </button>
                  </div>
                  <div className="filter-tabs no-print" role="group" aria-label={t.batchList}>
                    {(['all', 'attention', 'incomplete'] as const).map((filter) => (
                      <button
                        key={filter}
                        aria-pressed={batchFilter === filter}
                        onClick={() => setBatchFilter(filter)}
                      >
                        {filter === 'all'
                          ? t.allFilter
                          : filter === 'attention'
                            ? t.attentionFilter
                            : t.incompleteFilter}
                      </button>
                    ))}
                  </div>
                  <div className="results-summary no-print">
                    <p role="status">{visibleBatches.length} batch ditampilkan</p>
                    {(query || batchFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setQuery('');
                          setBatchFilter('all');
                        }}
                      >
                        {t.resetFilters}
                      </button>
                    )}
                  </div>
                  <div className="batch-grid">
                    {visibleBatches.length ? (
                      visibleBatches.map((b) => {
                        const ds = view.drops.filter((d) => d.batchId === b.id),
                          status = aggregate(ds.map((d) => results.get(d.id)!));
                        return (
                          <article className={'batch-card card-' + status.timeStatus} key={b.id}>
                            <div className="card-top">
                              <span className="code">{b.shortCode}</span>
                              <span>
                                {b.portions} {t.unitsPortions}
                              </span>
                            </div>
                            <h2>
                              <button className="text-button" onClick={() => openBatch(b)}>
                                {b.menuName}
                              </button>
                            </h2>
                            <p className="card-destinations">
                              <Icon name="pin" />
                              {ds.map((d) => d.recipientLabel).join(' · ')}
                            </p>
                            <p className={'status-line ' + status.timeStatus}>
                              <Icon name={needsAttention(b) ? 'warning' : 'clock'} />
                              {t.timeNames[status.timeStatus]}
                            </p>
                            <div className="card-progress">
                              <span>{status.incomplete ? t.incomplete : t.complete}</span>
                              <small>
                                {currentEvents.filter((e) => e.batchId === b.id).length}/
                                {3 + ds.length * 2} {t.recordedPoints}
                              </small>
                            </div>
                            <div className="journey-track" aria-hidden="true">
                              {Array.from({ length: 3 + ds.length * 2 }, (_, i) => (
                                <i
                                  key={i}
                                  className={
                                    i < currentEvents.filter((e) => e.batchId === b.id).length
                                      ? 'filled'
                                      : ''
                                  }
                                />
                              ))}
                            </div>
                            <button className="primary" onClick={() => openBatch(b)}>
                              {t.record} <Icon name="arrow" />
                            </button>
                          </article>
                        );
                      })
                    ) : (
                      <div className="panel empty-state">
                        <Icon name="tray" />
                        <h2>{batchFilter === 'all' && !query.trim() ? t.empty : t.noMatch}</h2>
                        <p>
                          {batchFilter === 'all' && !query.trim() ? t.emptyHint : t.noMatchHint}
                        </p>
                        <div className="row">
                          <button className="primary" onClick={() => go('create')}>
                            {t.create}
                          </button>
                          <button
                            onClick={() => {
                              setDate('');
                              setQuery('');
                              setBatchFilter('all');
                              go('trace');
                            }}
                          >
                            {t.allDates}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <section className="panel scan-panel no-print">
                    <div className="scan-intro">
                      <span className="scan-symbol">
                        <Icon name="qr" />
                      </span>
                      <div>
                        <h2>{t.quickAccess}</h2>
                        <p>{t.scanHint}</p>
                      </div>
                    </div>
                    <form
                      className="row"
                      onSubmit={(e) => {
                        e.preventDefault();
                        openCode(code);
                      }}
                    >
                      <Field label={t.manual}>
                        <input value={code} onChange={(e) => setCode(e.target.value)} />
                      </Field>
                      <button>{t.openCode}</button>
                    </form>
                    <button onClick={() => setScan(true)}>{t.scan}</button>
                    {scan && (
                      <Suspense fallback={<p>{t.loading}</p>}>
                        <Scanner onCode={openCode} onClose={() => setScan(false)} />
                      </Suspense>
                    )}
                  </section>
                </>
              )}
              {screen === 'create' && (
                <BatchForm
                  onSave={async (input) =>
                    run(async () => {
                      const r = await createBatch(input, nowISO());
                      apply(r.state);
                      setBatchId(r.batchId);
                      setDropId(project(r.state).drops.find((d) => d.batchId === r.batchId)!.id);
                      entryStart.current = performance.now();
                      setScreen('detail');
                      setMessage(t.batchCreated);
                    })
                  }
                />
              )}
              {screen === 'detail' && batch && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="code">{batch.shortCode}</p>
                      <h1>{batch.menuName}</h1>
                      <p>
                        {batch.portions} {t.unitsPortions} · {t.foodNames[batch.foodProfile]}
                      </p>
                    </div>
                    <button className="no-print" onClick={() => go('today')}>
                      {t.back}
                    </button>
                  </div>
                  <section className="panel no-print">
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">{t.record}</p>
                        <h2>{t.choosePoint}</h2>
                        <p>{t.startedHint}</p>
                      </div>
                      <Icon name="tray" />
                    </div>
                    <div className="point-grid">
                      {[
                        ...EVENT_TYPES.slice(0, 3).map((type) => ({ type, drop: undefined })),
                        ...batchDrops.flatMap((drop) =>
                          (['ARRIVED', 'SERVE_START'] as const).map((type) => ({ type, drop })),
                        ),
                      ].map(({ type, drop }) => {
                        const recorded = currentEvents.some(
                          (e) => e.batchId === batch.id && e.type === type && e.dropId === drop?.id,
                        );
                        return (
                          <button
                            key={type + (drop?.id ?? '')}
                            disabled={recorded}
                            onClick={() => {
                              if (drop) setDropId(drop.id);
                              selectPoint(type);
                            }}
                          >
                            <span>
                              {recorded
                                ? '✓'
                                : String(EVENT_TYPES.indexOf(type) + 1).padStart(2, '0')}
                            </span>
                            {t.eventNames[type]}
                            {drop && <small>{drop.recipientLabel}</small>}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <h2>{t.allDrops}</h2>
                  {batchDrops.map((d) => (
                    <section className="panel" key={d.id}>
                      <h3>{d.recipientLabel}</h3>
                      <p>
                        {d.portions} {t.unitsPortions} {d.routeLabel && ' · ' + d.routeLabel}{' '}
                        {d.vehicleLabel && ' · ' + d.vehicleLabel}
                      </p>
                      <Status r={results.get(d.id)!} />
                    </section>
                  ))}
                  <div className="row no-print">
                    <button onClick={() => exportBatches([batch])}>{t.exportCsv}</button>
                    <button onClick={() => window.print()}>{t.print}</button>
                    <button onClick={() => go('label')}>{t.label}</button>
                  </div>
                  <section className="panel">
                    <h2>{t.timeline}</h2>
                    {!view.events.some((e) => e.batchId === batchId) && <p>{t.noEvents}</p>}
                    <ol className="timeline">
                      {view.events
                        .filter((e) => e.batchId === batchId)
                        .map((e) => {
                          const active = currentEvents.some((x) => x.id === e.id);
                          return (
                            <li key={e.id}>
                              <div className="timeline-title">
                                <strong>{t.eventNames[e.type]}</strong>
                                <time>{dateTime(e.occurredAt, kitchen!)}</time>
                              </div>
                              {e.dropId && (
                                <p>{view.drops.find((d) => d.id === e.dropId)?.recipientLabel}</p>
                              )}
                              <p>
                                {t.roleNames[e.role]}
                                {e.actorTag && ' · ' + e.actorTag} ·{' '}
                                {e.tempC === undefined ? t.tempHint : `${e.tempC} °C`}
                              </p>
                              <p>
                                {t.recorded}: {dateTime(e.recordedAt, kitchen!)}
                              </p>
                              {e.note && <p>{e.note}</p>}
                              {!active ? (
                                <p>{view.revoked.includes(e.id) ? t.revoked : t.superseded}</p>
                              ) : (
                                <button
                                  className="no-print"
                                  onClick={() => {
                                    setDropId(e.dropId ?? batchDrops[0]!.id);
                                    entryStart.current = performance.now();
                                    selectPoint(e.type, e);
                                  }}
                                >
                                  {t.correction}
                                </button>
                              )}
                            </li>
                          );
                        })}
                    </ol>
                  </section>
                  <section className="panel">
                    <h2>
                      {t.thresholdStatus}: {batch.threshold.status}
                    </h2>
                    <p>
                      {t.source}: {batch.threshold.source}
                    </p>
                    {batch.threshold.verifiedBy && (
                      <p>
                        {t.verifiedBy}: {batch.threshold.verifiedBy} · {batch.threshold.verifiedAt}
                      </p>
                    )}
                    <p>{t.privacy}</p>
                  </section>
                  <section className="panel">
                    <h2>{t.resolve}</h2>
                    <p>{t.resolveHint}</p>
                    {view.resolutions
                      .filter((r) => r.batchId === batchId)
                      .map((r, i) => (
                        <p key={i}>
                          {dateTime(r.at, kitchen!)} · {r.note}
                        </p>
                      ))}
                    <form
                      className="stack no-print"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const note = String(new FormData(e.currentTarget).get('resolution'));
                        void run(async () => {
                          apply(
                            await mutate((s) =>
                              append(s, { kind: 'RESOLVE', batchId, note, at: nowISO() }),
                            ),
                          );
                          setMessage(t.resolved);
                        });
                      }}
                    >
                      <Field label={t.resolution}>
                        <textarea name="resolution" required maxLength={1000} />
                      </Field>
                      <button>{t.save}</button>
                    </form>
                  </section>
                </>
              )}
              {screen === 'confirm' && batch && (
                <form className="panel stack confirmation" onSubmit={(e) => void confirm(e)}>
                  <p className="code">
                    {batch.shortCode} · {batch.menuName}
                  </p>
                  <h1>{correction ? t.correcting : t.eventNames[point]}</h1>
                  <h2>{t.eventNames[point]}</h2>
                  {(point === 'ARRIVED' || point === 'SERVE_START') && (
                    <p>{batchDrops.find((d) => d.id === dropId)?.recipientLabel}</p>
                  )}
                  <p className="auto-time">
                    {t.automatic}
                    <br />
                    <strong>{localTime(now, kitchen!.timezone)}</strong>
                  </p>
                  <Field label={t.temperature}>
                    <input
                      name="temperature"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      defaultValue={correction?.tempC ?? ''}
                    />
                  </Field>
                  <p>{t.tempHint}</p>
                  <details open={!!correction}>
                    <summary>{t.adjust}</summary>
                    <div className="stack">
                      <Field label={t.occurred}>
                        <input
                          name="occurred"
                          type="datetime-local"
                          defaultValue={
                            correction
                              ? localDate(correction.occurredAt, kitchen!.timezone) +
                                'T' +
                                localTime(correction.occurredAt, kitchen!.timezone)
                              : ''
                          }
                        />
                      </Field>
                      <Field label={t.role}>
                        <select
                          name="role"
                          defaultValue={
                            correction?.role ??
                            (point === 'LOADED'
                              ? 'DRIVER'
                              : point === 'ARRIVED' || point === 'SERVE_START'
                                ? 'RECEIVER'
                                : point === 'PACKED'
                                  ? 'PACKER'
                                  : 'COOK')
                          }
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t.roleNames[r]}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t.actor}>
                        <input name="actor" maxLength={30} />
                      </Field>
                      <Field label={t.note}>
                        <textarea name="note" maxLength={1000} />
                      </Field>
                    </div>
                  </details>
                  <button className="primary big" disabled={busy}>
                    {t.confirm}
                  </button>
                  <button type="button" onClick={() => go('detail')}>
                    {t.cancel}
                  </button>
                </form>
              )}
              {screen === 'label' && batch && (
                <section className={'panel label-print ' + labelSize}>
                  <div className="no-print">
                    <h1>{t.label}</h1>
                    <Field label={t.labelSize}>
                      <select value={labelSize} onChange={(e) => setLabelSize(e.target.value)}>
                        <option value="a6">{t.a6}</option>
                        <option value="strip">{t.strip}</option>
                      </select>
                    </Field>
                    <p>{t.printHint}</p>
                  </div>
                  <div className="label-body">
                    <strong>{t.app}</strong>
                    <h2>{batch.shortCode}</h2>
                    <QR code={batch.shortCode} />
                    <h3>{batch.menuName}</h3>
                    <p>
                      {batch.portions} {t.unitsPortions}
                    </p>
                    <p>{dateTime(batch.createdAt, kitchen!)}</p>
                    <p>{t.warning}</p>
                    <p>{t.privacy}</p>
                  </div>
                  <div className="row no-print">
                    <button onClick={() => window.print()}>{t.print}</button>
                    <button onClick={() => go('detail')}>{t.back}</button>
                  </div>
                </section>
              )}
              {screen === 'data' && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">{t.localTitle}</p>
                      <h1>{t.data}</h1>
                      <p className="heading-caption">{t.dataIntro}</p>
                    </div>
                    <Icon name="data" />
                  </div>
                  <section className="panel stack">
                    <p>{t.privacy}</p>
                    <p>{t.storageHint}</p>
                    <button onClick={() => void persist()}>{t.persist}</button>
                    {persistMessage && <p role="status">{persistMessage}</p>}
                    <button onClick={() => void run(doBackup)}>{t.backup}</button>
                    <Field label={t.restore}>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          if (!window.confirm(t.restoreConfirm)) return;
                          void (async () => {
                            try {
                              if (file.size > 50_000_000) throw new Error('size');
                              apply(await restoreBackup(await file.text()));
                              setError('');
                              setMessage(t.restored);
                            } catch {
                              setError(t.invalidFile);
                            }
                          })();
                        }}
                      />
                    </Field>
                    <button
                      onClick={() =>
                        void run(async () => {
                          apply(await readState());
                          setMessage(t.hashValid);
                        })
                      }
                    >
                      {t.verify}
                    </button>
                    <p>{t.localMetrics}</p>
                    <button
                      onClick={() =>
                        download('batchaman-metrik.csv', metricsCSV(view), 'text/csv;charset=utf-8')
                      }
                    >
                      {t.exportMetrics}
                    </button>
                  </section>
                  <section className="panel stack">
                    <h2>{t.thresholdStatus}</h2>
                    <p>{t.thresholdHint}</p>
                    <Field label={t.importThreshold}>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          void run(async () => {
                            if (file.size > 100000) throw new Error('size');
                            const thresholds = thresholdSetSchema.parse(
                              JSON.parse(await file.text()),
                            );
                            apply(
                              await mutate((s) => append(s, { kind: 'THRESHOLDS', thresholds })),
                            );
                            setMessage(t.thresholdImported);
                          });
                        }}
                      />
                    </Field>
                    <Field label={t.sound}>
                      <button
                        aria-pressed={sound}
                        onClick={() => {
                          enableAudio();
                          setSound(!sound);
                        }}
                      >
                        {sound ? t.soundOn : t.soundOff}
                      </button>
                    </Field>
                    <p>{t.alarmHint}</p>
                  </section>
                  {kitchen && (
                    <section className="panel">
                      <h2>{t.settings}</h2>
                      <p>
                        {kitchen.name} · {kitchen.code} · {kitchen.timezone}
                      </p>
                    </section>
                  )}
                </>
              )}
              {screen === 'about' && (
                <section className="panel">
                  <div className="about-brand">
                    <img src="./brand/batchaman-mark.png" alt="" width="80" height="80" />
                    <div>
                      <p className="eyebrow">{t.app}</p>
                      <h1>{t.about}</h1>
                    </div>
                  </div>
                  <p className="heading-caption">{t.aboutIntro}</p>
                  <ul className="about-list">
                    {t.aboutItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p>{t.storageHint}</p>
                  <p>{t.alarmHint}</p>
                  <p>{t.privacy}</p>
                </section>
              )}
            </>
          )}
          {kitchen &&
            (!state.lastBackup ||
              localDate(state.lastBackup, kitchen.timezone) !== localDate(now, kitchen.timezone)) &&
            screen !== 'label' && (
              <div className="backup-reminder no-print">
                <div>
                  <strong>{t.backupTitle}</strong>
                  <span>{t.backupReminder}</span>
                </div>
                <button onClick={() => void run(doBackup)}>{t.backup}</button>
              </div>
            )}
          <footer>{t.footer}</footer>
        </main>
      </div>
    </>
  );
}
