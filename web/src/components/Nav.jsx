import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  }

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">

      <Link
        to="/"
        className="flex shrink-0 items-center gap-2.5"
        aria-label="BuildBond home"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20">
          B
        </span>
        <span className="text-lg font-extrabold tracking-tight text-slate-900">
          BuildBond
        </span>
      </Link>

      {user ? (
        <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Main navigation">

          <NavLink className={navLinkClass} to="/" end>
            Dashboard
          </NavLink>

          {user.role === 'CLIENT' && (
            <NavLink className={navLinkClass} to="/projects/new">
              New project
            </NavLink>
          )}

          {user.role === 'CONTRACTOR' && (
            <NavLink className={navLinkClass} to="/jobs">
              Find work
            </NavLink>
          )}

          <span className="mx-2 hidden border-l border-slate-200 pl-3 text-sm text-slate-500 md:inline">
            {user.name} · {user.role === 'CLIENT' ? 'Client' : 'Contractor'}
          </span>

          <button
            type="button"
            className="ml-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </nav>
      ) : (
        <nav className="flex items-center gap-1" aria-label="Account navigation">
          <NavLink className={navLinkClass} to="/login">
            Log in
          </NavLink>
          <NavLink
            className="ml-1 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            to="/register"
          >
            Create account
          </NavLink>
        </nav>
      )}
    </div>
  );
}
