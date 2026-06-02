import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { DetallePedido } from '../common/db/schemas/detallepedido.schema';
import { MovimientoContable } from '../common/db/schemas/movimiento.schema';
import { Pedido } from '../common/db/schemas/pedido.schema';
import { Producto } from '../common/db/schemas/producto.schema';

const APP_TZ = process.env.APP_TZ || 'America/Bogota';

function todayRange() {
  const now = DateTime.now().setZone(APP_TZ);
  const start = now.startOf('day').toJSDate();
  const end = now.endOf('day').toJSDate();
  return { start, end };
}

function dayRange(offsetDays = 0) {
  const dt = DateTime.now().setZone(APP_TZ).plus({ days: offsetDays });
  return {
    start: dt.startOf('day').toJSDate(),
    end: dt.endOf('day').toJSDate(),
  };
}

function parseDateOnly(s: string | undefined) {
  if (!s) return null;
  const dt = DateTime.fromISO(s, { zone: APP_TZ });
  if (!dt.isValid) return null;
  return {
    start: dt.startOf('day').toJSDate(),
    end: dt.endOf('day').toJSDate(),
  };
}

@Injectable()
export class FinanzasService {
  constructor(
    @InjectModel(MovimientoContable.name) private readonly contables: Model<MovimientoContable>,
    @InjectModel(Pedido.name) private readonly pedidos: Model<Pedido>,
    @InjectModel(DetallePedido.name) private readonly detalle: Model<DetallePedido>,
    @InjectModel(Producto.name) private readonly productos: Model<Producto>,
    private readonly ids: IdService,
  ) {}

  async ventasHoy(rid: number) {
    const { start, end } = todayRange();
    const rows = await this.contables
      .aggregate([
        {
          $match: {
            tipo: 'ingreso',
            restaurant_id: rid,
            fecha: { $gte: start, $lte: end },
            $or: [{ categoria: 'venta' }, { descripcion: { $regex: /^Venta\s/i } }],
          },
        },
        { $group: { _id: null, ventas: { $sum: '$monto' } } },
      ])
      .exec();
    return { ventas: Number(rows[0]?.ventas || 0) };
  }

  async propinasPorMeseroYRango(rid: number, query: any) {
    const { mesero_id, desde, hasta } = query || {};
    if (!mesero_id || !desde || !hasta) {
      throw new HttpException({ error: 'mesero_id, desde, hasta requeridos' }, HttpStatus.BAD_REQUEST);
    }
    const start = DateTime.fromISO(String(desde), { zone: APP_TZ }).startOf('day').toJSDate();
    const end = DateTime.fromISO(String(hasta), { zone: APP_TZ }).endOf('day').toJSDate();

    // Nota: mantenemos el contrato existente: mesero_id se usa como usuario_id.
    const uid = Number(mesero_id);
    const rows = await this.contables
      .aggregate([
        {
          $match: {
            tipo: 'ingreso',
            restaurant_id: rid,
            usuario_id: uid,
            fecha: { $gte: start, $lte: end },
            $or: [{ categoria: 'propina' }, { descripcion: { $regex: /^Propina\s/i } }],
          },
        },
        { $group: { _id: null, propinas: { $sum: '$monto' } } },
      ])
      .exec();
    return { propinas: Number(rows[0]?.propinas || 0) };
  }

  async balanceHoy(rid: number) {
    const { start, end } = todayRange();
    const rowsIng = await this.contables
      .aggregate([
        {
          $match: {
            tipo: 'ingreso',
            restaurant_id: rid,
            fecha: { $gte: start, $lte: end },
            $or: [{ categoria: 'venta' }, { descripcion: { $regex: /^Venta\s/i } }],
          },
        },
        { $group: { _id: null, total: { $sum: '$monto' } } },
      ])
      .exec();
    const rowsEgr = await this.contables
      .aggregate([
        { $match: { tipo: 'egreso', restaurant_id: rid, fecha: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$monto' } } },
      ])
      .exec();
    const ingresos = Number(rowsIng[0]?.total || 0);
    const egresos = Number(rowsEgr[0]?.total || 0);
    return { balance: ingresos - egresos, ingresos, egresos };
  }

  async ticketPromedioHoy(rid: number) {
    const { start, end } = todayRange();
    const rows = await this.contables
      .aggregate([
        {
          $match: {
            tipo: 'ingreso',
            restaurant_id: rid,
            fecha: { $gte: start, $lte: end },
            $or: [{ categoria: 'venta' }, { descripcion: { $regex: /^Venta\s/i } }],
          },
        },
        {
          $group: {
            _id: null,
            ventas: { $sum: '$monto' },
            pedidosSet: { $addToSet: '$pedido_id' },
          },
        },
        { $project: { ventas: 1, pedidos: { $size: '$pedidosSet' } } },
      ])
      .exec();

    const ventas = Number(rows[0]?.ventas || 0);
    const pedidos = Number(rows[0]?.pedidos || 0);
    const ticket_promedio = pedidos > 0 ? ventas / pedidos : 0;
    return { ventas, pedidos, ticket_promedio };
  }

  async variacionVentasDia(rid: number) {
    const { start: hStart, end: hEnd } = dayRange(0);
    const { start: aStart, end: aEnd } = dayRange(-1);
    const sumVentas = async (start: Date, end: Date) => {
      const r = await this.contables
        .aggregate([
          {
            $match: {
              tipo: 'ingreso',
              restaurant_id: rid,
              fecha: { $gte: start, $lte: end },
              $or: [{ categoria: 'venta' }, { descripcion: { $regex: /^Venta\s/i } }],
            },
          },
          { $group: { _id: null, total: { $sum: '$monto' } } },
        ])
        .exec();
      return Number(r[0]?.total || 0);
    };
    const actual = await sumVentas(hStart, hEnd);
    const previo = await sumVentas(aStart, aEnd);
    const variacionPct = previo > 0 ? ((actual - previo) / previo) * 100 : actual > 0 ? 100 : 0;
    return { actual, previo, variacionPct };
  }

  async topProductos(rid: number, query: any) {
    const { desde, hasta, limit = 5 } = query || {};
    let start: Date | undefined;
    let end: Date | undefined;
    if (desde && hasta) {
      const r1 = parseDateOnly(desde);
      const r2 = parseDateOnly(hasta);
      start = r1?.start;
      end = r2?.end;
    }
    if (!start || !end) {
      const to = dayRange(0);
      const from = dayRange(-6);
      start = from.start;
      end = to.end;
    }
    const startDate = start!;
    const endDate = end!;
    const msLen = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1000);
    const prevStart = new Date(prevEnd.getTime() - msLen);
    const pStart = DateTime.fromJSDate(prevStart, { zone: APP_TZ }).startOf('day').toJSDate();
    const pEnd = DateTime.fromJSDate(prevEnd, { zone: APP_TZ }).endOf('day').toJSDate();

    const rows = await this.detalle
      .aggregate([
        {
          $lookup: {
            from: 'pedidos',
            let: { pid: '$pedido_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$id', '$$pid'] },
                      { $eq: ['$restaurant_id', rid] },
                      { $gte: ['$fecha_hora', startDate] },
                      { $lte: ['$fecha_hora', endDate] },
                    ],
                  },
                },
              },
              { $project: { _id: 0, id: 1 } },
            ],
            as: 'pe',
          },
        },
        { $unwind: '$pe' },
        { $group: { _id: '$producto_id', unidades: { $sum: '$cantidad' }, ingresos: { $sum: '$subtotal' } } },
        { $sort: { unidades: -1 } },
        { $limit: Number(limit) || 5 },
        { $lookup: { from: 'productos', localField: '_id', foreignField: 'id', as: 'p' } },
        { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
        { $project: { producto_id: '$_id', nombre: '$p.nombre', unidades: 1, ingresos: 1 } },
      ])
      .exec();

    const ids = rows.map((r: any) => r.producto_id);
    if (!ids.length) return [];

    const prevRows = await this.detalle
      .aggregate([
        { $match: { producto_id: { $in: ids } } },
        {
          $lookup: {
            from: 'pedidos',
            let: { pid: '$pedido_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$id', '$$pid'] },
                      { $eq: ['$restaurant_id', rid] },
                      { $gte: ['$fecha_hora', pStart] },
                      { $lte: ['$fecha_hora', pEnd] },
                    ],
                  },
                },
              },
              { $project: { _id: 0, id: 1 } },
            ],
            as: 'pe',
          },
        },
        { $unwind: '$pe' },
        { $group: { _id: '$producto_id', unidades: { $sum: '$cantidad' } } },
      ])
      .exec();

    const prevMap = new Map(prevRows.map((r: any) => [r._id, Number(r.unidades || 0)]));
    return rows.map((r: any) => {
      const unidadesPrev = prevMap.get(r.producto_id) || 0;
      const unidadesAct = Number(r.unidades || 0);
      const tendenciaPct = unidadesPrev > 0 ? ((unidadesAct - unidadesPrev) / unidadesPrev) * 100 : unidadesAct > 0 ? 100 : 0;
      return {
        producto_id: r.producto_id,
        nombre: r.nombre,
        unidades: unidadesAct,
        ingresos: Number(r.ingresos || 0),
        tendenciaPct,
      };
    });
  }

  async egresosCategoriasHoy(rid: number) {
    const { start, end } = todayRange();
    return this.contables
      .aggregate([
        { $match: { tipo: 'egreso', restaurant_id: rid, fecha: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $ifNull: ['$categoria', '(sin categoria)'] },
            movimientos: { $sum: 1 },
            total: { $sum: '$monto' },
          },
        },
        { $project: { _id: 0, categoria: '$_id', movimientos: 1, total: 1 } },
        { $sort: { total: -1 } },
      ])
      .exec();
  }

  async metaHoy(rid: number) {
    const meta = Number(process.env.META_DIARIA || 1000000);
    const { start, end } = todayRange();
    const rows = await this.contables
      .aggregate([
        {
          $match: {
            tipo: 'ingreso',
            restaurant_id: rid,
            fecha: { $gte: start, $lte: end },
            $or: [{ categoria: 'venta' }, { descripcion: { $regex: /^Venta\s/i } }],
          },
        },
        { $group: { _id: null, ventas: { $sum: '$monto' } } },
      ])
      .exec();
    const ventas = Number(rows[0]?.ventas || 0);
    const progresoPct = meta > 0 ? Math.min(100, (ventas / meta) * 100) : 0;
    return { meta, ventas, progresoPct };
  }

  async ventasPorProducto(rid: number, query: any) {
    const { desde, hasta, categoria } = query || {};
    let range: { start: Date; end: Date } | null = null;
    if (desde && hasta) {
      const r1 = parseDateOnly(desde);
      const r2 = parseDateOnly(hasta);
      if (r1 && r2) range = { start: r1.start, end: r2.end };
    }
    if (!range) {
      const to = dayRange(0);
      const from = dayRange(-6);
      range = { start: from.start, end: to.end };
    }
    const rows = await this.detalle
      .aggregate([
        {
          $lookup: {
            from: 'pedidos',
            let: { pid: '$pedido_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$id', '$$pid'] },
                      { $eq: ['$restaurant_id', rid] },
                      { $gte: ['$fecha_hora', range.start] },
                      { $lte: ['$fecha_hora', range.end] },
                    ],
                  },
                },
              },
              { $project: { _id: 0, id: 1 } },
            ],
            as: 'pe',
          },
        },
        { $unwind: '$pe' },
        { $group: { _id: '$producto_id', unidades: { $sum: '$cantidad' }, ingresos: { $sum: '$subtotal' } } },
        { $lookup: { from: 'productos', localField: '_id', foreignField: 'id', as: 'p' } },
        { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
        ...(categoria ? [{ $match: { 'p.categoria': categoria } }] : []),
        {
          $project: {
            _id: 0,
            producto_id: '$_id',
            nombre: '$p.nombre',
            categoria: '$p.categoria',
            unidades: 1,
            ingresos: 1,
            precio_unit: { $cond: [{ $gt: ['$unidades', 0] }, { $divide: ['$ingresos', '$unidades'] }, 0] },
            precio_actual: '$p.precio',
          },
        },
        { $sort: { unidades: -1 } },
      ])
      .exec();
    return rows.map((r: any) => ({
      producto_id: r.producto_id,
      nombre: r.nombre,
      categoria: r.categoria,
      unidades: Number(r.unidades || 0),
      ingresos: Number(r.ingresos || 0),
      precio_unit: Number(r.precio_unit || 0),
      precio_actual: Number(r.precio_actual || 0),
    }));
  }

  async egresosListar(rid: number, query: any) {
    const { desde, hasta, categoria } = query || {};
    let range: { start: Date; end: Date } | null = null;
    if (desde && hasta) {
      const r1 = parseDateOnly(desde);
      const r2 = parseDateOnly(hasta);
      if (r1 && r2) range = { start: r1.start, end: r2.end };
    }
    if (!range) {
      const { start, end } = todayRange();
      range = { start, end };
    }
    const filter: any = { tipo: 'egreso', restaurant_id: rid, fecha: { $gte: range.start, $lte: range.end } };
    if (categoria) filter.categoria = categoria;
    return this.contables
      .find(filter, { _id: 0, id: 1, fecha: 1, categoria: 1, monto: 1, descripcion: 1, usuario_id: 1 })
      .sort({ fecha: -1, id: -1 })
      .lean<any[]>()
      .exec();
  }

  async egresoCrear(rid: number, userId: number | undefined, body: any) {
    const { categoria, monto, descripcion, fecha } = body || {};
    if (!monto) throw new HttpException({ error: 'monto requerido' }, HttpStatus.BAD_REQUEST);
    const uid = userId || null;
    const whenDT = fecha ? DateTime.fromISO(fecha, { zone: APP_TZ }) : DateTime.now().setZone(APP_TZ);
    const id = await this.ids.next('movimientoscontables');
    await this.contables.create({
      id,
      fecha: whenDT.toJSDate(),
      tipo: 'egreso',
      categoria: categoria || null,
      monto: Number(monto),
      descripcion: descripcion || null,
      usuario_id: uid,
      restaurant_id: rid,
    } as any);
    return { id };
  }

  async egresoActualizar(rid: number, id: string, body: any) {
    const { categoria, monto, descripcion, fecha } = body || {};
    if (!id) throw new HttpException({ error: 'id requerido' }, HttpStatus.BAD_REQUEST);
    const $set: any = {};
    if (fecha) {
      const when = DateTime.fromISO(String(fecha), { zone: APP_TZ });
      $set.fecha = when.isValid ? when.toJSDate() : new Date(fecha);
    }
    if (categoria !== undefined) $set.categoria = categoria;
    if (monto !== undefined) $set.monto = Number(monto);
    if (descripcion !== undefined) $set.descripcion = descripcion;
    if (!Object.keys($set).length) throw new HttpException({ error: 'sin cambios' }, HttpStatus.BAD_REQUEST);
    await this.contables.updateOne({ id: Number(id), restaurant_id: rid, tipo: 'egreso' }, { $set }).exec();
    return { ok: true };
  }

  async egresoEliminar(rid: number, id: string) {
    if (!id) throw new HttpException({ error: 'id requerido' }, HttpStatus.BAD_REQUEST);
    await this.contables.deleteOne({ id: Number(id), restaurant_id: rid, tipo: 'egreso' }).exec();
    return { ok: true };
  }

  async egresosCategorias(rid: number, query: any) {
    const { desde, hasta } = query || {};
    let range: { start: Date; end: Date } | null = null;
    if (desde && hasta) {
      const r1 = parseDateOnly(desde);
      const r2 = parseDateOnly(hasta);
      if (r1 && r2) range = { start: r1.start, end: r2.end };
    }
    if (!range) {
      const { start, end } = todayRange();
      range = { start, end };
    }
    return this.contables
      .aggregate([
        { $match: { tipo: 'egreso', restaurant_id: rid, fecha: { $gte: range.start, $lte: range.end } } },
        {
          $group: {
            _id: { $ifNull: ['$categoria', '(sin categoria)'] },
            movimientos: { $sum: 1 },
            total: { $sum: '$monto' },
          },
        },
        { $project: { _id: 0, categoria: '$_id', movimientos: 1, total: 1 } },
        { $sort: { total: -1 } },
      ])
      .exec();
  }

  async rankingPropinas(rid: number, query: any) {
    const { desde, hasta } = query || {};
    const r1 = parseDateOnly(desde);
    const r2 = parseDateOnly(hasta);
    const start = r1?.start ?? DateTime.now().setZone(APP_TZ).startOf('week').toJSDate();
    const end = r2?.end ?? DateTime.now().setZone(APP_TZ).endOf('day').toJSDate();

    return this.contables.aggregate([
      {
        $match: {
          tipo: 'ingreso',
          restaurant_id: rid,
          fecha: { $gte: start, $lte: end },
          $or: [{ categoria: 'propina' }, { descripcion: { $regex: /^Propina\s/i } }],
        },
      },
      { $group: { _id: '$usuario_id', propinas: { $sum: '$monto' }, cantidad: { $sum: 1 } } },
      { $sort: { propinas: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'meseros',
          localField: '_id',
          foreignField: 'usuario_id',
          as: 'mesero',
        },
      },
      { $unwind: { path: '$mesero', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          usuario_id: '$_id',
          nombre: { $ifNull: ['$mesero.nombre', 'Desconocido'] },
          propinas: 1,
          cantidad: 1,
        },
      },
    ]).exec();
  }

  async evolucionVentas(rid: number, query: any) {
    const { desde, hasta } = query || {};
    const r1 = parseDateOnly(desde);
    const r2 = parseDateOnly(hasta);
    const start = r1?.start ?? DateTime.now().setZone(APP_TZ).minus({ days: 29 }).startOf('day').toJSDate();
    const end = r2?.end ?? DateTime.now().setZone(APP_TZ).endOf('day').toJSDate();

    const rows = await this.contables
      .aggregate([
        {
          $match: {
            tipo: 'ingreso',
            restaurant_id: rid,
            fecha: { $gte: start, $lte: end },
            $or: [{ categoria: 'venta' }, { descripcion: { $regex: /^Venta\s/i } }],
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$fecha', timezone: APP_TZ },
            },
            ventas: { $sum: '$monto' },
          },
        },
        { $project: { _id: 0, fecha: '$_id', ventas: 1 } },
        { $sort: { fecha: 1 } },
      ])
      .exec();

    // Rellenar días sin ventas con 0
    const map = new Map(rows.map((r: any) => [r.fecha, r.ventas]));
    const result: { fecha: string; ventas: number }[] = [];
    let cursor = DateTime.fromJSDate(start).setZone(APP_TZ);
    const endDt = DateTime.fromJSDate(end).setZone(APP_TZ);
    while (cursor <= endDt) {
      const key = cursor.toFormat('yyyy-MM-dd');
      result.push({ fecha: key, ventas: Number(map.get(key) || 0) });
      cursor = cursor.plus({ days: 1 });
    }
    return result;
  }
}
