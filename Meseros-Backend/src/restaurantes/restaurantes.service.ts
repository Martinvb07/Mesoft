import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Restaurante } from '../common/db/schemas/restaurante.schema';

@Injectable()
export class RestaurantesService {
  constructor(
    @InjectModel(Restaurante.name) private readonly restaurantes: Model<Restaurante>,
  ) {}

  async getMe(rid: number) {
    const r = await this.restaurantes
      .findOne({ id: rid }, { _id: 0, id: 1, nombre: 1, wompi_public_key: 1, bold_api_key: 1, alegra_api_key: 1, alegra_email: 1, alegra_id_empresa: 1 })
      .lean<any>()
      .exec();
    if (!r) throw new HttpException({ error: 'Restaurante no encontrado' }, HttpStatus.NOT_FOUND);
    return {
      id: r.id,
      nombre: r.nombre,
      wompi_public_key: r.wompi_public_key ?? null,
      bold_api_key: r.bold_api_key ?? null,
      alegra_api_key: r.alegra_api_key ?? null,
      alegra_email: r.alegra_email ?? null,
      alegra_id_empresa: r.alegra_id_empresa ?? null,
      alegra_configurado: !!(r.alegra_api_key && r.alegra_email),
    };
  }

  async updateMe(rid: number, body: any) {
    const allowed = ['wompi_public_key', 'bold_api_key', 'alegra_api_key', 'alegra_email', 'alegra_id_empresa', 'nombre'];
    const update: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        update[key] = body[key] === '' ? null : body[key];
      }
    }
    if (!Object.keys(update).length) {
      throw new HttpException({ error: 'No hay campos para actualizar' }, HttpStatus.BAD_REQUEST);
    }
    const updated = await this.restaurantes
      .findOneAndUpdate({ id: rid }, { $set: update }, { new: true })
      .lean<any>()
      .exec();
    if (!updated) throw new HttpException({ error: 'Restaurante no encontrado' }, HttpStatus.NOT_FOUND);
    return {
      id: updated.id,
      nombre: updated.nombre,
      wompi_public_key: updated.wompi_public_key ?? null,
      bold_api_key: updated.bold_api_key ?? null,
      alegra_api_key: updated.alegra_api_key ?? null,
      alegra_email: updated.alegra_email ?? null,
      alegra_id_empresa: updated.alegra_id_empresa ?? null,
      alegra_configurado: !!(updated.alegra_api_key && updated.alegra_email),
    };
  }
}
