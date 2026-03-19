const MIN_YEAR = 2000;
const MAX_YEARS_AHEAD = 5;

const getMaxDate = () => {
  const max = new Date();
  max.setFullYear(max.getFullYear() + MAX_YEARS_AHEAD);
  max.setHours(23, 59, 59, 999);
  return max;
};

const isValidDateObject = (date: Date) => !Number.isNaN(date.getTime());

export const validateDateInput = (value: string): string | null => {
  if (!value) return "Date is required";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "Use a valid date format";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  const sameDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day;

  if (!sameDate) return "Enter a real calendar date";
  if (year < MIN_YEAR) return `Date cannot be before ${MIN_YEAR}`;

  const maxDate = getMaxDate();
  if (new Date(year, month - 1, day) > maxDate) {
    return `Date cannot be more than ${MAX_YEARS_AHEAD} years in the future`;
  }

  return null;
};

export const validateOptionalDate = (date?: Date): string | null => {
  if (!date) return null;
  if (!isValidDateObject(date)) return "Enter a valid date";
  if (date.getFullYear() < MIN_YEAR) return `Date cannot be before ${MIN_YEAR}`;
  if (date > getMaxDate()) return `Date cannot be more than ${MAX_YEARS_AHEAD} years in the future`;
  return null;
};
