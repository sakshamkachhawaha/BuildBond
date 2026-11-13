import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api.js';
import { formatMoney, rupeesToPaise } from '../format.js';

function emptyMilestone() {
  return { title: '', amount: '' };
}

export default function NewProject() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState([
    emptyMilestone(),
    emptyMilestone(),
    emptyMilestone(),
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateMilestone(index, field, value) {
    setMilestones((current) =>
      current.map((milestone, rowIndex) =>
        rowIndex === index
          ? { ...milestone, [field]: value }
          : milestone,
      ),
    );
  }

  function addMilestone() {
    if (milestones.length < 5) {
      setMilestones((current) => [...current, emptyMilestone()]);
    }
  }

  function removeMilestone(index) {
    if (milestones.length > 2) {
      setMilestones((current) =>
        current.filter((_, rowIndex) => rowIndex !== index),
      );
    }
  }

  const totalRupees = milestones.reduce(
    (sum, milestone) => sum + (Number(milestone.amount) || 0),
    0,
  );

  const completedMilestones = milestones.filter(
    (milestone) =>
      milestone.title.trim().length >= 3 &&
      Number(milestone.amount) > 0,
  ).length;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (title.trim().length < 3) {
      setError('Give the project a title of at least 3 characters.');
      return;
    }

    for (let index = 0; index < milestones.length; index += 1) {
      const milestone = milestones[index];

      if (milestone.title.trim().length < 3) {
        setError(
          `Milestone ${index + 1} needs a title of at least 3 characters.`,
        );
        return;
      }

      const amountPaise = rupeesToPaise(milestone.amount);

      if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        setError(
          `Milestone ${index + 1} needs an amount greater than zero.`,
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        milestones: milestones.map((milestone) => ({
          title: milestone.title.trim(),
          amount_paise: rupeesToPaise(milestone.amount),
        })),
      };

      const created = await api('/projects', {
        method: 'POST',
        body: payload,
      });

      navigate(`/projects/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0B1733] placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const labelClass = 'mb-2 block text-xs font-bold text-slate-700';

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl bg-[#0B1733] px-6 py-8 text-white shadow-lg shadow-blue-950/10 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[45px] border-blue-500/10" />
        <div className="pointer-events-none absolute -bottom-36 right-36 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
              BUILDBOND · PROJECT SETUP
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              Let's build something
              <span className="text-[#FFB800]"> together.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/70">
              Define your project, break it into milestones, and establish
              clear payment expectations before work begins.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 md:block">
            <div className="text-[10px] font-bold tracking-widest text-blue-200/60">
              PROJECT STRUCTURE
            </div>
            <div className="mt-2 text-3xl font-extrabold">
              {milestones.length}
              <span className="ml-2 text-sm font-medium text-blue-200/60">
                milestones
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {milestones.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-8 rounded-full bg-[#FFB800]"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          {[
            { number: '01', label: 'Project details' },
            { number: '02', label: 'Milestones' },
            { number: '03', label: 'Review & create' },
          ].map((step, i) => (
            <div key={step.number} className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-extrabold ${
                  i < 2
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#FFB800] text-[#0B1733]'
                }`}
              >
                {step.number}
              </span>
              <span className="text-xs font-semibold text-blue-100/80">
                {step.label}
              </span>
              {i !== 2 && (
                <span className="mx-2 hidden text-blue-200/30 sm:inline">
                  /
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <main className="min-w-0 space-y-6">
          <section
            id="project-details"
            className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50/80 px-5 py-4 sm:px-7">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-md shadow-blue-600/20">
                01
              </div>
              <div>
                <h2 className="font-bold text-[#0B1733]">
                  Project details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tell contractors what you need done.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div>
                <label htmlFor="project-title" className={labelClass}>
                  Project name <span className="text-blue-600">*</span>
                </label>
                <input
                  id="project-title"
                  className={inputClass}
                  required
                  minLength={3}
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Sharma Kitchen Renovation"
                />
                <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                  <span>Choose a name that clearly describes the project.</span>
                  <span>{title.length}/120</span>
                </div>
              </div>

              <div>
                <label htmlFor="project-description" className={labelClass}>
                  Project description
                  <span className="ml-2 font-medium text-slate-400">
                    Optional
                  </span>
                </label>
                <textarea
                  id="project-description"
                  className={`${inputClass} min-h-32 resize-y leading-6`}
                  maxLength={1000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Explain the scope of work, requirements, materials, or expected deliverables..."
                />
                <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                  <span>More detail helps contractors understand the work.</span>
                  <span>{description.length}/1000</span>
                </div>
              </div>
            </div>
          </section>

          <section
            id="project-milestones"
            className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-indigo-100 bg-indigo-50/70 px-5 py-4 sm:px-7">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-md shadow-indigo-600/20">
                02
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-[#0B1733]">
                  Milestone breakdown
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Split the work into smaller deliverables.
                </p>
              </div>
              <span className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[10px] font-bold text-indigo-700">
                {milestones.length} of 5 steps
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-5 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-indigo-100 text-xs font-extrabold text-indigo-700">
                  i
                </span>
                <p className="text-xs leading-5 text-indigo-900/75">
                  Assign an amount to every deliverable. The client reviews
                  submitted proof before releasing the corresponding amount.
                </p>
              </div>

              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="group rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0B1733] text-[11px] font-extrabold text-white">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Milestone {index + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        disabled={milestones.length <= 2}
                        title={
                          milestones.length <= 2
                            ? 'A project needs at least two milestones.'
                            : 'Remove this milestone'
                        }
                        aria-label={`Remove milestone ${index + 1}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Remove ×
                      </button>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                      <div className="min-w-0">
                        <label
                          htmlFor={`step-title-${index}`}
                          className={labelClass}
                        >
                          Deliverable name <span className="text-blue-600">*</span>
                        </label>
                        <input
                          id={`step-title-${index}`}
                          className={inputClass}
                          required
                          minLength={3}
                          maxLength={120}
                          value={milestone.title}
                          onChange={(event) =>
                            updateMilestone(index, 'title', event.target.value)
                          }
                          placeholder={
                            index === 0
                              ? 'Site preparation and planning'
                              : 'Describe this deliverable'
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          htmlFor={`step-amount-${index}`}
                          className={labelClass}
                        >
                          Amount <span className="text-blue-600">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                            ₹
                          </span>
                          <input
                            id={`step-amount-${index}`}
                            className={`${inputClass} pl-8`}
                            type="number"
                            required
                            min="1"
                            step="0.01"
                            value={milestone.amount}
                            onChange={(event) =>
                              updateMilestone(
                                index,
                                'amount',
                                event.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={addMilestone}
                  disabled={milestones.length >= 5}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="text-lg leading-none">+</span>
                  Add milestone
                </button>
                <span className="text-[10px] text-slate-400">
                  Minimum 2 · Maximum 5
                </span>
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-100 font-bold">
                !
              </span>
              {error}
            </div>
          )}

          <section
            id="project-review"
            className="overflow-hidden rounded-2xl border border-[#0B1733] bg-[#0B1733] p-5 text-white shadow-lg shadow-blue-950/10 sm:p-7"
          >
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <span className="text-xs font-semibold text-blue-200/70">
                  TOTAL PROJECT VALUE
                </span>
                <strong className="mt-1 block text-3xl font-extrabold tracking-tight text-[#FFB800]">
                  {formatMoney(rupeesToPaise(totalRupees))}
                </strong>
                <span className="mt-2 block text-[10px] text-blue-100/50">
                  Calculated from your milestone amounts
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#FFB800] px-6 py-3 text-sm font-extrabold text-[#0B1733] shadow-lg shadow-black/10 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1733]/30 border-t-[#0B1733]" />
                    Creating project...
                  </>
                ) : (
                  <>
                    Create project
                    <span className="text-lg">→</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </main>

        <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6">
          <section className="overflow-hidden rounded-2xl bg-[#0B1733] text-white shadow-lg shadow-blue-950/10">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold tracking-[1.5px] text-blue-200/60">
                    LIVE OVERVIEW
                  </span>
                  <h3 className="mt-1 text-base font-bold">
                    Project summary
                  </h3>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-green-400/10 px-2.5 py-1 text-[10px] font-bold text-green-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Live
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <span className="text-[10px] font-semibold text-blue-100/60">
                  Estimated project value
                </span>
                <strong className="mt-2 block break-words text-2xl font-extrabold tracking-tight text-[#FFB800]">
                  {formatMoney(rupeesToPaise(totalRupees))}
                </strong>
                <p className="mt-1 text-[10px] text-blue-100/50">
                  Based on the amounts entered.
                </p>
              </div>

              <div className="mt-5 flex justify-between text-xs">
                <span className="text-blue-100/60">Milestones</span>
                <strong>{milestones.length} steps</strong>
              </div>

              <div className="mt-3 flex justify-between text-xs">
                <span className="text-blue-100/60">Completed details</span>
                <strong>{completedMilestones}/{milestones.length}</strong>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#FFB800] transition-all duration-300"
                  style={{
                    width: `${
                      (completedMilestones / milestones.length) * 100
                    }%`,
                  }}
                />
              </div>

              <div className="my-5 h-px bg-white/10" />

              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100/50">
                Amount breakdown
              </span>

              <div className="mt-4 space-y-4">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex min-w-0 items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/10 text-[9px] font-bold text-blue-200">
                        {index + 1}
                      </span>
                      <span className="truncate text-[11px] text-blue-100/80">
                        {milestone.title.trim() ||
                          `Milestone ${index + 1}`}
                      </span>
                    </div>
                    <strong className="shrink-0 text-[11px] text-white">
                      {milestone.amount
                        ? formatMoney(rupeesToPaise(milestone.amount))
                        : '—'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
            <div className="border-b border-amber-200 bg-amber-100/70 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFB800] text-lg text-[#0B1733]">
                  ↗️
                </span>
                <h3 className="text-sm font-extrabold text-[#0B1733]">
                  What happens next?
                </h3>
              </div>
            </div>

            <ol className="space-y-5 p-5">
              {[
                {
                  title: 'Publish your project',
                  description:
                    'Your project becomes available for a contractor to accept.',
                },
                {
                  title: 'Contractor accepts',
                  description:
                    'Both sides work from the same agreed milestone list.',
                },
                {
                  title: 'Review and release',
                  description:
                    'Review submitted proof before approving each milestone.',
                },
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-amber-300 bg-white text-[11px] font-extrabold text-amber-700">
                    {index + 1}
                  </span>
                  <div>
                    <strong className="block text-xs font-bold text-[#0B1733]">
                      {step.title}
                    </strong>
                    <p className="mt-1 text-[10px] leading-5 text-amber-900/65">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
              i
            </span>
            <p className="text-[10px] leading-5 text-blue-900/70">
              <strong className="block font-bold text-blue-900">
                Demo environment
              </strong>
              This is a simulation. No payment gateway is connected and
              no real money moves.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}