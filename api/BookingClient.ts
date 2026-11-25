import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking, Credentials } from '../test-data/booking';

/**
 * Thin wrapper over restful-booker endpoints. Methods return the raw APIResponse,
 * so tests assert status codes and bodies themselves.
 * Auth uses the Cookie "token=<token>" header, as documented for PUT and DELETE.
 */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  auth(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('/auth', { data: credentials });
  }

  async createToken(credentials: Credentials): Promise<string> {
    const response = await this.auth(credentials);
    const body: unknown = await response.json();
    if (!response.ok() || !isTokenBody(body)) {
      throw new Error(`Could not get a token: ${response.status()} ${JSON.stringify(body)}`);
    }
    return body.token;
  }

  create(booking: Partial<Booking>): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  /** Booking ids filtered by first name (GET /booking?firstname=...). */
  async findIdsByFirstName(firstname: string): Promise<number[]> {
    const response = await this.request.get('/booking', { params: { firstname } });
    const body = (await response.json()) as { bookingid: number }[];
    return body.map((item) => item.bookingid);
  }

  update(id: number, booking: Booking, token?: string): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: authHeaders(token) });
  }

  delete(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: authHeaders(token) });
  }
}

function authHeaders(token?: string): Record<string, string> {
  return token === undefined ? {} : { Cookie: `token=${token}` };
}

function isTokenBody(body: unknown): body is { token: string } {
  return typeof body === 'object' && body !== null && typeof (body as { token?: unknown }).token === 'string';
}
