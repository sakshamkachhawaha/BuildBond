import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api.js';
import { formatMoney } from '../format.js';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const BUTTON_PRIMARY =
  `${BUTTON_BASE} bg-blue-600 px-5 py-3 text-white shadow-md shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:ring-blue-600`;

const BUTTON_PRIMARY_SMALL =
  `${BUTTON_BASE} bg-blue-600 px-4 py-2.5 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus-visible:ring-blue-600`;

const BUTTON_OUTLINE =
  `${BUTTON_BASE} border border-slate-300 bg-white px-5 py-3 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-blue-600`;

function ErrorNotice({ children }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-800"
    >
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-red-100 text-xs font-bold text-red-600"
        aria-hidden="true"
      >
        !
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function JobSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading open jobs...</span>

      <div className="h-56 animate-pulse rounded-3xl bg-slate-200/70" />

      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-56 animate-pulse rounded-2xl bg-slate-200/70"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyJobs({ onRefresh }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M3 12h18M10 12v2h4v-2" />
          </svg>
        </div>

        <h2 className="mt-6 text-xl font-extrabold tracking-tight text-[#0B1733]">
          No open jobs right now
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          New projects appear here as soon as a client creates them.
          Check back shortly for your next opportunity.
        </p>

        <button
          type="button"
          className={`${BUTTON_OUTLINE} mt-6`}
          onClick={onRefresh}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 7v5h-5" />
            <path d="M4 17v-5h5" />
            <path d="M5.6 9a7 7 0 0 1 11.9-2L20 12" />
            <path d="M18.4 15a7 7 0 0 1-11.9 2L4 12" />
          </svg>
          Refresh jobs
        </button>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center">
        <p className="text-xs font-medium text-slate-500">
          Keep your profile updated so clients can find the right contractor.
        </p>
      </div>
    </div>
  );
}

function JobCard({ job, acceptingId, onAccept }) {
  const isAccepting = acceptingId === job.id;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-[#FFB800]" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              OPEN PROJECT
            </div>

            <h2 className="mt-4 break-words text-lg font-bold leading-snug text-[#0B1733] transition-colors group-hover:text-blue-700 sm:text-xl">
              {job.title}
            </h2>

            <p className="mt-1.5 text-xs font-medium text-slate-500">
              Posted by <span className="font-semibold text-slate-700">{job.client_name}</span>
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-blue-50 px-3 py-2.5 text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Budget
            </span>
            <span className="mt-1 block whitespace-nowrap text-base font-extrabold tabular-nums text-[#0B1733]">
              {formatMoney(job.total_paise)}
            </span>
          </div>
        </div>

        <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
          {job.description || 'No description provided.'}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 6h13M8 12h13M8 18h13" />
              <path d="M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            {job.milestone_count} milestone
            {job.milestone_count === 1 ? '' : 's'}
          </span>

          <span className="ml-auto hidden text-xs font-medium text-slate-400 sm:block">
            Project #{job.id}
          </span>
        </div>

        <button
          type="button"
          className={`${BUTTON_PRIMARY_SMALL} mt-4 w-full`}
          onClick={() => onAccept(job.id)}
          disabled={acceptingId !== null}
        >
          {isAccepting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="3"
                  opacity=".25"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Accepting...
            </>
          ) : (
            <>
              Accept job
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api('/jobs');
      setJobs(result.jobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function acceptJob(projectId) {
    setAcceptingId(projectId);
    setError('');

    try {
      await api(`/projects/${projectId}/accept`, { method: 'POST' });
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err.message);
      setAcceptingId(null);
    }
  }

  if (loading) {
    return <JobSkeleton />;
  }

  if (error && jobs === null) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-8">
        <ErrorNotice>{error}</ErrorNotice>

        <button
          type="button"
          className={BUTTON_OUTLINE}
          onClick={loadJobs}
        >
          Try again
        </button>
      </div>
    );
  }

  const list = jobs ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#0B1733] px-6 py-8 text-white shadow-xl shadow-[#0B1733]/10 sm:px-9 sm:py-10">
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[48px] border-white/[0.035]"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3.5 py-1.5 text-xs font-bold tracking-wider text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
              CONTRACTOR WORKSPACE
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[42px]">
              Find work worth proving<span className="text-[#FFB800]">.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Discover projects, take ownership of the work and get paid
              milestone by milestone. Every completed step is backed by proof.
            </p>
          </div>

          <div className="relative flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-blue-200">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
            <div>
              <span className="block text-[11px] font-semibold tracking-wider text-slate-400">
                AVAILABLE OPPORTUNITIES
              </span>
              <span className="mt-0.5 block text-2xl font-extrabold tabular-nums text-white">
                {list.length}
              </span>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-1.5 bg-[linear-gradient(to_right,#2563eb,#FFB800,#2563eb)]"
          aria-hidden="true"
        />
      </section>

      {error && (
        <ErrorNotice>{error}</ErrorNotice>
      )}

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#0B1733] sm:text-2xl">
              Available projects
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse open projects and choose your next opportunity.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            onClick={loadJobs}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.6 9a7 7 0 0 1 11.9-2L20 12M18.4 15a7 7 0 0 1-11.9 2L4 12" />
            </svg>
            Refresh
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyJobs onRefresh={loadJobs} />
        ) : (
          <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                acceptingId={acceptingId}
                onAccept={acceptJob}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}