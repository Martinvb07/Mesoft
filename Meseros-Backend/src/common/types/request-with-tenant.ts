import type { Request } from 'express';
import type { JwtPayload } from '../../auth/jwt-payload';

export type RequestWithTenant = Request & {
  restaurantId?: number;
  userId?: number;
  user?: JwtPayload;
};
