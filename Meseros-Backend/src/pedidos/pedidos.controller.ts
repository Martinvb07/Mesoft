import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { PedidosService } from './pedidos.service';

@Controller(['pedidos', 'api/pedidos'])
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Get('en-curso')
  listarEnCurso(@Req() req: RequestWithTenant) {
    return this.pedidos.listarEnCurso(req.restaurantId!);
  }

  @Get('en-curso/mi')
  enCursoMi(@Req() req: RequestWithTenant) {
    return this.pedidos.enCursoDelMeseroActual(req.restaurantId!, req.userId);
  }

  @Get('facturas')
  facturas(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.pedidos.listarFacturas(req.restaurantId!, query);
  }

  @Get(':id')
  obtenerPedido(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.pedidos.obtenerPedido(req.restaurantId!, id);
  }

  @Get(':id/items')
  listarItems(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.pedidos.listarItems(req.restaurantId!, id);
  }

  @Post(':id/items')
  agregarItem(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.pedidos.agregarItem(req.restaurantId!, id, body);
  }

  @Delete(':id/items/:itemId')
  eliminarItem(@Req() req: RequestWithTenant, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.pedidos.eliminarItem(req.restaurantId!, id, itemId);
  }

  @Post(':id/cerrar')
  cerrarPedido(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.pedidos.cerrarPedido(req.restaurantId!, id);
  }

  @Post(':id/pagar')
  pagar(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.pedidos.registrarPago(req.restaurantId!, id, body, req.userId);
  }

  @Patch(':id/items/:itemId/listo')
  marcarItemListo(
    @Req() req: RequestWithTenant,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    return this.pedidos.marcarItemListo(req.restaurantId!, id, itemId, body?.listo ?? true);
  }
}
