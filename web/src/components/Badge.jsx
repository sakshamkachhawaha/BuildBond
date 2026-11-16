const LABELS = {
  OPEN: 'Open',
  ACTIVE: 'Active',
  DISPUTED: 'Disputed',
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  SUBMITTED: 'Awaiting review',
  REJECTED: 'Rejected',
  RELEASED: 'Released',
  APPROVED: 'Approved',
  WITHDRAWN: 'Withdrawn',
};

const TONES = {
  navy: {
    pill: 'bg-[#0B1733] text-white',
    dot: 'bg-[#FFB800]',
  },
  blue: {
    pill: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-600',
  },
  amber: {
    pill: 'bg-amber-50 text-amber-800 ring-amber-200',
    dot: 'bg-[#FFB800]',
  },
  green: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  red: {
    pill: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
  },
  slate: {
    pill: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
};

const STATUS_TONES = {
  OPEN: 'blue',
  ACTIVE: 'navy',
  DISPUTED: 'red',
  COMPLETED: 'green',
  PENDING: 'amber',
  SUBMITTED: 'blue',
  REJECTED: 'red',
  RELEASED: 'green',
  APPROVED: 'green',
  WITHDRAWN: 'slate',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] ?? status;
  const tone = TONES[STATUS_TONES[status]] ?? TONES.slate;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tone.pill}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
