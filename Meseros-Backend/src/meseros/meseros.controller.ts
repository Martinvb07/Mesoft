import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { MeserosService } from './meseros.service';

@Controller(['meseros', 'api/meseros'])
export class MeserosController {
  constructor(private readonly meseros: MeserosService) {}

  @Get()
  listarMeseros(@Req() req: RequestWithTenant) {
    return this.meseros.listarMeseros(req.restaurantId!);
  }

  @Get('me')
  obtenerMiPerfilMesero(@Req() req: RequestWithTenant) {
    return this.meseros.obtenerMiPerfilMesero(req.restaurantId!, req.userId!);
  }

  @Post()
  @Roles('admin')
  crearMesero(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.meseros.crearMesero(req.restaurantId!, body);
  }

  @Put(':id')
  @Roles('admin')
  actualizarMesero(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.meseros.actualizarMesero(req.restaurantId!, id, body);
  }

  @Delete(':id')
  @Roles('admin')
  eliminarMesero(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.meseros.eliminarMesero(req.restaurantId!, id);
  }

  @Post('checkin')
  checkin(@Req() req: RequestWithTenant) {
    return this.meseros.checkin(req.restaurantId!, req.userId!);
  }

  @Post('checkout')
  checkout(@Req() req: RequestWithTenant) {
    return this.meseros.checkout(req.restaurantId!, req.userId!);
  }
}
