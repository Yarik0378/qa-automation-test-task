import { test, expect } from '../../fixtures/test';
import { apiAdmin, buildBooking } from '../../test-data/booking';

test('API-01: booking CRUD flow - auth, create, update, delete, verify it is gone', async ({
  bookingClient,
  trackBooking,
}) => {
  const original = buildBooking();
  const updated = buildBooking({
    firstname: original.firstname,
    lastname: 'Updated',
    totalprice: 222,
    depositpaid: false,
    bookingdates: { checkin: '2026-12-02', checkout: '2026-12-06' },
    additionalneeds: 'Dinner',
  });

  const token = await test.step('POST /auth returns a token', async () => {
    const response = await bookingClient.auth(apiAdmin);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { token?: unknown };
    expect(typeof body.token).toBe('string');
    expect(body.token).not.toBe('');
    return body.token as string;
  });

  const id = await test.step('POST /booking creates the booking', async () => {
    const response = await bookingClient.create(original);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { bookingid: unknown; booking: unknown };
    expect(typeof body.bookingid).toBe('number');
    const bookingid = body.bookingid as number;
    // Register for cleanup before further asserts, so a failing check does not leave the booking behind.
    trackBooking(bookingid);
    expect(body.booking).toEqual(original);
    return bookingid;
  });

  await test.step('GET /booking?firstname= finds the created booking', async () => {
    // Positive control for the lookup API-N2 relies on to prove "no booking was created".
    expect(await bookingClient.findIdsByFirstName(original.firstname)).toContain(id);
  });

  await test.step('GET /booking/:id returns the created data', async () => {
    const response = await bookingClient.get(id);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(original);
  });

  await test.step('PUT /booking/:id with token updates the booking', async () => {
    const response = await bookingClient.update(id, updated, token);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(updated);
  });

  await test.step('GET /booking/:id shows the update was saved', async () => {
    const response = await bookingClient.get(id);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(updated);
  });

  await test.step('DELETE /booking/:id with token deletes the booking', async () => {
    const response = await bookingClient.delete(id, token);
    // The API docs show "HTTP/1.1 201 Created" for DeleteBooking (see README, OBS-04).
    expect(response.status()).toBe(201);
  });

  await test.step('GET /booking/:id returns 404 after deletion', async () => {
    const response = await bookingClient.get(id);
    // Not documented; 404 Not Found per HTTP semantics (RFC 9110, section 15.5.5).
    expect(response.status()).toBe(404);
  });
});
