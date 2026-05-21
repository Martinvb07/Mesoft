import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { NominaService } from './nomina.service';

@Controller(['nomina', 'api/nomina'])
export class NominaController {
  constructor(private readonly nomina: NominaService) {}

  @Get('movimientos')
  listarMovimientos(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.nomina.listarMovimientos(req.restaurantId!, query);
  }

  @Post('movimientos')
  crearMovimiento(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.nomina.crearMovimiento(req.restaurantId!, body);
  }

  @Delete('movimientos/:id')
  eliminarMovimiento(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.nomina.eliminarMovimiento(req.restaurantId!, id);
  }

  @Post('pago')
  marcarPago(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.nomina.marcarPago(req.restaurantId!, body);
  }

  @Get('resumen')
  resumenMesero(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.nomina.resumenMesero(req.restaurantId!, query, req.userId);
  }
}
