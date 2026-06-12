import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Restaurante } from '../common/db/schemas/restaurante.schema';
import { Usuario } from '../common/db/schemas/usuario.schema';

export type UsuarioRow = {
  id: number;
  correo: string;
  contrasena: string;
  rol?: string | null;
  restaurante?: string | null;
  restaurant?: string | null;
  restaurant_id?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
};

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarios: Model<Usuario>,
    @InjectModel(Restaurante.name) private readonly restaurantes: Model<Restaurante>,
    private readonly ids: IdService,
  ) {}

  async getAll() {
    return this.usuarios.find({}, { _id: 0, __v: 0, contrasena: 0 }).sort({ id: 1 }).lean<UsuarioRow[]>().exec();
  }

  async getById(id: number) {
    return this.usuarios.findOne({ id }, { _id: 0, __v: 0, contrasena: 0 }).lean<UsuarioRow>().exec();
  }

  async create(usuario: Record<string, any>) {
    const payload = { ...(usuario || {}) };
    if (!payload.id) {
      payload.id = await this.ids.next('usuarios');
    }
    if (payload.correo) {
      payload.correo = String(payload.correo).trim().toLowerCase();
    }
    await this.usuarios.create(payload);
    return Number(payload.id);
  }

  async findByCorreo(correo: string) {
    const email = String(correo || '').trim().toLowerCase();
    return this.usuarios.findOne({ correo: email }, { _id: 0, __v: 0 }).lean<UsuarioRow>().exec();
  }

  // Validar login (soporta contraseñas con hash y sin hash)
  async validateLogin(correo: string, contrasena: string) {
    const usuario = await this.findByCorreo(correo);
    if (!usuario) return null;

    const hash = usuario.contrasena || '';
    if (hash.startsWith('$2')) {
      const coincide = await bcrypt.compare(contrasena, hash);
      return coincide ? usuario : null;
    }

    if (hash === contrasena) {
      const nuevoHash = await bcrypt.hash(contrasena, 10);
      // best-effort update
      await this.usuarios.updateOne({ id: usuario.id }, { $set: { contrasena: nuevoHash } }).exec();
      return usuario;
    }

    return null;
  }

  async resolveRestaurantIdForUsuario(usuario: UsuarioRow): Promise<number | null> {
    const rid = Number((usuario as any).restaurant_id);
    const hasRid = Number.isFinite(rid) && rid > 0;
    if (hasRid) return rid;

    const restauranteNombre = (usuario as any).restaurante || (usuario as any).restaurant || null;
    if (!restauranteNombre) {
      const first = await this.restaurantes.findOne({}, { id: 1 }).sort({ id: 1 }).lean<{ id: number }>().exec();
      return first?.id ?? null;
    }

    const existing = await this.restaurantes
      .findOne({ nombre: restauranteNombre }, { id: 1 })
      .lean<{ id: number }>()
      .exec();
    if (existing?.id) return existing.id;

    const newId = await this.ids.next('restaurantes');
    try {
      await this.restaurantes.create({ id: newId, nombre: restauranteNombre });
      return newId;
    } catch {
      const again = await this.restaurantes
        .findOne({ nombre: restauranteNombre }, { id: 1 })
        .lean<{ id: number }>()
        .exec();
      return again?.id ?? null;
    }
  }
}
