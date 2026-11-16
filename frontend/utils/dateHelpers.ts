export function toLocalDateStr(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getTodayLocalDateStr(): string {
  return toLocalDateStr(new Date());
}

export function parseQueueDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const str = String(value);
  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getQueueLocalDateStr(queue: {
  requestDate?: string | Date | null;
  createdAt?: string | Date | null;
}): string {
  const date = parseQueueDate(queue.requestDate) ?? parseQueueDate(queue.createdAt);
  return date ? toLocalDateStr(date) : '';
}
