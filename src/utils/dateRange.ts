export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

export function isAfterDay(a: Date, b: Date) {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

export function isWithinRange(date: Date, start: Date, end: Date | null) {
  const value = startOfDay(date).getTime();
  const from = startOfDay(start).getTime();
  if (!end) {
    return value >= from && value <= endOfDay(new Date()).getTime();
  }
  return value >= from && value <= endOfDay(end).getTime();
}

export interface DateRangeValue {
  start: Date | null;
  end: Date | null;
}

export function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let i = 0; i < startOffset; i += 1) {
    const date = new Date(year, month, i - startOffset + 1);
    cells.push({ date, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]?.date ?? new Date(year, month, daysInMonth);
    const date = new Date(last);
    date.setDate(date.getDate() + 1);
    cells.push({ date, inMonth: false });
  }

  return cells;
}

export function formatPickerDateNumeric(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatPickerDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatPickerMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
