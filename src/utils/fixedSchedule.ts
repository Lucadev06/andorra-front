const buildRange = (start: string, end: string, stepMinutes = 30): string[] => {
  const slots: string[] = [];
  let [hour, minute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  while (hour < endHour || (hour === endHour && minute <= endMinute)) {
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    minute += stepMinutes;
    if (minute >= 60) {
      hour += Math.floor(minute / 60);
      minute %= 60;
    }
  }

  return slots;
};

const normalizeTime = (time: string): string => {
  const [rawHour, rawMinute] = time.split(':');
  const hour = Number(rawHour);
  const minute = rawMinute === undefined ? 0 : Number(rawMinute);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const SLOTS_BY_DAY: Record<number, string[]> = {
  0: [],
  1: buildRange('10:00', '16:00'),
  2: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
  3: ['10:00', '13:00', '13:30', '14:00', '14:30', '15:00', '18:00', '19:30'],
  4: ['10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00', '17:00', '17:30', '19:30'],
  5: ['10:30', '11:00'],
  6: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '18:30'],
};

export const MAX_ADVANCE_BOOKING_DAYS = 14;

export const getFixedSlotsByDate = (date: Date): string[] => SLOTS_BY_DAY[date.getDay()] ?? [];

export const isTimeAllowedForDate = (date: Date, time: string): boolean => {
  return getFixedSlotsByDate(date).includes(normalizeTime(time));
};

// Regla correcta: se puede reservar hoy o más cerca; solo se impide reservar a MÁS de 14 días.
export const isDateWithinAdvanceBookingWindow = (date: Date, maxDays = MAX_ADVANCE_BOOKING_DAYS): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const differenceMs = target.getTime() - today.getTime();
  const differenceDays = differenceMs / (1000 * 60 * 60 * 24);

  return differenceDays >= 0 && differenceDays <= maxDays;
};
