'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  let t = window.localStorage.getItem('adminToken');
  if (!t) {
    t = window.prompt('Enter access token to generate guides:');
    if (t) window.localStorage.setItem('adminToken', t.trim());
  }
  return t?.trim() || null;
}

type PhaseKey =
  | 'discover'
  | 'download'
  | 'transcribe'
  | 'assemble-reel-meta'
  | 'preprocess'
  | 'classify'
  | 'aggregate'
  | 'synthesize-lists'
  | 'synthesize-tips'
  | 'geocode'
  | 'itinerary-prep'
  | 'itinerary-compose'
  | 'link-headout'
  | 'resolve-guides'
  | 'build-pack';

type PhaseDef = { key: PhaseKey; label: string; emoji: string };

const PHASES: PhaseDef[] = [
  { key: 'discover',           label: 'Discovering reels',       emoji: '🔍' },
  { key: 'download',           label: 'Downloading videos',      emoji: '⬇️' },
  { key: 'transcribe',         label: 'Transcribing audio',      emoji: '🎙️' },
  { key: 'assemble-reel-meta', label: 'Indexing reels',          emoji: '🧱' },
  { key: 'preprocess',         label: 'Preparing batches',       emoji: '📦' },
  { key: 'classify',           label: 'Extracting gems',         emoji: '💎' },
  { key: 'aggregate',          label: 'Deduplicating',           emoji: '🧬' },
  { key: 'synthesize-lists',   label: 'Curating lists',          emoji: '📚' },
  { key: 'synthesize-tips',    label: 'Distilling tips',         emoji: '✨' },
  { key: 'geocode',            label: 'Mapping places',          emoji: '📍' },
  { key: 'itinerary-prep',     label: 'Planning days',           emoji: '🗓️' },
  { key: 'itinerary-compose',  label: 'Crafting itineraries',    emoji: '🪄' },
  { key: 'link-headout',       label: 'Linking Headout products', emoji: '🎟️' },
  { key: 'resolve-guides',     label: 'Resolving guides',        emoji: '📐' },
  { key: 'build-pack',         label: 'Assembling guide',        emoji: '🎁' },
];

type Status = 'pending' | 'running' | 'done' | 'failed';

type PhaseState = {
  status: Status;
  message: string;
  startedAt: number | null;
  finishedAt: number | null;
};

type RunEvent = {
  id?: number;
  runId: string;
  ts: string;
  phase: PhaseKey;
  level: 'info' | 'progress' | 'warn' | 'error' | 'done';
  message: string;
  data?: Record<string, unknown>;
};

type RunStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

const SUGGESTIONS = ['flipjapanguide', 'lyrarooo'];

function initStates(): Record<PhaseKey, PhaseState> {
  const out = {} as Record<PhaseKey, PhaseState>;
  for (const p of PHASES) out[p.key] = { status: 'pending', message: '', startedAt: null, finishedAt: null };
  return out;
}

function fmtElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function GeneratePage() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [phase, setPhase] = useState<'idle' | 'starting' | 'running' | 'done' | 'failed' | 'cancelled'>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const [states, setStates] = useState<Record<PhaseKey, PhaseState>>(initStates);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // re-render once a second for live elapsed
  const [guideCount, setGuideCount] = useState<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const i = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => () => sseRef.current?.close(), []);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const normalized = handle.trim().replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(normalized)) {
      setError('Invalid handle (a-z, 0-9, dot, underscore)');
      return;
    }
    setError(null);
    setPhase('starting');
    setStates(initStates());
    setCreatorHandle(normalized);
    startedAt.current = Date.now();

    const token = getAdminToken();
    if (!token) {
      setError('Access token required');
      setPhase('idle');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/runs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ creator: normalized, kind: 'full' }),
      });
      if (res.status === 401) {
        window.localStorage.removeItem('adminToken');
        throw new Error('Invalid token — try again');
      }
      const body = (await res.json().catch(() => ({}))) as { runId?: string; error?: string };
      if (!res.ok || !body.runId) throw new Error(body.error ?? `HTTP ${res.status}`);
      setRunId(body.runId);
      setPhase('running');
      openSSE(body.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
      setPhase('failed');
    }
  }

  function openSSE(rid: string) {
    sseRef.current?.close();
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('adminToken') : null;
    const url = `${API_BASE}/runs/${rid}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const es = new EventSource(url);
    sseRef.current = es;

    const onEvent = (ev: MessageEvent) => {
      let e: RunEvent | null = null;
      try { e = JSON.parse(ev.data) as RunEvent; } catch { return; }
      if (!e?.phase) return;

      // Capture guide count from resolve-guides done event
      if (e.phase === 'resolve-guides' && e.level === 'done' && e.data) {
        const guides = (e.data as { guides?: unknown[] }).guides;
        if (Array.isArray(guides)) {
          setGuideCount(guides.length);
        }
      }

      setStates((prev) => {
        const next = { ...prev };
        const cur = next[e.phase] ?? { status: 'pending', message: '', startedAt: null, finishedAt: null };
        const updated: PhaseState = { ...cur, message: e.message };
        if (e.level === 'done') {
          updated.status = 'done';
          updated.finishedAt = Date.now();
          // build-pack done = pipeline finished. Admin doesn't push a separate
          // `end` frame to live streams, so treat this as terminal here.
          if (e.phase === 'build-pack') {
            setPhase('done');
            es.close();
          }
        } else if (e.level === 'error') {
          updated.status = 'failed';
          updated.finishedAt = Date.now();
          if (e.phase === 'build-pack') {
            setPhase('failed');
            es.close();
          }
        } else if (e.level === 'warn') {
          // admin emits warn on build-pack when the run was cancelled
          if (e.phase === 'build-pack' && /cancel/i.test(e.message)) {
            setPhase('cancelled');
            es.close();
          }
        } else {
          if (cur.status !== 'done' && cur.status !== 'failed') {
            updated.status = 'running';
            if (!updated.startedAt) updated.startedAt = Date.now();
          }
        }
        next[e.phase] = updated;
        return next;
      });
    };

    // Server dispatches each event with `event: <level>` — addEventListener per level
    for (const lvl of ['info', 'progress', 'warn', 'error', 'done']) {
      es.addEventListener(lvl, onEvent as EventListener);
    }

    // Terminal status frame: { status: 'done' | 'failed' | 'cancelled' }
    es.addEventListener('end', (ev) => {
      try {
        const m = JSON.parse((ev as MessageEvent).data) as { status?: RunStatus };
        if (m.status === 'done') setPhase('done');
        else if (m.status === 'failed') setPhase('failed');
        else if (m.status === 'cancelled') setPhase('cancelled');
      } catch {
        setPhase('done');
      }
      es.close();
    });

    es.onerror = () => {
      // Server closes SSE on terminal status. EventSource auto-retries otherwise.
    };
  }

  async function cancel() {
    if (!runId) return;
    try {
      const token = window.localStorage.getItem('adminToken');
      await fetch(`${API_BASE}/runs/${runId}/cancel`, {
        method: 'POST',
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
    } catch {}
  }

  function reset() {
    sseRef.current?.close();
    setPhase('idle');
    setRunId(null);
    setStates(initStates());
    setError(null);
    setHandle('');
    setGuideCount(null);
  }

  void tick; // ensure tick triggers rerender
  const totalElapsed = startedAt.current ? Date.now() - startedAt.current : 0;
  const doneCount = Object.values(states).filter((s) => s.status === 'done').length;
  const runningKey = PHASES.find((p) => states[p.key].status === 'running')?.key;
  const progressPct = Math.round((doneCount / PHASES.length) * 100);

  if (phase === 'idle' || phase === 'starting') {
    return (
      <div className="gp">
        <div className="gp-hero">
          <div className="gp-hero-dots"><span/><span/><span/></div>
          <h1 className="gp-h1">Generate a guide</h1>
          <p className="gp-sub">Paste any public Instagram travel creator. We&apos;ll build their guide from scratch — reels in, full itinerary out.</p>
        </div>

        <form className="gp-form" onSubmit={start}>
          <div className="gp-input">
            <span className="gp-at">@</span>
            <input
              autoFocus
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="creator_handle"
              disabled={phase === 'starting'}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" className="gp-cta" disabled={phase === 'starting' || !handle.trim()}>
            {phase === 'starting' ? 'Starting…' : 'Generate guide ✨'}
          </button>
        </form>

        <div className="gp-sugs">
          <div className="gp-sugs-lbl">Try one</div>
          <div className="gp-sugs-row">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="gp-sug" onClick={() => setHandle(s)}>@{s}</button>
            ))}
          </div>
        </div>

        {error && <div className="gp-err">{error}</div>}

        <div className="gp-meta">
          <div className="gp-meta-row"><span>⏱</span> takes 3–15 min depending on reel count</div>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const hasGuides = guideCount === null || guideCount > 0;
    return (
      <div className="gp">
        <div className="gp-done">
          {hasGuides ? (
            <>
              <div className="gp-burst">
                <div className="gp-burst-ring" />
                <div className="gp-burst-ring gp-burst-ring2" />
                <div className="gp-burst-check">✓</div>
              </div>
              <h1 className="gp-h1">Your guide is ready</h1>
              <p className="gp-sub">Generated <strong>@{creatorHandle}</strong> in {fmtElapsed(totalElapsed)}.</p>
              <button
                className="gp-cta gp-cta-big"
                onClick={() => router.push(`/c/${creatorHandle}/guide`)}
              >
                View the guide →
              </button>
            </>
          ) : (
            <>
              <div className="gp-burst">
                <div className="gp-burst-ring" />
                <div className="gp-burst-ring gp-burst-ring2" />
                <div className="gp-burst-check" style={{ color: '#f59e0b' }}>!</div>
              </div>
              <h1 className="gp-h1">Guide not generated</h1>
              <p className="gp-sub">
                The pipeline finished but no city-level guide was created for <strong>@{creatorHandle}</strong>.
                Every city had fewer than 10 gems.
              </p>
              <p className="gp-sub" style={{ fontSize: '13px', marginTop: '8px' }}>
                Try fetching more reels or pick a creator with denser city coverage.
              </p>
            </>
          )}
          <button className="gp-link" onClick={reset}>Generate another</button>
        </div>
      </div>
    );
  }

  // running / failed / cancelled — show the pipeline
  return (
    <div className="gp">
      <div className="gp-runhead">
        <div>
          <div className="gp-runtitle">Generating <strong>@{creatorHandle}</strong></div>
          <div className="gp-runsub">{fmtElapsed(totalElapsed)} elapsed · {doneCount}/{PHASES.length} done</div>
        </div>
        {phase === 'running' && (
          <button className="gp-cancel" onClick={cancel}>Cancel</button>
        )}
      </div>

      <div className="gp-progress">
        <div className="gp-progress-bar" style={{ width: `${progressPct}%` }} />
        <div className="gp-progress-shimmer" />
      </div>

      <ol className="gp-pipe">
        {PHASES.map((p, i) => {
          const s = states[p.key];
          const isLast = i === PHASES.length - 1;
          const isRunning = s.status === 'running';
          return (
            <li key={p.key} className={`gp-step gp-step-${s.status}`}>
              <div className="gp-step-rail">
                <div className={`gp-step-node ${isRunning ? 'gp-node-running' : ''}`}>
                  {s.status === 'done' ? '✓' :
                   s.status === 'failed' ? '✕' :
                   isRunning ? <span className="gp-spinner" /> :
                   <span className="gp-step-emoji">{p.emoji}</span>}
                </div>
                {!isLast && <div className="gp-step-line" />}
              </div>
              <div className="gp-step-body">
                <div className="gp-step-label">{p.label}</div>
                {s.message && (
                  <div className="gp-step-msg">{s.message}</div>
                )}
                {s.status === 'done' && s.startedAt && s.finishedAt && (
                  <div className="gp-step-time">{fmtElapsed(s.finishedAt - s.startedAt)}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {(phase === 'failed' || phase === 'cancelled') && (
        <div className="gp-failbox">
          <div className="gp-fail-title">
            {phase === 'cancelled' ? 'Generation cancelled' : 'Generation failed'}
          </div>
          {runningKey && <div className="gp-fail-sub">Stopped at: {PHASES.find((p) => p.key === runningKey)?.label}</div>}
          <button className="gp-cta" onClick={reset}>Try again</button>
        </div>
      )}
    </div>
  );
}
