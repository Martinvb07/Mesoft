import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { RequestWithTenant } from '../common/types/request-with-tenant';
import { ProductosService } from './productos.service';

@Controller(['productos', 'api/productos'])
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Get()
  listarProductos(@Req() req: RequestWithTenant, @Query() query: any) {
    return this.productos.listarProductos(req.restaurantId!, query);
  }

  @Post()
  crearProducto(@Req() req: RequestWithTenant, @Body() body: any) {
    return this.productos.crearProducto(req.restaurantId!, body);
  }

  @Post('import-csv')
  importarCSV(@Req() req: RequestWithTenant, @Body() body: any) {
    const rows = Array.isArray(body) ? body : body?.rows;
    return this.productos.importarCSV(req.restaurantId!, rows || []);
  }

  @Put(':id')
  actualizarProducto(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    return this.productos.actualizarProducto(req.restaurantId!, id, body);
  }

  @Delete(':id')
  eliminarProducto(@Req() req: RequestWithTenant, @Param('id') id: string) {
    return this.productos.eliminarProducto(req.restaurantId!, id);
  }
}
