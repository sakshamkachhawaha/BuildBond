import { formatDate, formatMoney } from '../format.js';
import StatusBadge from './Badge.jsx';

export default function MilestoneCard({ milestone, openDispute, actions }) {
  const proof = milestone.latest_proof;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1733] text-sm font-bold text-[#FFB800]">
            {String(milestone.position).padStart(2, '0')}
          </div>

          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Milestone {milestone.position}
            </p>
            <h3 className="break-words text-base font-bold text-[#0B1733] sm:text-lg">
              {milestone.title}
            </h3>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
          <span className="text-lg font-bold tracking-tight text-[#0B1733]">
            {formatMoney(milestone.amount_paise)}
          </span>
          <StatusBadge status={milestone.status} />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {proof ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M8 13h8M8 17h5" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-[#0B1733]">
                  Latest submission
                </span>
              </div>

              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                {proof.status.toLowerCase()}
              </span>
            </div>

            <a
              href={proof.url}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            >
              {proof.url}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M14 3h7v7M10 14 21 3" />
                <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
              </svg>
            </a>

            {proof.note && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {proof.note}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-blue-100 pt-3 text-xs text-slate-500">
              <span>
                Submitted by{' '}
                <strong className="font-semibold text-slate-700">
                  {proof.submitted_by_name}
                </strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>{formatDate(proof.created_at)}</span>
            </div>

            {proof.review_note && (
              <div
                className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${
                  proof.status === 'REJECTED'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-wide">
                  Client note
                </p>
                {proof.review_note}
              </div>
            )}

            {milestone.proofs.length > 1 && (
              <details className="group mt-4 border-t border-blue-100 pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-600 hover:text-[#0B1733]">
                  <span>
                    Proof history ({milestone.proofs.length} submissions)
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>

                <ul className="mt-3 space-y-3">
                  {milestone.proofs.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-1 rounded-lg bg-white p-3 text-xs ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-slate-500">
                        <span>{formatDate(item.created_at)}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold uppercase">
                          {item.status.toLowerCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          View proof
                        </a>
                        {item.review_note && (
                          <span className="break-words text-slate-500">
                            — {item.review_note}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0B1733]">
                No proof submitted yet
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                The contractor can upload a link here once the work is ready for review.
              </p>
            </div>
          </div>
        )}

        {openDispute && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.3 3.9 1.8 18.5A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-red-800">
                  Dispute open — project frozen
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  Raised by <strong>{openDispute.raised_by_name}</strong> on{' '}
                  {formatDate(openDispute.created_at)}.
                </p>
                <div className="mt-3 rounded-lg border border-red-200/80 bg-white/70 p-3 text-sm leading-6 text-red-900">
                  {openDispute.reason}
                </div>
              </div>
            </div>
          </div>
        )}

        {actions && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}
