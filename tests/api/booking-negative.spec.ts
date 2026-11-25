import { test, expect, knownBug } from '../../fixtures/test';
import { apiAdmin, buildBooking, uniqueName } from '../../test-data/booking';

// The docs only say a token is required; they name no status code, so 401 and 403 both count as a refusal.
const REFUSED = [401, 403];

const badTokens: { title: string; token: string | undefined }[] = [
  { title: 'without a token', token: undefined },
  { title: 'with an invalid token', token: 'invalid-token' },
];

for (const { title, token } of badTokens) {
  test(`API-N1: update and delete ${title} are refused and change nothing`, async ({
    bookingClient,
    existingBooking,
  }) => {
    const { id, data } = existingBooking;

    await test.step('PUT is refused and the booking is unchanged', async () => {
      const response = await bookingClient.update(id, buildBooking({ lastname: 'Hacked' }), token);
      expect(REFUSED).toContain(response.status());

      const current = await bookingClient.get(id);
      expect(await current.json()).toEqual(data);
    });

    await test.step('DELETE is refused and the booking still exists', async () => {
      const response = await bookingClient.delete(id, token);
      expect(REFUSED).toContain(response.status());

      const current = await bookingClient.get(id);
      expect(current.status()).toBe(200);
    });
  });
}

test('API-N2: create booking without required fields is rejected as a client error', async ({
  bookingClient,
  trackBooking,
}) => {
  knownBug('BUG-003', 'POST /booking without required fields returns 500 instead of 4xx');

  const firstname = uniqueName();
  const response = await bookingClient.create({ firstname });

  await test.step('no booking is created', async () => {
    const ids = await bookingClient.findIdsByFirstName(firstname);
    ids.forEach(trackBooking);
    expect(ids).toEqual([]);
  });

  await test.step('response is a 4xx client error', async () => {
    // Docs mark all fields as required; RFC 9110 reserves 5xx for server failures, 4xx for bad requests.
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

test('API-N3: auth with a wrong password does not issue a token', async ({ bookingClient }) => {
  const response = await bookingClient.auth({ ...apiAdmin, password: 'wrong-password' });
  const body = (await response.json()) as Record<string, unknown>;

  // Contract (docs): a token is issued only for valid credentials.
  expect(body).not.toHaveProperty('token');

  // Not documented, observed behaviour: with status 200 (OBS-03) the only sign of refusal
  // is a "reason" field, so check one is present without pinning its exact text.
  expect(typeof body.reason).toBe('string');
  expect(body.reason).not.toBe('');
});
