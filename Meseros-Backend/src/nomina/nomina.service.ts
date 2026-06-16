import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Mesero } from '../common/db/schemas/mesero.schema';
import { MovimientoContable } from '../common/db/schemas/movimiento.schema';
import { NominaMovimiento } from '../common/db/schemas/nomina-movimiento.schema';

const APP_TZ = process.env.APP_TZ || 'America/Bogota';

@Injectable()
export class NominaService {
  constructor(
    @InjectModel(NominaMovimiento.name) private readonly movimientos: Model<NominaMovimiento>,
    @InjectModel(Mesero.name) private readonly meseros: Model<Mesero>,
    @InjectModel(MovimientoContable.name) private readonly contables: Model<MovimientoContable>,
    private readonly ids: IdService,
  ) {}

  async listarMovimientos(rid: number, query: any) {
    const { mesero_id, desde, hasta } = query || {};
    if (!desde || !hasta) {
      throw new HttpException({ error: 'desde y hasta requeridos (YYYY-MM-DD)' }, HttpStatus.BAD_REQUEST);
    }
    const startDt = DateTime.fromISO(String(desde), { zone: APP_TZ }).startOf('day');
    const endDt = DateTime.fromISO(String(hasta), { zone: APP_TZ }).endOf('day');
    if (!startDt.isValid || !endDt.isValid) {
      throw new HttpException({ error: 'desde/hasta inválidos (formato YYYY-MM-DD)' }, HttpStatus.BAD_REQUEST);
    }
    const start = startDt.toJSDate();
    const end = endDt.toJSDate();
    const filter: any = { restaurant_id: rid, fecha: { $gte: start, $lte: end } };
    if (mesero_id) filter.mesero_id = Number(mesero_id);
    return this.movimientos.find(filter, { _id: 0, __v: 0 }).sort({ fecha: 1, id: 1 }).lean<any[]>().exec();
  }

  async crearMovimiento(rid: number, body: any) {
    const { mesero_id, tipo, monto, descripcion, fecha } = body || {};
    if (!mesero_id || !tipo || monto == null) {
      throw new HttpException({ error: 'mesero_id, tipo, monto requeridos' }, HttpStatus.BAD_REQUEST);
    }
    const allowed = new Set(['sueldo', 'extra', 'bono', 'deduccion', 'pago', 'adelanto', 'descuento']);
    const normalized = String(tipo).toLowerCase();
    if (!allowed.has(normalized)) {
      throw new HttpException({ error: `tipo inválido: ${tipo}` }, HttpStatus.BAD_REQUEST);
    }
    const tipoDb = normalized === 'deduccion' ? 'deduccion' : normalized;
    const when = fecha ? DateTime.fromISO(String(fecha), { zone: APP_TZ }) : DateTime.now().setZone(APP_TZ);
    const id = await this.ids.next('nomina_movimientos');
    await this.movimientos.create({
      id,
      mesero_id: Number(mesero_id),
      tipo: tipoDb,
      monto: Number(monto),
      descripcion: descripcion || null,
      fecha: when.toJSDate(),
      restaurant_id: rid,
    } as any);
    return { ok: true, id };
  }

  async eliminarMovimiento(rid: number, id: string) {
    const result = await this.movimientos.deleteOne({ id: Number(id), restaurant_id: rid }).exec();
    if (!result.deletedCount) throw new HttpException({ error: 'Movimiento no encontrado' }, HttpStatus.NOT_FOUND);
    return { ok: true };
  }

  async marcarPago(rid: number, body: any) {
    const { mesero_id, fecha, pagado, monto, descripcion } = body || {};
    if (!mesero_id || !fecha || typeof pagado !== 'boolean') {
      throw new HttpException({ error: 'mesero_id, fecha y pagado son requeridos' }, HttpStatus.BAD_REQUEST);
    }
    const fechaDt = DateTime.fromISO(String(fecha), { zone: APP_TZ });
    if (!fechaDt.isValid) {
      throw new HttpException({ error: 'fecha inválida (formato YYYY-MM-DD)' }, HttpStatus.BAD_REQUEST);
    }
    const fechaIni = fechaDt.startOf('day').toJSDate();
    const fechaFin = fechaDt.endOf('day').toJSDate();

    if (pagado) {
      const whenMid = DateTime.fromISO(String(fecha), { zone: APP_TZ }).set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toJSDate();
      const id = await this.ids.next('nomina_movimientos');
      await this.movimientos.create({
        id,
        mesero_id: Number(mesero_id),
        tipo: 'pago',
        monto: Number(monto || 0),
        descripcion: descripcion || 'Pago nómina',
        fecha: whenMid,
        restaurant_id: rid,
      } as any);
      return { ok: true, id };
    }

    const result = await this.movimientos
      .deleteMany({ mesero_id: Number(mesero_id), tipo: 'pago', fecha: { $gte: fechaIni, $lte: fechaFin }, restaurant_id: rid })
      .exec();
    return { ok: true, deleted: Number(result.deletedCount || 0) };
  }

  async resumenMesero(rid: number, query: any, userId?: number) {
    const midQ = query?.mesero_id;
    const now = DateTime.now().setZone(APP_TZ);
    const start = now.startOf('month').toJSDate();
    const end = now.endOf('month').toJSDate();

    const resolveMeseroId = async (): Promise<number | null> => {
      if (midQ) return Number(midQ);
      const uid = userId || null;
      if (!uid) return null;
      const r = await this.meseros
        .findOne({ usuario_id: Number(uid), restaurant_id: rid }, { _id: 0, id: 1 })
        .lean<{ id: number }>()
        .exec();
      return r?.id ?? null;
    };

    const mid = await resolveMeseroId();
    if (!mid) throw new HttpException({ error: 'Mesero no encontrado' }, HttpStatus.NOT_FOUND);

    const mesero = await this.meseros
      .findOne({ id: mid, restaurant_id: rid }, { _id: 0, sueldo_base: 1, usuario_id: 1 })
      .lean<{ sueldo_base?: number; usuario_id?: number | null }>()
      .exec();
    const sueldo_base = Number(mesero?.sueldo_base || 0);
    const uid = mesero?.usuario_id ?? null;

    const r2 = await this.movimientos
      .aggregate([
        { $match: { mesero_id: mid, restaurant_id: rid, fecha: { $gte: start, $lte: end } } },
        { $group: { _id: { $toLower: '$tipo' }, total: { $sum: '$monto' } } },
      ])
      .exec();
    const map = new Map((r2 || []).map((x: any) => [String(x._id || '').toLowerCase(), Number(x.total || 0)]));
    const bonos = (map.get('bono') || 0) + (map.get('extra') || 0);
    const adelantos = map.get('adelanto') || 0;
    const descuentos = (map.get('descuento') || 0) + (map.get('deduccion') || 0);
    const pagado = map.get('pago') || 0;

    if (!uid) {
      const saldo = Math.max(0, sueldo_base + bonos - adelantos - descuentos - pagado);
      return { mesero_id: mid, sueldo_base, bonos, adelantos, descuentos, pagado, saldo, propinas_mes: 0 };
    }

    const r3 = await this.contables
      .aggregate([
        {
          $match: {
            restaurant_id: rid,
            usuario_id: uid,
            tipo: 'ingreso',
            fecha: { $gte: start, $lte: end },
            $or: [{ categoria: 'propina' }, { descripcion: { $regex: /^Propina\s/i } }],
          },
        },
        { $group: { _id: null, propinas: { $sum: '$monto' } } },
      ])
      .exec();
    const propinas_mes = Number(r3?.[0]?.propinas || 0);
    const saldo = Math.max(0, sueldo_base + bonos - adelantos - descuentos - pagado);
    return { mesero_id: mid, sueldo_base, bonos, adelantos, descuentos, pagado, saldo, propinas_mes };
  }
}
