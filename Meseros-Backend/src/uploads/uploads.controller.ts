import { Controller, Get, HttpException, HttpStatus, Query, Req } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestWithTenant } from '../common/types/request-with-tenant';

/* Subida de imágenes a Cloudinary.
   El navegador pide aquí una firma y sube el archivo directo a Cloudinary: el
   API_SECRET nunca sale del servidor y la foto tampoco pasa por él (ni ancho
   de banda ni memoria ni timeouts con archivos grandes).
   La carpeta la fija el servidor por restaurante, así que un cliente no puede
   escribir en la carpeta de otro. */

const CARPETAS = ['categorias', 'productos'];

@Controller(['uploads', 'api/uploads'])
export class UploadsController {
  @Get('firma')
  @Roles('admin')
  firmar(@Req() req: RequestWithTenant, @Query('carpeta') carpetaRaw?: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new HttpException(
        { error: 'Cloudinary no está configurado en el servidor (faltan CLOUDINARY_* en el .env)' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const carpeta = String(carpetaRaw || 'categorias');
    if (!CARPETAS.includes(carpeta)) {
      throw new HttpException({ error: `Carpeta no permitida: ${carpeta}` }, HttpStatus.BAD_REQUEST);
    }

    const folder = `mesoft/${req.restaurantId}/${carpeta}`;
    const timestamp = Math.floor(Date.now() / 1000);

    /* Cloudinary firma los parámetros ordenados alfabéticamente, unidos con &,
       más el api_secret al final (sin separador). */
    const aFirmar = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash('sha1').update(aFirmar + apiSecret).digest('hex');

    return { cloudName, apiKey, timestamp, folder, signature };
  }
}
