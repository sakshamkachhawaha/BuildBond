
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Ledger from '../components/Ledger.jsx';
import MilestoneCard from '../components/Milestone.jsx';
import StatusBadge from '../components/Badge.jsx';
import Timeline from '../components/Timeline.jsx';
import { formatDate, formatMoney } from '../format.js';
const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-[#0B1733] placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm';
const LABEL_CLASS = 'mb-2 block text-sm font-semibold text-slate-800';
const HINT_CLASS = 'mt-1.5 block text-xs leading-5 text-slate-500';
const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-blue-600 px-5 py-3 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus-visible:ring-blue-600`;
const BUTTON_PRIMARY_SMALL = `${BUTTON_BASE} bg-blue-600 px-4 py-2.5 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus-visible:ring-blue-600`;
const BUTTON_DANGER = `${BUTTON_BASE} bg-red-600 px-5 py-3 text-white hover:bg-red-700 focus-visible:ring-red-600`;
const BUTTON_OUTLINE = `${BUTTON_BASE} border border-slate-300 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50 focus-visible:ring-blue-600`;
const BUTTON_OUTLINE_SMALL = `${BUTTON_BASE} border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 focus-visible:ring-blue-600`;
const NOTICE_TONES = {
  error: {
    box: 'border-red-200 bg-red-50 text-red-800',
    icon: 'bg-red-100 text-red-600',
    glyph: '!',
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: 'bg-emerald-100 text-emerald-700',
    glyph: '✓',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'bg-amber-100 text-amber-700',
    glyph: '!',
  },
  info: {
    box: 'border-blue-100 bg-blue-50 text-slate-700',
    icon: 'bg-blue-100 text-blue-700',
    glyph: 'i',
  },
};
function Notice({ tone, role, children }) {
  const style = NOTICE_TONES[tone];
  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6 ${style.box}`}
    >
      <span
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-bold ${style.icon}`}
        aria-hidden="true"
      >
        {style.glyph}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
const STAT_DOTS = {
  blue: { wrap: 'bg-blue-50', dot: 'bg-blue-600' },
  amber: { wrap: 'bg-amber-50', dot: 'bg-amber-500' },
  green: { wrap: 'bg-emerald-50', dot: 'bg-emerald-500' },
  navy: { wrap: 'bg-slate-100', dot: 'bg-[#0B1733]' },
};
function StatCard({ label, value, caption, tone }) {
  const dot = STAT_DOTS[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${dot.wrap}`}
          aria-hidden="true"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${dot.dot}`} />
        </span>
      </div>
      <div className="mt-4 break-words text-2xl font-extrabold tracking-tight tabular-nums text-[#0B1733] sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
    </div>
  );
}
function ProofForm({ milestoneId, onSubmit, busy }) {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(url, note);
  }
  return (
    <form
      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`proof-url-${milestoneId}`} className={LABEL_CLASS}>
            Evidence URL
          </label>
          <input
            id={`proof-url-${milestoneId}`}
            className={INPUT_CLASS}
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/photo.jpg"
          />
          <span className={HINT_CLASS}>
            A link to a photo, video or shared folder. Uploads are out of scope
            for this MVP.
          </span>
        </div>
        <div className="min-w-0">
          <label htmlFor={`proof-note-${milestoneId}`} className={LABEL_CLASS}>
            Note (optional)
          </label>
          <input
            id={`proof-note-${milestoneId}`}
            className={INPUT_CLASS}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What was completed?"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className={BUTTON_PRIMARY_SMALL} disabled={busy}>
          {busy ? 'Submitting...' : 'Submit proof for review'}
        </button>
      </div>
    </form>
  );
}
function RejectForm({ milestoneId, onSubmit, busy }) {
  const [note, setNote] = useState('');
  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(note);
  }
  return (
    <form
      className="rounded-xl border border-red-100 bg-red-50/50 p-4 sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={`reject-note-${milestoneId}`} className={LABEL_CLASS}>
            What needs to change?
          </label>
          <input
            id={`reject-note-${milestoneId}`}
            className={INPUT_CLASS}
            required
            minLength={5}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Be specific so the contractor can fix it."
          />
        </div>
        <button type="submit" className={BUTTON_DANGER} disabled={busy}>
          {busy ? 'Rejecting...' : 'Reject proof'}
        </button>
      </div>
    </form>
  );
}
function DisputeForm({ milestoneId, onSubmit, busy }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(reason);
  }
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => setOpen(true)}
          disabled={busy}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 4 3 20h18L12 4Z" />
            <path d="M12 10v4M12 17h.01" />
          </svg>
          Raise a dispute
        </button>
      </div>
    );
  }
  return (
    <form
      className="rounded-xl border border-red-200 bg-red-50/50 p-4 sm:p-5"
      onSubmit={handleSubmit}
    >
      <div>
        {}
        <label htmlFor={`dispute-reason-${milestoneId}`} className={LABEL_CLASS}>
          Why should the project be frozen?
        </label>
        <textarea
          id={`dispute-reason-${milestoneId}`}
          className={`${INPUT_CLASS} min-h-28 resize-y leading-6`}
          required
          minLength={10}
          maxLength={1000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Describe the problem clearly. Both participants will see this."
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className={BUTTON_DANGER} disabled={busy}>
          {busy ? 'Freezing...' : 'Freeze project'}
        </button>
        <button
          type="button"
          className={BUTTON_OUTLINE}
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    const data = await api(`/projects/${id}`);
    setDetail(data);
  }, [id]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/projects/${id}`)
      .then((data) => {
        if (active) {
          setDetail(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function runAction(key, action) {
    setBusy(key);
    setActionError('');
    setNotice('');
    try {
      const result = await action();
      await load();
      if (result?.message) {
        setNotice(result.message);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
  }
  const handleFund = () =>
    runAction('fund', () =>
      api(`/projects/${id}/fund`, { method: 'POST' }),
    );
  const handleSubmitProof = (milestoneId, url, note) =>
    runAction(`proof-${milestoneId}`, () =>
      api(`/projects/${id}/milestones/${milestoneId}/proofs`, {
        method: 'POST',
        body: { url, note },
      }),
    );
  const handleApprove = (milestoneId) =>
    runAction(`approve-${milestoneId}`, () =>
      api(`/projects/${id}/milestones/${milestoneId}/approve`, {
        method: 'POST',
      }),
    );
  const handleReject = (milestoneId, note) =>
    runAction(`reject-${milestoneId}`, () =>
      api(`/projects/${id}/milestones/${milestoneId}/reject`, {
        method: 'POST',
        body: { note },
      }),
    );
  const handleDispute = (milestoneId, reason) =>
    runAction(`dispute-${milestoneId}`, () =>
      api(`/projects/${id}/disputes`, {
        method: 'POST',
        body: { milestone_id: milestoneId, reason },
      }),
    );
  const handleWithdraw = (disputeId) =>
    runAction(`withdraw-${disputeId}`, () =>
      api(`/projects/${id}/disputes/${disputeId}/withdraw`, {
        method: 'POST',
      }),
    );
  if (loading) {
    return (
      <div role="status" className="animate-pulse space-y-6">
        <span className="sr-only">Loading project...</span>
        <div className="h-64 rounded-3xl bg-slate-200/70" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="h-32 rounded-2xl bg-slate-200/70" />
          <div className="h-32 rounded-2xl bg-slate-200/70" />
          <div className="h-32 rounded-2xl bg-slate-200/70" />
          <div className="h-32 rounded-2xl bg-slate-200/70" />
        </div>
        <div className="h-48 rounded-2xl bg-slate-200/70" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-xl space-y-4">
        <Notice tone="error" role="alert">
          {error}
        </Notice>
        <Link className={BUTTON_OUTLINE} to="/">
          Back to dashboard
        </Link>
      </div>
    );
  }
  if (!detail?.project) {
    return null;
  }
  const project = detail.project;
  const isClient = project.viewer_role === 'CLIENT';
  const isContractor = project.viewer_role === 'CONTRACTOR';
  const isActive = project.status === 'ACTIVE';
  const openDisputes = detail.disputes.filter(
    (dispute) => dispute.status === 'OPEN',
  );
  const canFund =
    isClient && isActive && Boolean(project.contractor) && !project.funded;
  const releasedPercent =
    project.total_paise > 0
      ? Math.min(
          100,
          Math.round((project.released_paise / project.total_paise) * 100),
        )
      : 0;
  return (
    <div className="space-y-6">
      {}
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700"
        to="/"
      >
        &larr; Back to dashboard
      </Link>
      {}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B1733] px-6 pb-9 pt-8 text-white shadow-lg shadow-[#0B1733]/10 sm:px-10 sm:pt-10">
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[44px] border-white/[0.04]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-10 h-56 w-96 rounded-full bg-blue-600/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold tracking-wider text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" aria-hidden="true" />
              PROJECT #{project.id}
            </div>
            <h1 className="mt-5 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
              {project.title}
              <span className="text-[#FFB800]">.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              {project.description || 'No description provided.'}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20">
            <StatusBadge status={project.status} />
          </div>
        </div>
        {}
        <dl className="relative mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6">
          <div>
            <dt className="text-xs font-semibold tracking-wider text-slate-400">CLIENT</dt>
            <dd className="mt-1 text-sm font-semibold text-white">{project.client.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-slate-400">CONTRACTOR</dt>
            <dd className="mt-1 text-sm font-semibold text-white">
              {project.contractor?.name || 'waiting for a contractor'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-slate-400">CREATED</dt>
            <dd className="mt-1 text-sm font-semibold text-white">
              {formatDate(project.created_at)}
            </dd>
          </div>
        </dl>
        <div
          className="absolute inset-x-0 bottom-0 h-1.5 bg-[linear-gradient(to_right,#2563eb,#FFB800,#2563eb)]"
          aria-hidden="true"
        />
      </section>
      {}
      <section aria-label="Escrow summary" className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Project total"
            value={formatMoney(project.total_paise)}
            caption="Across every milestone"
            tone="blue"
          />
          <StatCard
            label="Deposited"
            value={formatMoney(project.deposited_paise)}
            caption="Recorded in the demo escrow"
            tone="amber"
          />
          <StatCard
            label="Released"
            value={formatMoney(project.released_paise)}
            caption="Paid out after approval"
            tone="green"
          />
          <StatCard
            label="Still held"
            value={formatMoney(project.held_paise)}
            caption="Waiting in escrow"
            tone="navy"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-slate-600">Payment progress</span>
            <span className="text-sm font-bold tabular-nums text-blue-600">
              {releasedPercent}%
            </span>
          </div>
          {}
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${releasedPercent}%` }}
            />
          </div>
        </div>
      </section>
      {}
      <p className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#FFB800]" aria-hidden="true" />
        Demo escrow only - no real money moves through BuildBond.
      </p>
      {}
      {actionError && (
        <Notice tone="error" role="alert">
          {actionError}
        </Notice>
      )}
      {notice && (
        <Notice tone="success" role="status">
          {notice}
        </Notice>
      )}
      {}
      {project.status === 'DISPUTED' && (
        <Notice tone="warning" role="status">
          This project is frozen by a dispute. Money cannot move and proof
          cannot be reviewed until the person who raised it withdraws it.
        </Notice>
      )}
      {}
      {project.status === 'COMPLETED' && (
        <Notice tone="success" role="status">
          Every milestone is released. This project is complete.
        </Notice>
      )}
      {}
      {isClient && !project.contractor && project.status === 'OPEN' && (
        <Notice tone="info" role="status">
          Waiting for a contractor to accept. You can fund the demo escrow after
          someone accepts the job.
        </Notice>
      )}
      {isContractor && isActive && !project.funded && (
        <Notice tone="info" role="status">
          The client has not funded the demo escrow yet. You can submit proof
          once the deposit is recorded.
        </Notice>
      )}
      {}
      {canFund && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 border-l-4 border-l-[#FFB800] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <strong className="text-base font-bold text-[#0B1733]">
              Fund the demo escrow
            </strong>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Record the full project total once. Each approved milestone then
              releases its own share from this balance.
            </p>
          </div>
          <button
            type="button"
            className={`${BUTTON_PRIMARY} shrink-0`}
            onClick={handleFund}
            disabled={Boolean(busy)}
          >
            {busy === 'fund'
              ? 'Funding...'
              : `Fund ${formatMoney(project.total_paise)} (demo)`}
          </button>
        </div>
      )}
      <div className="pt-4">
        <h2 className="text-xl font-bold tracking-tight text-[#0B1733]">Milestones</h2>
        <p className="mt-1 text-sm text-slate-500">
          One proof at a time. Every decision is recorded below.
        </p>
      </div>
      <div className="space-y-5">
        {}
        {detail.milestones.map((milestone) => {
          const openDispute = openDisputes.find(
            (dispute) => dispute.milestone_id === milestone.id,
          );
          const canSubmit =
            isContractor &&
            isActive &&
            project.funded &&
            (milestone.status === 'PENDING' ||
              milestone.status === 'REJECTED');
          const canReview = isClient && isActive && milestone.status === 'SUBMITTED';
          const canDispute =
            (isClient || isContractor) &&
            isActive &&
            milestone.status !== 'RELEASED' &&
            !openDispute;
          const canWithdraw =
            openDispute && openDispute.raised_by === user.id;
          const hasActions =
            canSubmit || canReview || canDispute || canWithdraw;
          return (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              openDispute={openDispute}
              actions={
                hasActions ? (
                  <div className="space-y-4">
                    {}
                    {canSubmit && (
                      <ProofForm
                        milestoneId={milestone.id}
                        onSubmit={(url, note) =>
                          handleSubmitProof(milestone.id, url, note)
                        }
                        busy={busy === `proof-${milestone.id}`}
                      />
                    )}
                    {}
                    {canReview && (
                      <>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className={BUTTON_PRIMARY}
                            onClick={() => handleApprove(milestone.id)}
                            disabled={Boolean(busy)}
                          >
                            {busy === `approve-${milestone.id}`
                              ? 'Releasing...'
                              : `Approve and release ${formatMoney(
                                  milestone.amount_paise,
                                )}`}
                          </button>
                        </div>
                        <RejectForm
                          milestoneId={milestone.id}
                          onSubmit={(note) =>
                            handleReject(milestone.id, note)
                          }
                          busy={busy === `reject-${milestone.id}`}
                        />
                      </>
                    )}
                    {}
                    {canWithdraw && (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className={BUTTON_OUTLINE_SMALL}
                          onClick={() => handleWithdraw(openDispute.id)}
                          disabled={Boolean(busy)}
                        >
                          {busy === `withdraw-${openDispute.id}`
                            ? 'Withdrawing...'
                            : 'Withdraw dispute'}
                        </button>
                      </div>
                    )}
                    {}
                    {canDispute && (
                      <DisputeForm
                        milestoneId={milestone.id}
                        onSubmit={(reason) =>
                          handleDispute(milestone.id, reason)
                        }
                        busy={busy === `dispute-${milestone.id}`}
                      />
                    )}
                  </div>
                ) : null
              }
            />
          );
        })}
      </div>
      {}
      <div className="grid gap-6 pt-4 lg:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold tracking-tight text-[#0B1733]">Ledger</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Append-only money history. The balance is the sum of these rows.
          </p>
          <Ledger entries={detail.ledger} />
        </section>
        {}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold tracking-tight text-[#0B1733]">Activity</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            The shared record of what happened, in order.
          </p>
          <Timeline events={detail.events} />
        </section>
      </div>
    </div>
  );
}
