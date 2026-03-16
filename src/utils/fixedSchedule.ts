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
  1: ['16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
  2: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'],
  3: ['10:30', '11:00', '11:30', '12:00', '12:30', '15:30', '16:00', '16:30', '17:00', '17:30', '18:30', '19:00'],
  4: ['11:30', '12:00', '12:30', '15:30', '16:00', '16:30', '18:00', '18:30', '19:00'],
  5: ['10:30', '11:00'],
  6: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '16:00', '16:30', '17:00', '17:30', '18:00', '19:00', '19:30'],
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
