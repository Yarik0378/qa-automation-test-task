export type BookingDates = { checkin: string; checkout: string };

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds: string;
};

export type Credentials = { username: string; password: string };

// Default admin credentials published in the restful-booker API docs.
export const apiAdmin: Credentials = {
  username: process.env.API_USERNAME ?? 'admin',
  password: process.env.API_PASSWORD ?? 'password123',
};

let counter = 0;

/** The API is public and shared, so every booking gets a unique first name. */
export function uniqueName(prefix = 'Qa'): string {
  counter += 1;
  return `${prefix}${Date.now()}${process.pid}${counter}`;
}

export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: uniqueName(),
    lastname: 'Tester',
    totalprice: 111,
    depositpaid: true,
    bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
