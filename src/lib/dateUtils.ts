import { format, parseISO, formatDistanceToNow, isValid } from "date-fns";

export const safeDate = (input?: string | number | Date | null): Date => {
  if (!input) return new Date();
  if (input instanceof Date) return isValid(input) ? input : new Date();
  if (typeof input === "string") {
    try {
      const parsed = parseISO(input);
      if (isValid(parsed)) return parsed;
      const native = new Date(input);
      return isValid(native) ? native : new Date();
    } catch {
      return new Date();
    }
  }
  const dateFromNum = new Date(input);
  return isValid(dateFromNum) ? dateFromNum : new Date();
};

export const formatDisplayDate = (input?: string | number | Date | null): string => {
  const d = safeDate(input);
  return format(d, "dd-MMM-yyyy");
};

export const formatDisplayDateTime = (input?: string | number | Date | null): string => {
  const d = safeDate(input);
  return format(d, "dd-MMM-yyyy hh:mm a");
};

export const formatInputDate = (input?: string | number | Date | null): string => {
  const d = safeDate(input);
  return format(d, "yyyy-MM-dd");
};

export const formatFinancialYear = (input?: string | number | Date | null): string => {
  const d = safeDate(input);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 4) {
    const nextYearShort = String(year + 1).slice(-2);
    return `FY ${year}-${nextYearShort}`;
  } else {
    const prevYear = year - 1;
    const currYearShort = String(year).slice(-2);
    return `FY ${prevYear}-${currYearShort}`;
  }
};

export const formatRelativeTime = (input?: string | number | Date | null): string => {
  const d = safeDate(input);
  return formatDistanceToNow(d, { addSuffix: true });
};
