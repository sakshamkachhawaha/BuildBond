import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from '../components/Badge.jsx';
import { formatMoney } from '../format.js';

const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';

const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';

function StatCard({ label, value, description, accent = 'blue' }) {
  const accentStyles = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-amber-50 text-amber-600',
    navy: 'bg-slate-100 text-[#0B1733]',
    green: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentStyles[accent]}`}
          aria-hidden="true"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </div>

      <p className="mt-4 break-words text-2xl font-bold tracking-tight text-[#0B1733] sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-xs font-medium text-slate-400">
        {description}
      </p>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8" role="status">
      <span className="sr-only">Loading your dashboard...</span>

      <div className="h-56 rounded-2xl bg-slate-200/70" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 rounded-2xl bg-slate-200/70" />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-60 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ role, destination }) {
  const isClient = role === 'CLIENT';

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <svg
            className="h-8 w-8 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 7.8 12 12l7.5-4.2M12 12v8.5M8 5.3l8 4.5"
            />
          </svg>
        </div>

        <h2 className="mt-6 text-xl font-bold tracking-tight text-[#0B1733]">
          {isClient ? 'Your next project starts here' : 'Ready for your next job?'}
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
          {isClient
            ? 'Create your first project, break it into milestones, and manage payments with proof-of-work tracking.'
            : 'Explore available opportunities, find projects that match your skills, and start building your portfolio.'}
        </p>

        <Link to={destination} className={`${PRIMARY_BUTTON} mt-7`}>
          {isClient ? 'Create your first project' : 'Explore available jobs'}
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600" />
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api('/projects');
      setProjects(result.projects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          !
        </div>
        <h2 className="mt-4 text-lg font-bold text-[#0B1733]">
          Couldn't load your dashboard
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
        <button
          type="button"
          className={`${SECONDARY_BUTTON} mt-6`}
          onClick={loadProjects}
        >
          Try again
        </button>
      </div>
    );
  }

  const list = projects ?? [];
  const isClient = user.role === 'CLIENT';
  const firstName = user.name.split(' ')[0];

  const activeCount = list.filter(
    (project) => project.status === 'ACTIVE'
  ).length;

  const heldTotal = list.reduce(
    (sum, project) => sum + project.held_paise,
    0
  );

  const releasedTotal = list.reduce(
    (sum, project) => sum + project.released_paise,
    0
  );

  const actionCount = list.filter(
    (project) => project.action_needed
  ).length;

  const destination = isClient ? '/projects/new' : '/jobs';

  return (
    <div className="space-y-8">

      <section className="relative overflow-hidden rounded-2xl bg-[#0B1733] px-6 py-8 shadow-lg shadow-slate-900/10 sm:px-9 sm:py-10 lg:px-11">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[45px] border-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
              {isClient ? 'CLIENT WORKSPACE' : 'CONTRACTOR WORKSPACE'}
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[42px]">
              Welcome back, {firstName}
              <span className="text-[#FFB800]">.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              {isClient
                ? 'Manage your projects, review submitted work, and keep every milestone on track.'
                : 'Discover opportunities, manage your ongoing projects, and track your earnings.'}
            </p>
          </div>

          <div className="relative shrink-0">
            <Link to={destination} className={PRIMARY_BUTTON}>
              {isClient ? (
                <>
                  <span className="text-lg leading-none">+</span>
                  Create project
                </>
              ) : (
                <>
                  Find work
                  <span aria-hidden="true">→</span>
                </>
              )}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-[#FFB800] to-blue-500" />
      </section>


      <section aria-label="Project summary">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#0B1733]">
              Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A snapshot of your project activity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active projects"
            value={activeCount}
            description="Currently in progress"
            accent="blue"
          />

          <StatCard
            label="Funds in escrow"
            value={formatMoney(heldTotal)}
            description="Currently held securely"
            accent="yellow"
          />

          <StatCard
            label="Released payments"
            value={formatMoney(releasedTotal)}
            description="Successfully released"
            accent="green"
          />

          <StatCard
            label="Needs your attention"
            value={actionCount}
            description="Pending actions"
            accent="navy"
          />
        </div>
      </section>

      {list.length === 0 ? (
        <EmptyState role={user.role} destination={destination} />
      ) : (
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0B1733]">
                Your projects
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep track of your ongoing work and payments.
              </p>
            </div>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {list.length} {list.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((project) => {
              const percent =
                project.total_paise > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (project.released_paise / project.total_paise) * 100
                      )
                    )
                  : 0;

              return (
                <article
                  key={project.id}
                  className={`group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 sm:p-6 ${
                    project.action_needed
                      ? 'border-blue-200'
                      : 'border-slate-200/80'
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        PROJECT
                      </p>

                      <h3 className="mt-2 break-words text-lg font-bold leading-snug text-[#0B1733] transition-colors group-hover:text-blue-700">
                        {project.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {project.counterparty_name
                          ? `${
                              project.viewer_role === 'CLIENT'
                                ? 'Contractor'
                                : 'Client'
                            }: ${project.counterparty_name}`
                          : 'Waiting for a contractor'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={project.status} />
                    </div>
                  </div>


                  <div className="mt-7 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        Payment progress
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {percent}%
                      </span>
                    </div>

                    <div
                      className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
                      role="progressbar"
                      aria-label="Payment released"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-1">
                      <span className="text-sm font-bold text-[#0B1733]">
                        {formatMoney(project.released_paise)}
                      </span>
                      <span className="text-xs text-slate-500">
                        of {formatMoney(project.total_paise)}
                      </span>
                    </div>
                  </div>


                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                      {project.milestone_count}
                    </span>
                    {project.milestone_count === 1 ? 'Milestone' : 'Milestones'}
                  </div>


                  <div className="mt-5 flex min-h-[42px] flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    {project.action_needed && (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
                        {project.viewer_role === 'CLIENT'
                          ? 'Proof awaiting review'
                          : 'Ready to submit proof'}
                      </span>
                    )}

                    {project.open_dispute_count > 0 && (
                      <StatusBadge status="DISPUTED" />
                    )}

                    <Link
                      to={`/projects/${project.id}`}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      View project
                      <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}