import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Proveedor } from '../common/db/schemas/proveedor.schema';
import type { RequestWithTenant } from '../common/types/request-with-tenant';

@Controller(['proveedores', 'api/proveedores'])
export class ProveedoresController {
  constructor(
    @InjectModel(Proveedor.name) private readonly proveedores: Model<Proveedor>,
    private readonly ids: IdService,
  ) {}

  @Get()
  listar(@Req() req: RequestWithTenant) {
    return this.proveedores
      .find({ restaurant_id: req.restaurantId! }, { _id: 0, __v: 0 })
      .sort({ nombre: 1 })
      .lean()
      .exec();
  }

  @Post()
  async crear(@Req() req: RequestWithTenant, @Body() body: any) {
    const id = await this.ids.next('proveedores');
    await this.proveedores.create({ ...body, id, restaurant_id: req.restaurantId! });
    return { ok: true, id };
  }

  @Put(':id')
  async actualizar(@Req() req: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
    const { nombre, contacto, telefono, email, direccion, productos_ids } = body || {};
    const $set: any = {};
    if (nombre) $set.nombre = nombre;
    if (contacto !== undefined) $set.contacto = contacto;
    if (telefono !== undefined) $set.telefono = telefono;
    if (email !== undefined) $set.email = email;
    if (direccion !== undefined) $set.direccion = direccion;
    if (productos_ids !== undefined) $set.productos_ids = productos_ids;
    await this.proveedores.updateOne({ id: Number(id), restaurant_id: req.restaurantId! }, { $set }).exec();
    return { ok: true };
  }

  @Delete(':id')
  async eliminar(@Req() req: RequestWithTenant, @Param('id') id: string) {
    await this.proveedores.deleteOne({ id: Number(id), restaurant_id: req.restaurantId! }).exec();
    return { ok: true };
  }
}
