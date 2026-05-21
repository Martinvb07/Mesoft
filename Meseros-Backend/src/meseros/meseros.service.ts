import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Mesero } from '../common/db/schemas/mesero.schema';
import { Restaurante } from '../common/db/schemas/restaurante.schema';
import { Usuario } from '../common/db/schemas/usuario.schema';

@Injectable()
export class MeserosService {
  constructor(
    @InjectModel(Mesero.name) private readonly meseros: Model<Mesero>,
    @InjectModel(Usuario.name) private readonly usuarios: Model<Usuario>,
    @InjectModel(Restaurante.name) private readonly restaurantes: Model<Restaurante>,
    private readonly ids: IdService,
  ) {}

  async listarMeseros(rid: number) {
    if (!rid) throw new HttpException({ error: 'restaurantId no resuelto' }, HttpStatus.BAD_REQUEST);
    return this.meseros
      .aggregate([
        { $match: { restaurant_id: rid } },
        { $lookup: { from: 'usuarios', localField: 'usuario_id', foreignField: 'id', as: 'u' } },
        { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            id: 1,
            usuario_id: 1,
            nombre: 1,
            estado: 1,
            sueldo_base: 1,
            correo: '$u.correo',
            restaurante: '$u.restaurante',
          },
        },
        { $sort: { nombre: 1 } },
      ])
      .exec();
  }

  async obtenerMiPerfilMesero(rid: number, uid: number) {
    if (!rid) throw new HttpException({ error: 'restaurantId no resuelto' }, HttpStatus.BAD_REQUEST);
    if (!uid) throw new HttpException({ error: 'usuario_id requerido (X-Usuario-Id)' }, HttpStatus.BAD_REQUEST);
    const rows = await this.meseros
      .aggregate([
        { $match: { restaurant_id: rid, usuario_id: uid } },
        { $lookup: { from: 'usuarios', localField: 'usuario_id', foreignField: 'id', as: 'u' } },
        { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            id: 1,
            usuario_id: 1,
            nombre: 1,
            estado: 1,
            sueldo_base: 1,
            correo: '$u.correo',
            restaurante: '$u.restaurante',
          },
        },
        { $limit: 1 },
      ])
      .exec();
    if (!rows.length) throw new HttpException({ error: 'Mesero no encontrado para el usuario' }, HttpStatus.NOT_FOUND);
    return rows[0];
  }

  async crearMesero(rid: number, body: any) {
    if (!rid) throw new HttpException({ error: 'restaurantId no resuelto' }, HttpStatus.BAD_REQUEST);

    const {
      usuario_id = null,
      nombre,
      estado = 'activo',
      sueldo_base = null,
      correo,
      contrasena,
      apellido,
    } = body || {};

    if (!nombre) throw new HttpException({ error: 'Nombre requerido' }, HttpStatus.BAD_REQUEST);
    if (!correo || !contrasena) {
      throw new HttpException(
        { error: 'Correo y contraseña son obligatorios para crear un mesero con acceso' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const email = String(correo).trim().toLowerCase();
    const exists = await this.usuarios.findOne({ correo: email }, { _id: 0, id: 1 }).lean<{ id: number }>().exec();
    if (exists) throw new HttpException({ error: 'El correo ya está registrado' }, HttpStatus.CONFLICT);

    const rest = await this.restaurantes.findOne({ id: rid }, { _id: 0, nombre: 1 }).lean<{ nombre: string }>().exec();
    const restauranteNombre = rest?.nombre ?? null;

    if (String(contrasena).length < 6) {
      throw new HttpException({ error: 'Contraseña requerida (mínimo 6 caracteres)' }, HttpStatus.BAD_REQUEST);
    }

    const hash = await bcrypt.hash(String(contrasena), 10);
    const fullName = [String(nombre || '').trim(), String(apellido || '').trim()].filter(Boolean).join(' ');

    const newUserId = await this.ids.next('usuarios');
    const newMeseroId = await this.ids.next('meseros');

    try {
      await this.usuarios.create({
        id: newUserId,
        correo: email,
        contrasena: hash,
        nombre: fullName || String(nombre || '').trim() || null,
        rol: 'mesero',
        restaurante: restauranteNombre,
        restaurant_id: rid,
      } as any);

      await this.meseros.create({
        id: newMeseroId,
        usuario_id: newUserId ?? usuario_id,
        nombre,
        estado,
        sueldo_base,
        restaurant_id: rid,
      } as any);

      return { ok: true, id: newMeseroId, usuario_id: newUserId };
    } catch (err: any) {
      await this.usuarios.deleteOne({ id: newUserId }).exec().catch(() => undefined);
      if (String(err?.code || '') === '11000') {
        throw new HttpException({ error: 'El correo ya está registrado' }, HttpStatus.CONFLICT);
      }
      throw new HttpException({ error: err?.message || 'DB error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async actualizarMesero(rid: number, idRaw: string, body: any) {
    if (!rid) throw new HttpException({ error: 'restaurantId no resuelto' }, HttpStatus.BAD_REQUEST);
    const id = Number(idRaw);
    const { nombre, estado, sueldo_base, correo, contrasena, confirm_correo } = body || {};

    const wantsUserChange = correo !== undefined || (contrasena !== undefined && contrasena !== '');
    if (wantsUserChange) {
      if (!correo || !confirm_correo || String(correo).trim().toLowerCase() !== String(confirm_correo).trim().toLowerCase()) {
        throw new HttpException(
          { error: 'Debes confirmar el correo para actualizar correo o contraseña' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const current = await this.meseros
      .findOne({ id, restaurant_id: rid }, { _id: 0, id: 1, usuario_id: 1 })
      .lean<{ id: number; usuario_id?: number | null }>()
      .exec();
    if (!current) throw new HttpException({ error: 'Mesero no encontrado' }, HttpStatus.NOT_FOUND);
    const currentUserId = current.usuario_id ?? null;

    const updateMesero = async (finalUserId: number | null | undefined) => {
      const $set: any = {};
      if (finalUserId !== undefined) $set.usuario_id = finalUserId;
      if (nombre !== undefined) $set.nombre = nombre;
      if (estado !== undefined) $set.estado = estado;
      if (sueldo_base !== undefined) $set.sueldo_base = sueldo_base;
      if (!Object.keys($set).length) return { ok: true, affectedRows: 0, usuario_id: finalUserId ?? currentUserId };
      const res = await this.meseros.updateOne({ id, restaurant_id: rid }, { $set }).exec();
      return { ok: true, affectedRows: Number(res.modifiedCount || 0), usuario_id: finalUserId ?? currentUserId };
    };

    if (!wantsUserChange) {
      return updateMesero(undefined);
    }

    const email = String(correo || '').trim().toLowerCase();
    if (contrasena && String(contrasena).length < 6) {
      throw new HttpException({ error: 'La contraseña debe tener al menos 6 caracteres' }, HttpStatus.BAD_REQUEST);
    }

    const ensureCorreoFree = async (uid: number) => {
      const other = await this.usuarios
        .findOne({ correo: email, id: { $ne: uid } }, { _id: 0, id: 1 })
        .lean<{ id: number }>()
        .exec();
      if (other) throw new HttpException({ error: 'El correo ya está registrado' }, HttpStatus.CONFLICT);
    };

    // Update existing user
    const updateExisting = async (uid: number) => {
      if (correo) await ensureCorreoFree(uid);

      const $setU: any = {};
      if (correo) $setU.correo = email;
      if (contrasena) $setU.contrasena = await bcrypt.hash(String(contrasena), 10);
      if (Object.keys($setU).length) await this.usuarios.updateOne({ id: uid }, { $set: $setU }).exec();
      return updateMesero(uid);
    };

    if (currentUserId) return updateExisting(currentUserId);

    // If no user, create and link
    if (!contrasena || String(contrasena).length < 6) {
      throw new HttpException({ error: 'La contraseña debe tener al menos 6 caracteres' }, HttpStatus.BAD_REQUEST);
    }
    const exists = await this.usuarios.findOne({ correo: email }, { _id: 0, id: 1 }).lean<{ id: number }>().exec();
    if (exists) throw new HttpException({ error: 'El correo ya está registrado' }, HttpStatus.CONFLICT);

    const rest = await this.restaurantes.findOne({ id: rid }, { _id: 0, nombre: 1 }).lean<{ nombre: string }>().exec();
    const restName = rest?.nombre ?? null;
    const hash = await bcrypt.hash(String(contrasena), 10);
    const newUid = await this.ids.next('usuarios');
    await this.usuarios.create({ id: newUid, correo: email, contrasena: hash, nombre: nombre || null, rol: 'mesero', restaurante: restName, restaurant_id: rid } as any);
    return updateMesero(newUid);
  }

  async eliminarMesero(rid: number, id: string) {
    if (!rid) throw new HttpException({ error: 'restaurantId no resuelto' }, HttpStatus.BAD_REQUEST);
    const result = await this.meseros.deleteOne({ id: Number(id), restaurant_id: rid }).exec();
    if (!result.deletedCount) throw new HttpException({ error: 'Mesero no encontrado' }, HttpStatus.NOT_FOUND);
    return { ok: true, affectedRows: Number(result.deletedCount || 0) };
  }
}
