import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { RestaurantesService } from './restaurantes.service';

@Controller(['restaurantes', 'api/restaurantes'])
export class RestaurantesController {
  constructor(private readonly restaurantes: RestaurantesService) {}

  @Get('me')
  getMe(@Req() req: RequestWithTenant) {
    return this.restaurantes.getMe(req.restaurantId!);
  }

  @Put('me')
  updateMe(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.restaurantes.updateMe(req.restaurantId!, body);
  }
}
