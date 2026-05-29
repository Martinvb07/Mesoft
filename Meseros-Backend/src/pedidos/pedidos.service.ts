import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { DetallePedido } from '../common/db/schemas/detallepedido.schema';
import { Mesa } from '../common/db/schemas/mesa.schema';
import { Mesero } from '../common/db/schemas/mesero.schema';
import { MovimientoContable } from '../common/db/schemas/movimiento.schema';
import { Pedido } from '../common/db/schemas/pedido.schema';
import { Producto } from '../common/db/schemas/producto.schema';

const APP_TZ = process.env.APP_TZ || 'America/Bogota';

@Injectable()
export class PedidosService {
  constructor(
    @InjectModel(Pedido.name) private readonly pedidos: Model<Pedido>,
    @InjectModel(DetallePedido.name) private readonly detalle: Model<DetallePedido>,
    @InjectModel(Producto.name) private readonly productos: Model<Producto>,
    @InjectModel(Mesero.name) private readonly meseros: Model<Mesero>,
    @InjectModel(Mesa.name) private readonly mesas: Model<Mesa>,
    @InjectModel(MovimientoContable.name) private readonly contables: Model<MovimientoContable>,
    private readonly ids: IdService,
  ) {}

  private toNumberId(value: unknown, label: string): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new HttpException({ error: `${label} inválido` }, HttpStatus.BAD_REQUEST);
    }
    return n;
  }

  private parseDateRange(query: any): { start?: Date; end?: Date } {
    const { desde, hasta } = query || {};
    let start: Date | undefined;
    let end: Date | undefined;

    if (desde) {
      const dt = DateTime.fromISO(String(desde), { zone: APP_TZ }).startOf('day');
      if (dt.isValid) start = dt.toJSDate();
    }
    if (hasta) {
      const dt = DateTime.fromISO(String(hasta), { zone: APP_TZ }).endOf('day');
      if (dt.isValid) end = dt.toJSDate();
    }
    return { start, end };
  }

  private async recalcPedidoTotal(pedidoId: number) {
    const rows = await this.detalle
      .aggregate<{ total: number }>([
        { $match: { pedido_id: pedidoId } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } },
        { $project: { _id: 0, total: 1 } },
      ])
      .exec();
    const total = Number(rows?.[0]?.total ?? 0);
    await this.pedidos.updateOne({ id: pedidoId }, { $set: { total } }).exec();
    return total;
  }

  async obtenerPedido(rid: number, id: string) {
    const pedidoId = this.toNumberId(id, 'id');
    return (
      (await this.pedidos
        .findOne({ id: pedidoId, restaurant_id: rid }, { _id: 0 })
        .lean()
        .exec()) ?? null
    );
  }

  async listarItems(rid: number, pedidoId: string) {
    const pid = this.toNumberId(pedidoId, 'pedidoId');

    const pedido = await this.pedidos.findOne({ id: pid, restaurant_id: rid }, { _id: 0, id: 1 }).lean().exec();
    if (!pedido) throw new HttpException({ error: 'Pedido no encontrado' }, HttpStatus.NOT_FOUND);

    return this.detalle
      .aggregate([
        { $match: { pedido_id: pid } },
        { $lookup: { from: 'productos', localField: 'producto_id', foreignField: 'id', as: 'producto' } },
        { $unwind: { path: '$producto', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            id: 1,
            pedido_id: 1,
            producto_id: 1,
            cantidad: 1,
            subtotal: 1,
            nota: 1,
            nombre: '$producto.nombre',
            precio: '$producto.precio',
          },
        },
        { $sort: { id: 1 } },
      ])
      .exec();
  }

  async agregarItem(rid: number, pedidoId: string, body: any) {
    const pid = this.toNumberId(pedidoId, 'pedidoId');
    const productoId = this.toNumberId(body?.producto_id, 'producto_id');
    const cant = Number(body?.cantidad ?? 0);

    if (!Number.isFinite(cant) || cant <= 0) {
      throw new HttpException({ error: 'Cantidad inválida' }, HttpStatus.BAD_REQUEST);
    }

    const pedido = await this.pedidos.findOne({ id: pid, restaurant_id: rid }, { _id: 0, id: 1 }).lean().exec();
    if (!pedido) throw new HttpException({ error: 'Pedido no encontrado' }, HttpStatus.NOT_FOUND);

    const producto = await this.productos
      .findOne({ id: productoId, restaurant_id: rid }, { _id: 0, id: 1, nombre: 1, precio: 1, stock: 1, min_stock: 1 })
      .lean()
      .exec();
    if (!producto) throw new HttpException({ error: 'Producto no encontrado' }, HttpStatus.NOT_FOUND);

    const precio = Number(producto?.precio ?? 0);
    const subtotal = precio * cant;

    // Decrementar stock de forma atómica (si el documento tiene stock definido)
    let stockAntes: number | null = null;
    let stockDespues: number | null = null;
    const hasStock = typeof (producto as any).stock === 'number';
    if (hasStock) {
      stockAntes = Number((producto as any).stock ?? 0);
      const res = await this.productos
        .updateOne({ id: productoId, restaurant_id: rid, stock: { $gte: cant } }, { $inc: { stock: -cant } })
        .exec();
      if (!res.modifiedCount) {
        throw new HttpException(
          { error: 'Stock insuficiente', code: 'STOCK_INSUFICIENTE', disponible: stockAntes },
          HttpStatus.CONFLICT,
        );
      }
      stockDespues = stockAntes - cant;
    }

    const nota = body?.nota ? String(body.nota).trim() : null;
    const newId = await this.ids.next('detallepedido');
    await this.detalle.create({
      id: newId,
      pedido_id: pid,
      producto_id: productoId,
      cantidad: cant,
      subtotal,
      ...(nota ? { nota } : {}),
    });

    const total = await this.recalcPedidoTotal(pid);

    let warnings: any = undefined;
    const minStock = (producto as any).min_stock;
    if (hasStock && typeof minStock === 'number' && stockDespues != null && stockDespues <= Number(minStock)) {
      warnings = {
        lowStock: true,
        producto_id: productoId,
        nombre: (producto as any).nombre,
        restante: stockDespues,
        min_stock: Number(minStock),
      };
    }

    return { ok: true, id: newId, total, warnings };
  }

  async eliminarItem(rid: number, pedidoId: string, itemId: string) {
    const pid = this.toNumberId(pedidoId, 'pedidoId');
    const detId = this.toNumberId(itemId, 'itemId');

    const pedido = await this.pedidos.findOne({ id: pid, restaurant_id: rid }, { _id: 0, id: 1 }).lean().exec();
    if (!pedido) throw new HttpException({ error: 'Pedido no encontrado' }, HttpStatus.NOT_FOUND);

    const det = await this.detalle
      .findOne({ id: detId, pedido_id: pid }, { _id: 0, producto_id: 1, cantidad: 1 })
      .lean()
      .exec();
    if (!det) throw new HttpException({ error: 'Item no encontrado' }, HttpStatus.NOT_FOUND);

    await this.detalle.deleteOne({ id: detId, pedido_id: pid }).exec();

    // Devolver stock si existe el campo
    const prod = await this.productos.findOne({ id: Number(det.producto_id), restaurant_id: rid }, { _id: 0, stock: 1 }).lean().exec();
    const hasStock = prod && typeof (prod as any).stock === 'number';
    if (hasStock) {
      await this.productos.updateOne({ id: Number(det.producto_id), restaurant_id: rid }, { $inc: { stock: Number(det.cantidad || 0) } }).exec();
    }

    const total = await this.recalcPedidoTotal(pid);
    return { ok: true, total };
  }

  async cerrarPedido(rid: number, pedidoId: string) {
    const pid = this.toNumberId(pedidoId, 'pedidoId');
    const result = await this.pedidos.updateOne({ id: pid, restaurant_id: rid }, { $set: { estado: 'cerrado' } }).exec();
    if (!result.matchedCount) throw new HttpException({ error: 'Pedido no encontrado' }, HttpStatus.NOT_FOUND);
    return { ok: true };
  }

  async registrarPago(rid: number, pedidoId: string, body: any, userId?: number) {
    const pid = this.toNumberId(pedidoId, 'pedidoId');
    const { recibido, propina = 0, descuento = 0, metodo_pago = 'efectivo', mesero_id, usuario_id } = body || {};
    if (recibido == null) throw new HttpException({ error: 'Monto recibido requerido' }, HttpStatus.BAD_REQUEST);

    const pedido = await this.pedidos
      .findOne({ id: pid, restaurant_id: rid }, { _id: 0, id: 1, mesa_id: 1, mesero_id: 1, total: 1 })
      .lean<{ id: number; mesa_id: number; mesero_id?: number | null; total?: number }>()
      .exec();
    if (!pedido) throw new HttpException({ error: 'Pedido no encontrado' }, HttpStatus.NOT_FOUND);

    const descuentoNum = Number(descuento || 0);
    const total = Math.max(0, Number(pedido.total || 0) - descuentoNum);
    const recibidoNum = Number(recibido || 0);
    const propinaNum = Number(propina || 0);
    const cambio = Math.max(0, recibidoNum - total - propinaNum);

    const resolveUsuarioId = async (): Promise<number | null> => {
      if (usuario_id) return Number(usuario_id);
      if (mesero_id) {
        const m = await this.meseros
          .findOne({ id: Number(mesero_id), restaurant_id: rid }, { _id: 0, usuario_id: 1 })
          .lean<{ usuario_id?: number | null }>()
          .exec();
        return m?.usuario_id ?? null;
      }
      return null;
    };

    const usuarioIdMov0 = await resolveUsuarioId();
    const usuarioIdMov = usuarioIdMov0 || userId || null;

    // ensure mesero
    if (!pedido.mesero_id) {
      if (mesero_id) {
        await this.pedidos.updateOne({ id: pid, restaurant_id: rid }, { $set: { mesero_id: Number(mesero_id) } }).exec();
      } else if (usuarioIdMov) {
        const m = await this.meseros
          .findOne({ usuario_id: Number(usuarioIdMov), restaurant_id: rid }, { _id: 0, id: 1 })
          .lean<{ id: number }>()
          .exec();
        if (m?.id) {
          await this.pedidos.updateOne({ id: pid, restaurant_id: rid }, { $set: { mesero_id: m.id } }).exec();
        }
      }
    }

    const when = DateTime.now().setZone(APP_TZ).toJSDate();

    const ventaId = await this.ids.next('movimientoscontables');
    const ventaDesc = `Venta pedido #${pid} mesa ${pedido.mesa_id}`;
    await this.contables.create({
      id: ventaId,
      fecha: when,
      tipo: 'ingreso',
      categoria: 'venta',
      monto: total,
      descripcion: ventaDesc,
      mesa_id: pedido.mesa_id,
      pedido_id: pid,
      usuario_id: usuarioIdMov,
      restaurant_id: rid,
    });

    if (propinaNum > 0) {
      const propId = await this.ids.next('movimientoscontables');
      const propDesc = `Propina pedido #${pid} mesa ${pedido.mesa_id}`;
      await this.contables.create({
        id: propId,
        fecha: when,
        tipo: 'ingreso',
        categoria: 'propina',
        monto: propinaNum,
        descripcion: propDesc,
        mesa_id: pedido.mesa_id,
        pedido_id: pid,
        usuario_id: usuarioIdMov,
        restaurant_id: rid,
      });
    }

    await this.pedidos.updateOne({ id: pid, restaurant_id: rid }, { $set: { estado: 'cerrado' } }).exec();
    await this.mesas.updateOne({ id: pedido.mesa_id, restaurant_id: rid }, { $set: { estado: 'limpieza' } }).exec();

    return { ok: true, cambio, total, propina: propinaNum, descuento: descuentoNum, metodo_pago };
  }

  async listarEnCurso(rid: number) {
    const pedidos = await this.pedidos
      .find(
        { restaurant_id: rid, estado: 'en proceso' },
        {
          _id: 0,
          id: 1,
          mesa_id: 1,
          mesero_id: 1,
          total: 1,
          fecha_hora: 1,
        },
      )
      .sort({ fecha_hora: -1 })
      .lean()
      .exec();
    return { count: pedidos.length, pedidos };
  }

  async enCursoDelMeseroActual(rid: number, userId?: number) {
    const uid = userId;
    if (!uid) throw new HttpException({ error: 'usuario_id requerido (X-Usuario-Id)' }, HttpStatus.BAD_REQUEST);

    const mesero = await this.meseros
      .findOne({ usuario_id: Number(uid), restaurant_id: rid }, { _id: 0, id: 1 })
      .lean<{ id: number }>()
      .exec();
    const mid = mesero?.id || null;
    if (!mid) return { count: 0, pedidos: [] };

    const pedidos = await this.pedidos
      .find(
        { restaurant_id: rid, estado: 'en proceso', mesero_id: mid },
        {
          _id: 0,
          id: 1,
          mesa_id: 1,
          mesero_id: 1,
          total: 1,
          fecha_hora: 1,
        },
      )
      .sort({ fecha_hora: -1 })
      .lean()
      .exec();

    return { count: pedidos.length, pedidos };
  }

  async listarFacturas(rid: number, query: any) {
    const { limit = 100 } = query || {};
    const { start, end } = this.parseDateRange(query);
    const max = Math.max(1, Math.min(500, Number(limit) || 100));

    const match: any = {
      restaurant_id: rid,
      tipo: 'ingreso',
      categoria: 'venta',
    };
    if (start || end) {
      match.fecha = {};
      if (start) match.fecha.$gte = start;
      if (end) match.fecha.$lte = end;
    }

    const base = await this.contables
      .aggregate<any>([
        { $match: match },
        { $sort: { fecha: 1 } },
        { $limit: max },
        { $lookup: { from: 'pedidos', localField: 'pedido_id', foreignField: 'id', as: 'pedido' } },
        { $unwind: { path: '$pedido', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'mesas', localField: 'pedido.mesa_id', foreignField: 'id', as: 'mesa' } },
        { $unwind: { path: '$mesa', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'meseros', localField: 'pedido.mesero_id', foreignField: 'id', as: 'mesero_directo' } },
        { $unwind: { path: '$mesero_directo', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'meseros', localField: 'usuario_id', foreignField: 'usuario_id', as: 'mesero_usuario' } },
        { $unwind: { path: '$mesero_usuario', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'movimientoscontables',
            let: { pid: '$pedido_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$pedido_id', '$$pid'] },
                      { $eq: ['$restaurant_id', rid] },
                      { $eq: ['$tipo', 'ingreso'] },
                      { $eq: ['$categoria', 'propina'] },
                    ],
                  },
                },
              },
              { $group: { _id: null, sum: { $sum: '$monto' } } },
            ],
            as: 'propinaAgg',
          },
        },
        {
          $addFields: {
            propina: { $ifNull: [{ $first: '$propinaAgg.sum' }, 0] },
            mesa_id: '$pedido.mesa_id',
            mesero_id: '$pedido.mesero_id',
            mesero_nombre: { $ifNull: ['$mesero_directo.nombre', '$mesero_usuario.nombre'] },
            total: '$monto',
            pagado_en: '$fecha',
            mesa_numero: '$mesa.numero',
          },
        },
        {
          $project: {
            _id: 0,
            pedido_id: 1,
            mesa_id: 1,
            mesero_id: 1,
            mesero_nombre: 1,
            total: 1,
            pagado_en: 1,
            propina: 1,
            mesa_numero: 1,
          },
        },
      ])
      .exec();

    const facturasAsc = (base || []).filter((x: any) => x?.pedido_id != null);
    if (!facturasAsc.length) return [];

    const pedidoIds = Array.from(new Set(facturasAsc.map((f: any) => Number(f.pedido_id)).filter(Boolean)));

    const itemsAgg = await this.detalle
      .aggregate<any>([
        { $match: { pedido_id: { $in: pedidoIds } } },
        { $lookup: { from: 'productos', localField: 'producto_id', foreignField: 'id', as: 'producto' } },
        { $unwind: { path: '$producto', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            pedido_id: 1,
            cantidad: 1,
            subtotal: 1,
            nombre: '$producto.nombre',
            precio: '$producto.precio',
            id: 1,
          },
        },
        { $sort: { pedido_id: 1, id: 1 } },
      ])
      .exec();

    const itemsByPedido = new Map<number, any[]>();
    for (const it of itemsAgg || []) {
      const p = Number(it.pedido_id);
      if (!itemsByPedido.has(p)) itemsByPedido.set(p, []);
      itemsByPedido.get(p)!.push({ cantidad: it.cantidad, subtotal: it.subtotal, nombre: it.nombre, precio: it.precio });
    }

    const withTicket = facturasAsc.map((f: any, idx: number) => ({
      ...f,
      ticket: idx + 1,
      items: itemsByPedido.get(Number(f.pedido_id)) || [],
    }));

    // En SQL se asignaba ticket en orden asc y luego se ordenaba desc por pagado_en.
    return withTicket.sort((a: any, b: any) => new Date(b.pagado_en).getTime() - new Date(a.pagado_en).getTime());
  }
}
