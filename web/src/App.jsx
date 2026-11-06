import { Link, Route, Routes } from 'react-router';
import Nav from './components/Nav.jsx';
import ProtectedRoute from './components/Guard.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import Login from './pages/Login.jsx';
import NewProject from './pages/NewProject.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Register from './pages/Register.jsx';


const BLUEPRINT_GRID = {
  backgroundImage:
    'linear-gradient(to right, rgba(11,27,58,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,27,58,0.05) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
  WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 100%)',
  maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 100%)',
};

const HAZARD_STRIPES = {
  backgroundImage:
    'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 14px, #1f2933 14px, #1f2933 28px)',
};

function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-[#0b1b3a]/10">
        <div className="h-3 w-full" style={HAZARD_STRIPES} aria-hidden="true" />

        <div className="px-8 pb-12 pt-10 text-center sm:px-12">
          <div
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0b1b3a] text-3xl font-extrabold tracking-tight text-amber-400 shadow-lg shadow-[#0b1b3a]/30 ring-4 ring-amber-400/30"
            aria-hidden="true"
          >
            404
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#0b1b3a] sm:text-4xl">
            This page isn&apos;t on the plan
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-slate-600">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>

          <Link
            className="group mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 text-sm font-bold text-[#0b1b3a] shadow-lg shadow-amber-400/30 transition duration-200 hover:bg-amber-300 hover:shadow-amber-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1b3a] focus-visible:ring-offset-2 motion-reduce:transition-none"
            to="/"
          >
            Back to dashboard
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 10h12m0 0-5-5m5 5-5 5" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f4f5f7] text-[#1f2933] antialiased selection:bg-amber-200 selection:text-[#0b1b3a]">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-[#0b1b3a] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        Skip to content
      </a>

      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0" style={BLUEPRINT_GRID} />
        <div className="absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-[#0b1b3a]/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-[#0b1b3a]/5 backdrop-blur-xl">
        <div className="h-1 w-full bg-amber-400" aria-hidden="true" />
        <Nav />
      </header>

      <main
        id="main-content"
        className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:py-18"
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute role="CONTRACTOR">
                <Jobs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/new"
            element={
              <ProtectedRoute role="CLIENT">
                <NewProject />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#0b1b3a]">
      </footer>
    </div>
  );
}