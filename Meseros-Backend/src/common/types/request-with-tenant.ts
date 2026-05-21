import type { Request } from 'express';

export type RequestWithTenant = Request & {
  restaurantId?: number;
  userId?: number;
  // optionally: req.user (if you later add auth)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
};
