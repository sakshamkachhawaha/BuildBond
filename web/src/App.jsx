import { Link, Route, Routes } from 'react-router';
import Nav from './components/Nav.jsx';
import ProtectedRoute from './components/Guard.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import Login from './pages/Login.jsx';
import NewProject from './pages/NewProject.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Register from './pages/Register.jsx';

function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-200/40 sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-bold text-blue-600">
          404
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
          Page not found
        </p>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Lost your way?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <Link
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to="/"
        >
          Back to dashboard
          <span className="ml-2">→</span>
        </Link>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f7f9fc] text-slate-800 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-indigo-200/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 shadow-sm shadow-slate-200/20 backdrop-blur-xl">
        <Nav />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:py-12">
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

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-medium text-slate-600">BuildBond</p>
          <p>Milestone-based proof-of-work and payment tracking.</p>
        </div>
      </footer>
    </div>
  );
}