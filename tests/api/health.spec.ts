import { test, expect } from '@playwright/test';

// restful-booker documents 201 Created for its health check
test('GET /ping reports the service is up', async ({ request }) => {
  const response = await request.get('/ping');
  expect(response.status()).toBe(201);
});
