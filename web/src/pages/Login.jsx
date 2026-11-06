import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';

const INPUT_CLASS =
  'block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-[0.95rem] text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 motion-reduce:transition-none';

const LABEL_CLASS = 'mb-2 block text-sm font-semibold text-slate-900';

const FIELD_ICON_CLASS =
  'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600';

const DEMO_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none';

const STORY_POINTS = [
  {
    text: 'The client funds the whole project once.',
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    ),
  },
  {
    text: 'The contractor submits proof for each milestone.',
    icon: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
        <path d="M14 3v5h5" />
        <path d="m9 14 2 2 4-4" />
      </>
    ),
  },
  {
    text: 'Approve to release; reject to request a redo.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </>
    ),
  },
  {
    text: 'A dispute freezes every action until it is withdrawn.',
    icon: (
      <>
        <path d="M12 3 4 6v6c0 4.5 3.2 8.2 8 9 4.8-.8 8-4.5 8-9V6l-8-3Z" />
        <path d="M10 9v6M14 9v6" />
      </>
    ),
  },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    try {
      await login(email, password);

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(role) {
    setEmail(
      role === 'CLIENT' ? 'client@buildbond.dev' : 'contractor@buildbond.dev',
    );
    setPassword('password123');
    setError('');
  }

  return (
    <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:gap-16">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block" aria-hidden="true">
        <div className="absolute left-0 top-0 h-28 w-28 rotate-[28deg] rounded-[2rem] bg-blue-100/40" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full border border-blue-200/50 bg-blue-50/60" />
      </div>

      <section className="order-2 min-w-0 lg:order-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          <svg
            className="h-4 w-4 text-blue-600"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" />
          </svg>
          Milestone escrow, with evidence
        </div>

        <h1 className="mt-5 max-w-lg text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 lg:text-[2.6rem]">
          Money moves when the work is{' '}
          <span className="text-blue-600">proven.</span>
        </h1>

        <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
          BuildBond holds a project&apos;s money in demo escrow and releases it
          one milestone at a time, after the client reviews the contractor&apos;s
          evidence.
        </p>

        <ul className="mt-8 space-y-4">
          {STORY_POINTS.map((point) => (
            <li key={point.text} className="flex items-center gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm shadow-blue-600/10 ring-1 ring-blue-100"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {point.icon}
                </svg>
              </span>
              <span className="text-base font-medium leading-7 text-slate-800">
                {point.text}
              </span>
            </li>
          ))}
        </ul>

      </section>

      <section className="order-1 w-full min-w-0 rounded-3xl border border-slate-100 bg-white p-7 shadow-2xl shadow-slate-300/30 sm:p-9 lg:order-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-2 text-[0.95rem] leading-6 text-slate-500">
          Log in to review work, release a milestone, or accept a job.
        </p>

        {error && (
          <div
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            role="alert">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4a1 1 0 0 0-1 1v3.5a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1Zm0 8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )} 

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="login-email" className={LABEL_CLASS}>
              Email
            </label>
            <div className="group relative">
              <svg
                className={FIELD_ICON_CLASS}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                id="login-email"
                className={INPUT_CLASS}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className={LABEL_CLASS}>
              Password
            </label>
            <div className="group relative">
              <svg
                className={FIELD_ICON_CLASS}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="login-password"
                className={INPUT_CLASS}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <button
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-[0.95rem] font-semibold text-white shadow-lg shadow-blue-600/25 transition duration-200 hover:bg-blue-700 hover:shadow-blue-600/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none motion-reduce:transition-none"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <svg
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                />
              </svg>
            ) : null}
            {submitting ? 'Signing in...' : 'Log in'}
            {!submitting && (
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"              >
                <path d="M4 10h12m0 0-5-5m5 5-5 5" />
              </svg>
            )}
          </button>
        </form>

        <div className="mt-7">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            <strong className="text-xs font-semibold text-slate-400">Demo accounts</strong>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>

          <p className="mt-3.5 text-center text-sm text-slate-500">
            Both use the password{' '}
            <code className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[0.8rem] font-semibold text-blue-700">
              password123
            </code>
            .
          </p>

          <div className="mt-3.5 grid grid-cols-2 gap-3">
            <button
              type="button"
              className={DEMO_BUTTON_CLASS}
              onClick={() => fillDemo('CLIENT')} >
              Use client
            </button>
            <button
              type="button"
              className={DEMO_BUTTON_CLASS}
              onClick={() => fillDemo('CONTRACTOR')}
            >
              Use contractor
            </button>
          </div>
        </div>

        <p className="mt-7 text-center text-sm text-slate-500">
          New here?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}