import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Mesa } from '../common/db/schemas/mesa.schema';
import { Mesero } from '../common/db/schemas/mesero.schema';
import { Pedido } from '../common/db/schemas/pedido.schema';

@Injectable()
export class MesasService {
  constructor(
    @InjectModel(Mesa.name) private readonly mesas: Model<Mesa>,
    @InjectModel(Pedido.name) private readonly pedidos: Model<Pedido>,
    @InjectModel(Mesero.name) private readonly meseros: Model<Mesero>,
    private readonly ids: IdService,
  ) {}

  async listarMesas(restaurantId: number) {
    const rows = await this.mesas
      .aggregate([
        { $match: { restaurant_id: restaurantId } },
        {
          $lookup: {
            from: 'pedidos',
            let: { mesaId: '$id', rid: '$restaurant_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$mesa_id', '$$mesaId'] },
                      { $eq: ['$restaurant_id', '$$rid'] },
                      { $in: ['$estado', ['en proceso', 'entregado']] },
                    ],
                  },
                },
              },
              { $sort: { fecha_hora: -1 } },
              { $limit: 1 },
              { $project: { _id: 0, mesero_id: 1 } },
            ],
            as: 'pedido_open',
          },
        },
        { $unwind: { path: '$pedido_open', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'meseros',
            localField: 'pedido_open.mesero_id',
            foreignField: 'id',
            as: 'mesero',
          },
        },
        { $unwind: { path: '$mesero', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            mesero_id: '$pedido_open.mesero_id',
            mesero_nombre: '$mesero.nombre',
          },
        },
        { $project: { _id: 0, __v: 0, pedido_open: 0, mesero: 0 } },
        { $sort: { numero: 1 } },
      ])
      .exec();

    return rows;
  }

  async listarMisMesas(restaurantId: number, userId: number) {
    const mesero = await this.meseros
      .findOne({ usuario_id: userId, restaurant_id: restaurantId }, { _id: 0, id: 1, nombre: 1 })
      .lean<{ id: number; nombre: string }>()
      .exec();
    if (!mesero) return [];

    const pedidos = await this.pedidos
      .find(
        { restaurant_id: restaurantId, mesero_id: mesero.id, estado: { $in: ['en proceso', 'entregado'] } },
        { _id: 0, mesa_id: 1 },
      )
      .lean<{ mesa_id: number }[]>()
      .exec();
    const mesaIds = Array.from(new Set((pedidos || []).map((p) => Number((p as any).mesa_id)).filter(Boolean)));
    if (!mesaIds.length) return [];

    const mesas = await this.mesas
      .find({ restaurant_id: restaurantId, id: { $in: mesaIds } }, { _id: 0, __v: 0 })
      .sort({ numero: 1 })
      .lean<any[]>()
      .exec();
    return mesas.map((m) => ({ ...m, mesero_nombre: mesero.nombre }));
  }

  async crearMesa(restaurantId: number, body: any) {
    const { numero, capacidad = 4, estado = 'libre' } = body || {};
    if (numero == null || numero === '') {
      throw new HttpException({ error: 'numero requerido' }, HttpStatus.BAD_REQUEST);
    }
    const cap = Number(capacidad) || 1;
    const est = String(estado || 'libre').toLowerCase();
    const id = await this.ids.next('mesas');
    try {
      await this.mesas.create({ id, numero: Number(numero), capacidad: cap, estado: est, restaurant_id: restaurantId });
      return { ok: true, id };
    } catch (err: any) {
      if (String(err?.code || '') === '11000') {
        throw new HttpException({ error: 'Número de mesa ya existe' }, HttpStatus.CONFLICT);
      }
      throw new HttpException({ error: err?.message || 'DB error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async actualizarMesa(restaurantId: number, id: string, body: any) {
    const { numero, capacidad, estado, mesero_id } = body || {};
    const $set: any = {};
    if (numero !== undefined) $set.numero = Number(numero);
    if (capacidad !== undefined) $set.capacidad = Number(capacidad) || 1;
    if (estado !== undefined) $set.estado = String(estado);
    if (mesero_id !== undefined) $set.mesero_id = mesero_id || null;
    if (!Object.keys($set).length) {
      throw new HttpException({ error: 'Nada para actualizar' }, HttpStatus.BAD_REQUEST);
    }
    const result = await this.mesas.updateOne({ id: Number(id), restaurant_id: restaurantId }, { $set }).exec();
    return { ok: true, affectedRows: Number(result.modifiedCount || 0) };
  }

  async eliminarMesa(restaurantId: number, id: string) {
    const result = await this.mesas.deleteOne({ id: Number(id), restaurant_id: restaurantId }).exec();
    return { ok: true, affectedRows: Number(result.deletedCount || 0) };
  }

  async obtenerPedidoAbiertoDeMesa(restaurantId: number, mesaId: string) {
    const pedido = await this.pedidos
      .findOne(
        { mesa_id: Number(mesaId), estado: { $in: ['en proceso', 'entregado'] }, restaurant_id: restaurantId },
        { _id: 0, __v: 0 },
      )
      .sort({ fecha_hora: -1 })
      .lean<any>()
      .exec();
    if (!pedido) return null;

    let mesero_nombre: string | null = null;
    if (pedido.mesero_id) {
      const me = await this.meseros
        .findOne({ id: Number(pedido.mesero_id) }, { _id: 0, nombre: 1 })
        .lean<{ nombre: string }>()
        .exec();
      mesero_nombre = me?.nombre ?? null;
    }
    return { ...pedido, mesero_nombre };
  }

  async asignarMesa(restaurantId: number, mesaId: string, body: any, userId?: number) {
    const { mesero_id, usuario_id } = body || {};

    const resolveMeseroId = async (): Promise<number | null> => {
      if (mesero_id) return Number(mesero_id);
      const uid = usuario_id || userId || null;
      if (uid) {
        const r = await this.meseros.findOne({ usuario_id: Number(uid) }, { _id: 0, id: 1 }).lean<{ id: number }>().exec();
        return r?.id ?? null;
      }
      return null;
    };

    const meseroId = await resolveMeseroId();

    // Cambia estado a 'ocupada' y abre pedido si no hay
    await this.mesas.updateOne({ id: Number(mesaId), restaurant_id: restaurantId }, { $set: { estado: 'ocupada' } }).exec();

    const pedido = await this.pedidos
      .findOne(
        { mesa_id: Number(mesaId), restaurant_id: restaurantId, estado: { $in: ['en proceso', 'entregado'] } },
        { _id: 0, id: 1, mesero_id: 1 },
      )
      .sort({ fecha_hora: -1 })
      .lean<{ id: number; mesero_id?: number | null }>()
      .exec();

    if (pedido) {
      if (meseroId && pedido.mesero_id && Number(pedido.mesero_id) !== Number(meseroId)) {
        throw new HttpException(
          { ok: false, code: 'MESA_OCUPADA', message: 'Mesa ya asignada a otro mesero.' },
          HttpStatus.CONFLICT,
        );
      }
      if (meseroId && !pedido.mesero_id) {
        await this.pedidos.updateOne({ id: pedido.id }, { $set: { mesero_id: meseroId } }).exec();
      }
      return { ok: true, pedido_id: pedido.id };
    }

    const newId = await this.ids.next('pedidos');
    await this.pedidos.create({
      id: newId,
      mesa_id: Number(mesaId),
      mesero_id: meseroId || null,
      restaurant_id: restaurantId,
      fecha_hora: new Date(),
      estado: 'en proceso',
      total: 0,
    });
    return { ok: true, pedido_id: newId };
  }

  async liberarMesa(restaurantId: number, mesaId: string) {
    const result = await this.mesas.updateOne({ id: Number(mesaId), restaurant_id: restaurantId }, { $set: { estado: 'libre' } }).exec();
    return { ok: true, affectedRows: Number(result.modifiedCount || 0) };
  }

  async ponerMesaEnLimpieza(restaurantId: number, mesaId: string) {
    const result = await this.mesas.updateOne({ id: Number(mesaId), restaurant_id: restaurantId }, { $set: { estado: 'limpieza' } }).exec();
    return { ok: true, affectedRows: Number(result.modifiedCount || 0) };
  }

  async finalizarLimpieza(restaurantId: number, mesaId: string) {
    const result = await this.mesas.updateOne({ id: Number(mesaId), restaurant_id: restaurantId }, { $set: { estado: 'libre' } }).exec();
    return { ok: true, affectedRows: Number(result.modifiedCount || 0) };
  }

  async reservarMesa(restaurantId: number, id: string, body: any) {
    const { reserva_at, reservado_por, telefono } = body || {};
    if (!reserva_at) {
      throw new HttpException({ error: 'reserva_at requerido (YYYY-MM-DD HH:mm:ss)' }, HttpStatus.BAD_REQUEST);
    }
    const dt = new Date(reserva_at);
    const result = await this.mesas
      .updateOne(
        { id: Number(id), restaurant_id: restaurantId },
        {
          $set: {
            estado: 'reservada',
            reserva_at: isNaN(dt.getTime()) ? null : dt,
            reservado_por: reservado_por || null,
            telefono_reserva: telefono || null,
          },
        },
      )
      .exec();
    return { ok: true, affectedRows: Number(result.modifiedCount || 0) };
  }

  async cancelarReservaMesa(restaurantId: number, id: string) {
    const result = await this.mesas
      .updateOne(
        { id: Number(id), restaurant_id: restaurantId },
        { $set: { estado: 'libre', reserva_at: null, reservado_por: null, telefono_reserva: null } },
      )
      .exec();
    return { ok: true, affectedRows: Number(result.modifiedCount || 0) };
  }
}
