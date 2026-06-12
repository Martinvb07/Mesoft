import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { MesasService } from './mesas.service';

@Controller(['mesas', 'api/mesas'])
export class MesasController {
  constructor(private readonly mesas: MesasService) {}

  @Get()
  listarMesas(@Req() req: RequestWithTenant) {
    return this.mesas.listarMesas(req.restaurantId!);
  }

  @Get('mias')
  listarMisMesas(@Req() req: RequestWithTenant) {
    if (!req.restaurantId) throw new HttpException({ error: 'restaurantId no resuelto' }, HttpStatus.BAD_REQUEST);
    if (!req.userId) throw new HttpException({ error: 'usuario_id requerido' }, HttpStatus.BAD_REQUEST);
    return this.mesas.listarMisMesas(req.restaurantId, req.userId);
  }

  @Post()
  crearMesa(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.mesas.crearMesa(req.restaurantId!, body);
  }

  @Get(':id/pedido-abierto')
  obtenerPedidoAbiertoDeMesa(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.mesas.obtenerPedidoAbiertoDeMesa(req.restaurantId!, id);
  }

  @Put(':id')
  actualizarMesa(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.mesas.actualizarMesa(req.restaurantId!, id, body);
  }

  @Delete(':id')
  eliminarMesa(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.mesas.eliminarMesa(req.restaurantId!, id);
  }

  @Post(':id/asignar')
  asignarMesa(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.mesas.asignarMesa(req.restaurantId!, id, body, req.userId);
  }

  @Post(':id/liberar')
  liberarMesa(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.mesas.liberarMesa(req.restaurantId!, id);
  }

  @Post(':id/limpieza')
  ponerMesaEnLimpieza(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.mesas.ponerMesaEnLimpieza(req.restaurantId!, id);
  }

  @Post(':id/fin-limpieza')
  finalizarLimpieza(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.mesas.finalizarLimpieza(req.restaurantId!, id);
  }

  @Post(':id/reservar')
  reservarMesa(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.mesas.reservarMesa(req.restaurantId!, id, body);
  }

  @Post(':id/cancelar-reserva')
  cancelarReservaMesa(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.mesas.cancelarReservaMesa(req.restaurantId!, id);
  }
}
