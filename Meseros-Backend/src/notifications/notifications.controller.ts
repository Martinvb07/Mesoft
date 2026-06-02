import { Body, Controller, Delete, Post, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { NotificationsService } from './notifications.service';

@Controller(['notifications', 'api/notifications'])
export class NotificationsController {
  constructor(private readonly notif: NotificationsService) {}

  @Post('register')
  register(@Req() req: RequestWithTenant, @Body() body: any) {
    const { token } = body || {};
    if (!token || !req.restaurantId) return { ok: false };
    this.notif.registerToken(req.restaurantId, token);
    return { ok: true };
  }

  @Delete('unregister')
  unregister(@Req() req: RequestWithTenant, @Body() body: any) {
    const { token } = body || {};
    if (!token || !req.restaurantId) return { ok: false };
    this.notif.removeToken(req.restaurantId, token);
    return { ok: true };
  }
}
