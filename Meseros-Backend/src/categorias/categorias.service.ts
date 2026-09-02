import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Categoria } from '../common/db/schemas/categoria.schema';
import { Producto } from '../common/db/schemas/producto.schema';

/* El producto sigue guardando la categoría por nombre (`productos.categoria`).
   Esta colección es el catálogo: define cuáles existen, en qué orden salen en
   el POS, de qué color y si están activas. Renombrar aquí arrastra a los
   productos, para que no queden categorías huérfanas. */

/* Paleta cerrada: el color es ayuda visual, se puede repetir entre categorías.
   El orden es el que se va asignando solo al crear en lote. */
const COLORES = [
  'orange', 'sky', 'emerald', 'violet', 'amber', 'rose', 'teal', 'indigo',
  'lime', 'pink', 'cyan', 'blue', 'fuchsia', 'green', 'yellow', 'slate',
];

/* Plantilla para un restaurante que arranca sin nada cargado */
const PLANTILLA = [
  'Entradas',
  'Platos fuertes',
  'Comidas rápidas',
  'Asados y carnes',
  'Sopas',
  'Ensaladas',
  'Acompañamientos',
  'Postres',
  'Bebidas',
  'Cervezas y licores',
  'Café',
  'Combos',
];

@Injectable()
export class CategoriasService {
  constructor(
    @InjectModel(Categoria.name) private readonly categorias: Model<Categoria>,
    @InjectModel(Producto.name) private readonly productos: Model<Producto>,
    private readonly ids: IdService,
  ) {}

  private norm(s: any) {
    return String(s || '').trim();
  }

  private async existeNombre(rid: number, nombre: string, exceptoId?: number) {
    const todas = await this.categorias
      .find({ restaurant_id: rid }, { _id: 0, id: 1, nombre: 1 })
      .lean<{ id: number; nombre: string }[]>()
      .exec();
    const buscado = nombre.toLowerCase();
    return todas.some((c) => c.nombre.trim().toLowerCase() === buscado && c.id !== exceptoId);
  }

  /* Primera vez: arma el catálogo con las categorías que ya tienen los
     productos; si el restaurante está vacío, deja la plantilla. */
  private async provisionar(rid: number) {
    const cuantas = await this.categorias.countDocuments({ restaurant_id: rid });
    if (cuantas > 0) return;

    const usadas = (await this.productos.distinct('categoria', { restaurant_id: rid }))
      .map((c: any) => this.norm(c))
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b, 'es'));

    const nombres = usadas.length ? usadas : PLANTILLA;
    for (let i = 0; i < nombres.length; i++) {
      const id = await this.ids.next('categorias');
      await this.categorias.create({
        id,
        nombre: nombres[i],
        orden: i,
        color: COLORES[i % COLORES.length],
        activa: true,
        restaurant_id: rid,
      } as any);
    }
  }

  async listar(rid: number, soloActivas = false) {
    await this.provisionar(rid);
    const filtro: any = { restaurant_id: rid };
    if (soloActivas) filtro.activa = true;
    const lista = await this.categorias
      .find(filtro, { _id: 0, __v: 0 })
      .sort({ orden: 1, nombre: 1 })
      .lean<any[]>()
      .exec();

    /* Cuántos productos cuelgan de cada una (para la pantalla del admin) */
    const conteo = await this.productos
      .aggregate([{ $match: { restaurant_id: rid } }, { $group: { _id: '$categoria', n: { $sum: 1 } } }])
      .exec();
    const mapa = new Map((conteo || []).map((c: any) => [this.norm(c._id), Number(c.n || 0)]));
    return lista.map((c) => ({ ...c, productos: mapa.get(this.norm(c.nombre)) || 0 }));
  }

  async crear(rid: number, body: any) {
    const nombre = this.norm(body?.nombre);
    if (!nombre) throw new HttpException({ error: 'El nombre es obligatorio' }, HttpStatus.BAD_REQUEST);
    if (await this.existeNombre(rid, nombre)) {
      throw new HttpException({ error: 'Ya existe una categoría con ese nombre' }, HttpStatus.CONFLICT);
    }
    const ultima = await this.categorias
      .findOne({ restaurant_id: rid }, { _id: 0, orden: 1 })
      .sort({ orden: -1 })
      .lean<{ orden?: number }>()
      .exec();
    const id = await this.ids.next('categorias');
    const color = COLORES.includes(String(body?.color)) ? String(body.color) : COLORES[id % COLORES.length];
    await this.categorias.create({
      id,
      nombre,
      orden: Number(ultima?.orden ?? -1) + 1,
      color,
      activa: body?.activa === undefined ? true : !!body.activa,
      imagen: this.norm(body?.imagen) || null,
      restaurant_id: rid,
    } as any);
    return { ok: true, id };
  }

  async actualizar(rid: number, idRaw: string, body: any) {
    const id = Number(idRaw);
    const actual = await this.categorias
      .findOne({ id, restaurant_id: rid }, { _id: 0, id: 1, nombre: 1 })
      .lean<{ id: number; nombre: string }>()
      .exec();
    if (!actual) throw new HttpException({ error: 'Categoría no encontrada' }, HttpStatus.NOT_FOUND);

    const $set: any = {};
    if (body?.color !== undefined && COLORES.includes(String(body.color))) $set.color = String(body.color);
    if (body?.activa !== undefined) $set.activa = !!body.activa;
    if (body?.imagen !== undefined) $set.imagen = this.norm(body.imagen) || null;
    if (body?.orden !== undefined && Number.isFinite(Number(body.orden))) $set.orden = Number(body.orden);

    let renombrada: string | null = null;
    if (body?.nombre !== undefined) {
      const nombre = this.norm(body.nombre);
      if (!nombre) throw new HttpException({ error: 'El nombre es obligatorio' }, HttpStatus.BAD_REQUEST);
      if (await this.existeNombre(rid, nombre, id)) {
        throw new HttpException({ error: 'Ya existe una categoría con ese nombre' }, HttpStatus.CONFLICT);
      }
      if (nombre !== actual.nombre) {
        $set.nombre = nombre;
        renombrada = nombre;
      }
    }

    if (Object.keys($set).length) {
      await this.categorias.updateOne({ id, restaurant_id: rid }, { $set }).exec();
    }

    /* Al renombrar, los productos siguen a la categoría */
    let productosActualizados = 0;
    if (renombrada) {
      const res = await this.productos
        .updateMany({ restaurant_id: rid, categoria: actual.nombre }, { $set: { categoria: renombrada } })
        .exec();
      productosActualizados = Number(res.modifiedCount || 0);
    }
    return { ok: true, productosActualizados };
  }

  /* Borrar: si la categoría tiene productos hay que decir qué hacer con ellos.
     `reasignar` acepta el nombre de otra categoría o '' para dejarlos sin
     categoría. Sin ese dato, devolvemos 409 con el conteo. */
  async eliminar(rid: number, idRaw: string, reasignar?: string) {
    const id = Number(idRaw);
    const actual = await this.categorias
      .findOne({ id, restaurant_id: rid }, { _id: 0, id: 1, nombre: 1 })
      .lean<{ id: number; nombre: string }>()
      .exec();
    if (!actual) throw new HttpException({ error: 'Categoría no encontrada' }, HttpStatus.NOT_FOUND);

    const conProductos = await this.productos.countDocuments({ restaurant_id: rid, categoria: actual.nombre });
    if (conProductos > 0) {
      if (reasignar === undefined) {
        throw new HttpException(
          {
            error: `"${actual.nombre}" tiene ${conProductos} producto(s). Elige a qué categoría moverlos.`,
            code: 'CATEGORIA_CON_PRODUCTOS',
            productos: conProductos,
          },
          HttpStatus.CONFLICT,
        );
      }
      const destino = this.norm(reasignar);
      if (destino && !(await this.existeNombre(rid, destino))) {
        throw new HttpException({ error: 'La categoría destino no existe' }, HttpStatus.BAD_REQUEST);
      }
      await this.productos
        .updateMany({ restaurant_id: rid, categoria: actual.nombre }, { $set: { categoria: destino } })
        .exec();
    }

    await this.categorias.deleteOne({ id, restaurant_id: rid }).exec();
    return { ok: true, productosMovidos: conProductos };
  }

  /* Reordenar de un golpe: llega el array de ids en el orden deseado */
  async reordenar(rid: number, ids: any) {
    if (!Array.isArray(ids)) throw new HttpException({ error: 'Se espera una lista de ids' }, HttpStatus.BAD_REQUEST);
    for (let i = 0; i < ids.length; i++) {
      await this.categorias.updateOne({ id: Number(ids[i]), restaurant_id: rid }, { $set: { orden: i } }).exec();
    }
    return { ok: true };
  }
}
