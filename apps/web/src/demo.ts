import { localDate } from '@batchaman/core';

// Fixtures run from 02:00 to shortly after 05:00 WIB. Before 06:00, use
// yesterday so the demo never presents future events as completed records.
export const demoDate = (now: string) =>
  localDate(new Date(Date.parse(now) - 6 * 3600000).toISOString(), 'Asia/Jakarta');
