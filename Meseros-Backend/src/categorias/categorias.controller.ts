import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { CategoriasService } from './categorias.service';

@Controller(['categorias', 'api/categorias'])
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Get()
  listar(@Req() req: RequestWithTenant, @Query('activas') activas?: string) {
    return this.categorias.listar(req.restaurantId!, activas === '1' || activas === 'true');
  }

  @Post()
  crear(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.categorias.crear(req.restaurantId!, body);
  }

  @Put('orden')
  reordenar(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.categorias.reordenar(req.restaurantId!, body?.ids);
  }

  @Put(':id')
  actualizar(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.categorias.actualizar(req.restaurantId!, id, body);
  }

  @Delete(':id')
  eliminar(@Req() req: RequestWithTenant, @Param('id') id: string, @Query('reasignar') reasignar?: string) {
    return this.categorias.eliminar(req.restaurantId!, id, reasignar);
  }
}
