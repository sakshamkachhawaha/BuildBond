import { formatDate, formatMoney } from '../format.js';

const KIND_STYLES = {
  deposit: {
    pill: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-600',
    amount: 'text-blue-700',
  },
  release: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    amount: 'text-[#0B1733]',
  },
};

export default function Ledger({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-slate-50 px-6 py-10 text-center">
        <span
          className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"
          aria-hidden="true"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M6 12h.01M18 12h.01" />
          </svg>
        </span>
        <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
          No money has moved yet. The client has not funded this project.
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[26rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th scope="col" className="pb-3 pr-4 font-semibold">
              Date
            </th>
            <th scope="col" className="pb-3 pr-4 font-semibold">
              Entry
            </th>
            <th scope="col" className="pb-3 pr-4 font-semibold">
              Milestone
            </th>
            <th scope="col" className="pb-3 text-right font-semibold">
              Amount
            </th>
          </tr>
        </thead>

        <tbody>
          {entries.map((entry) => {
            const isRelease = entry.kind === 'RELEASE';
            const style = isRelease ? KIND_STYLES.release : KIND_STYLES.deposit;

            return (
              <tr
                key={entry.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="whitespace-nowrap py-3.5 pr-4 text-sm text-slate-500">
                  {formatDate(entry.created_at)}
                </td>
                <td className="py-3.5 pr-4">
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.pill}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                      aria-hidden="true"
                    />
                    {isRelease ? 'Release' : 'Deposit'}
                  </span>
                </td>
                <td className="py-3.5 pr-4 text-sm font-medium text-[#0B1733]">
                  {entry.milestone_title || 'Project escrow'}
                </td>
                <td
                  className={`whitespace-nowrap py-3.5 text-right text-sm font-bold tabular-nums ${style.amount}`}
                >
                  {isRelease ? '-' : '+'}
                  {formatMoney(entry.amount_paise)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
