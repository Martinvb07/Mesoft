import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
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
  crearMesero(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.meseros.crearMesero(req.restaurantId!, body);
  }

  @Put(':id')
  actualizarMesero(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.meseros.actualizarMesero(req.restaurantId!, id, body);
  }

  @Delete(':id')
  eliminarMesero(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.meseros.eliminarMesero(req.restaurantId!, id);
  }
}
