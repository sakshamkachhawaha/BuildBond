import { formatDate } from '../format.js';

export default function Timeline({ events }) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
        No activity yet.
      </p>
    );
  }

  return (
    <ol>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;

        return (
          <li key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center" aria-hidden="true">
              <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-blue-600 bg-white ring-4 ring-blue-50" />
              {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200" />}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-6'}`}>
              <div className="break-words text-sm font-medium leading-6 text-[#0B1733]">
                {event.message}
              </div>
              <time
                className="mt-0.5 block text-xs tabular-nums text-slate-500"
                dateTime={event.created_at}
              >
                {formatDate(event.created_at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
