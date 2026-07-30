const ELIGIBILITY_GAP_DAYS = 90; // standard whole-blood donation interval

export function sortDonations(donations) {
  return [...donations].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getLastDonation(donations) {
  if (!donations || donations.length === 0) return null;
  return sortDonations(donations)[0];
}

export function getNextEligibleDate(lastDonationDate) {
  if (!lastDonationDate) return null;
  const next = new Date(lastDonationDate);
  next.setDate(next.getDate() + ELIGIBILITY_GAP_DAYS);
  return next;
}

export function getCountdown(lastDonationDate) {
  const nextDate = getNextEligibleDate(lastDonationDate);
  if (!nextDate) return { eligible: true, daysLeft: 0, nextDate: null };
  const diffMs = nextDate - new Date();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { eligible: daysLeft <= 0, daysLeft: Math.max(daysLeft, 0), nextDate };
}