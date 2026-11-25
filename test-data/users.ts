// Public demo credentials published on the saucedemo login page.
const PASSWORD = 'secret_sauce';

export type User = { username: string; password: string };

export const users = {
  standard: { username: 'standard_user', password: PASSWORD },
  lockedOut: { username: 'locked_out_user', password: PASSWORD },
} satisfies Record<string, User>;
