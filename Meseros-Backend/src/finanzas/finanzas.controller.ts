import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { FinanzasService } from './finanzas.service';

@Controller(['finanzas', 'api/finanzas'])
export class FinanzasController {
  constructor(private readonly finanzas: FinanzasService) {}

  @Get('ventas-hoy')
  ventasHoy(@Req() req: RequestWithTenant) {
    return this.finanzas.ventasHoy(req.restaurantId!);
  }

  @Get('propinas')
  propinas(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.finanzas.propinasPorMeseroYRango(req.restaurantId!, query);
  }

  @Get('balance-hoy')
  balanceHoy(@Req() req: RequestWithTenant) {
    return this.finanzas.balanceHoy(req.restaurantId!);
  }

  @Get('ticket-promedio-hoy')
  ticketPromedioHoy(@Req() req: RequestWithTenant) {
    return this.finanzas.ticketPromedioHoy(req.restaurantId!);
  }

  @Get('variacion-ventas-dia')
  variacionVentasDia(@Req() req: RequestWithTenant) {
    return this.finanzas.variacionVentasDia(req.restaurantId!);
  }

  @Get('top-productos')
  topProductos(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.finanzas.topProductos(req.restaurantId!, query);
  }

  @Get('egresos-categorias-hoy')
  egresosCategoriasHoy(@Req() req: RequestWithTenant) {
    return this.finanzas.egresosCategoriasHoy(req.restaurantId!);
  }

  @Get('ventas-por-producto')
  ventasPorProducto(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.finanzas.ventasPorProducto(req.restaurantId!, query);
  }

  @Get('egresos')
  egresos(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.finanzas.egresosListar(req.restaurantId!, query);
  }

  @Post('egresos')
  crearEgreso(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.finanzas.egresoCrear(req.restaurantId!, req.userId, body);
  }

  @Put('egresos/:id')
  actualizarEgreso(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.finanzas.egresoActualizar(req.restaurantId!, id, body);
  }

  @Delete('egresos/:id')
  eliminarEgreso(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.finanzas.egresoEliminar(req.restaurantId!, id);
  }

  @Get('egresos-categorias')
  egresosCategorias(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.finanzas.egresosCategorias(req.restaurantId!, query);
  }

  @Get('meta-hoy')
  metaHoy(@Req() req: RequestWithTenant) {
    return this.finanzas.metaHoy(req.restaurantId!);
  }

  @Get('evolucion-ventas')
  evolucionVentas(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.finanzas.evolucionVentas(req.restaurantId!, query);
  }
}
