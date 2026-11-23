// Cairo-timezone (Africa/Cairo) date & slot utilities shared across API & UI

export interface CairoNowInfo {
  dateStr: string; // YYYY-MM-DD
  hours24: number;
  minutes: number;
  minutesSinceMidnight: number;
  totalMinutes: number; // monotonic pseudo-UTC minute index for Cairo wall-clock
}

export function getCairoNow(now: Date = new Date()): CairoNowInfo {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hours24 = get("hour");
  if (hours24 === 24) hours24 = 0;
  const minutes = get("minute");

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const minutesSinceMidnight = hours24 * 60 + minutes;
  const totalMinutes = Math.floor(Date.UTC(year, month - 1, day, hours24, minutes) / 60000);

  return { dateStr, hours24, minutes, minutesSinceMidnight, totalMinutes };
}

export function parseTimeSlotTo24h(timeSlot?: string | null): { hours24: number; minutes: number } | null {
  if (!timeSlot) return null;
  const raw = timeSlot.trim().toUpperCase();
  // Match formats like "06:30 PM", "6:30 PM", "18:30", "06:30 م", "01:00 ص"
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|ص|م)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = (match[3] || "").toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) return null;

  if (period === "PM" || period === "م") {
    if (hours < 12) hours += 12;
  } else if (period === "AM" || period === "ص") {
    if (hours === 12) hours = 0;
  }

  return { hours24: hours, minutes };
}

export function getBookingEpochMinutes(bookingDate?: string | null, timeSlot?: string | null): number | null {
  if (!bookingDate) return null;
  const dateMatch = bookingDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const parsedTime = parseTimeSlotTo24h(timeSlot);
  if (!parsedTime) return null;

  return Math.floor(Date.UTC(year, month - 1, day, parsedTime.hours24, parsedTime.minutes) / 60000);
}

export function computeBookingTiming(
  bookingDate: string,
  timeSlot: string,
  reminderLeadMinutes = 15,
  now: Date = new Date()
) {
  const cairoNow = getCairoNow(now);
  const bookingMinutes = getBookingEpochMinutes(bookingDate, timeSlot);
  if (bookingMinutes === null) {
    return {
      cairoToday: cairoNow.dateStr,
      diffMinutes: null as number | null,
      isUpcoming15Min: false,
      isPastDue5Min: false,
      isPastDay: bookingDate < cairoNow.dateStr,
      isOverdue: bookingDate < cairoNow.dateStr,
    };
  }

  const diffMinutes = bookingMinutes - cairoNow.totalMinutes;
  const isPastDay = bookingDate < cairoNow.dateStr;
  // Reminder window: from reminderLeadMinutes (default 15) down to -5 min
  const isUpcoming15Min = !isPastDay && diffMinutes <= reminderLeadMinutes && diffMinutes >= -5;
  // More than 5 minutes late (either today after 5+ min OR any earlier date)
  const isPastDue5Min = diffMinutes < -5;

  return {
    cairoToday: cairoNow.dateStr,
    diffMinutes,
    isUpcoming15Min,
    isPastDue5Min,
    isPastDay,
    isOverdue: isPastDay || isPastDue5Min,
  };
}
