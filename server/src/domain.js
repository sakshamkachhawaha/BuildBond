export const PROJECT_STATUS = Object.freeze({
  OPEN: 'OPEN',
  ACTIVE: 'ACTIVE',
  DISPUTED: 'DISPUTED',
  COMPLETED: 'COMPLETED',
});

export const MILESTONE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  REJECTED: 'REJECTED',
  RELEASED: 'RELEASED',
});

export function ledgerSummary(entries) {
  const deposited = entries.filter((entry) => entry.kind === 'DEPOSIT')
    .reduce((total, entry) => total + entry.amount_paise, 0);
  const released = entries.filter((entry) => entry.kind === 'RELEASE')
    .reduce((total, entry) => total + entry.amount_paise, 0);
  return { deposited, released, held: deposited - released };
}

