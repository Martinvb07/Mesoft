import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SolicitudService } from './solicitud.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller(['solicitud', 'api/solicitud'])
export class SolicitudController {
  constructor(private readonly solicitud: SolicitudService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  send(@Body() body: any) {
    return this.solicitud.sendSolicitud(body);
  }
}
