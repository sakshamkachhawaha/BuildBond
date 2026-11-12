import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';

const INPUT_CLASS =
  'block w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-[0.95rem] text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 motion-reduce:transition-none';

const LABEL_CLASS = 'mb-2 block text-sm font-semibold text-slate-900';

const FIELD_ICON_CLASS =
  'pointer-events-none absolute left-4 top-[1.05rem] h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600';

const ROLE_BASE_CLASS =
  'relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 motion-reduce:transition-none';
const ROLE_SELECTED_CLASS = 'border-blue-600 bg-blue-50 ring-2 ring-blue-100';
const ROLE_IDLE_CLASS = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';

const STORY_POINTS = [
  {
    text: 'Clients define the steps and the money.',
    icon: (
      <>
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9 4h6v3H9z" />
        <path d="M9 12h6M9 16h4" />
      </>
    ),
  },
  {
    text: 'Contractors accept the job and submit proof.',
    icon: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
        <path d="M14 3v5h5" />
        <path d="m9 14 2 2 4-4" />
      </>
    ),
  },
  {
    text: 'Neither side can silently change the record.',
    icon: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
];

function RadioDot({ selected }) {
  return (
    <span
      className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
        selected ? 'border-blue-600' : 'border-slate-300'
      }`}
      aria-hidden="true"
    >
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
    </span>
  );
}

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENT');
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
      await register({ name, email, password, role });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
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
          Two sides, one record
        </div>

        <h1 className="mt-5 max-w-lg text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 lg:text-[2.6rem]">
          Start with a{' '}
          <span className="text-blue-600">clear agreement.</span>
        </h1>

        <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
          Every project has three to five milestones, one client, one contractor
          and one shared history of evidence and decisions.
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

        <p className="mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white/70 px-4 py-3.5 text-sm leading-6 text-slate-500">
          BuildBond is a simulation. Use a demo password you do not reuse
          anywhere important.
        </p>
      </section>

      <section className="order-1 w-full min-w-0 rounded-3xl border border-slate-100 bg-white p-7 shadow-2xl shadow-slate-300/30 sm:p-8 lg:order-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="mt-2 text-[0.95rem] leading-6 text-slate-500">
          Pick the side of the project you are on.
        </p>

        {error && (
          <div
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            role="alert"
          >
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="register-name" className={LABEL_CLASS}>
              Full name
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
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              <input
                id="register-name"
                className={INPUT_CLASS}
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Aarav Sharma"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className={LABEL_CLASS}>
              Email
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
                <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                id="register-email"
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
            <label htmlFor="register-password" className={LABEL_CLASS}>
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
                id="register-password"
                className={INPUT_CLASS}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <span className="mt-1.5 block text-xs leading-5 text-slate-500">
              Use at least 8 characters. The server stores only a bcrypt hash.
            </span>
          </div>

          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mb-2 p-0 text-sm font-semibold text-slate-900">
              I am joining as
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`${ROLE_BASE_CLASS} ${
                  role === 'CLIENT' ? ROLE_SELECTED_CLASS : ROLE_IDLE_CLASS
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="role"
                  value="CLIENT"
                  checked={role === 'CLIENT'}
                  onChange={() => setRole('CLIENT')}
                />
                <RadioDot selected={role === 'CLIENT'} />
                <strong className="pr-7 text-sm font-bold text-slate-900">Client</strong>
                <span className="text-xs leading-5 text-slate-500">
                  I am hiring and funding a project.
                </span>
              </label>

              <label
                className={`${ROLE_BASE_CLASS} ${
                  role === 'CONTRACTOR' ? ROLE_SELECTED_CLASS : ROLE_IDLE_CLASS
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="role"
                  value="CONTRACTOR"
                  checked={role === 'CONTRACTOR'}
                  onChange={() => setRole('CONTRACTOR')}
                />
                <RadioDot selected={role === 'CONTRACTOR'} />
                <strong className="pr-7 text-sm font-bold text-slate-900">Contractor</strong>
                <span className="text-xs leading-5 text-slate-500">
                  I do the work and submit evidence.
                </span>
              </label>
            </div>
          </fieldset>

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
            {submitting ? 'Creating account...' : 'Create account'}
            {!submitting && (
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10h12m0 0-5-5m5 5-5 5" />
              </svg>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Log in
          </Link>
        </p>
      </section>
    </div>
  );
}