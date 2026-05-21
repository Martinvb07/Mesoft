import { Body, Controller, Post } from '@nestjs/common';
import { SolicitudService } from './solicitud.service';

@Controller(['solicitud', 'api/solicitud'])
export class SolicitudController {
  constructor(private readonly solicitud: SolicitudService) {}

  @Post()
  send(@Body() body: any) {
    return this.solicitud.sendSolicitud(body);
  }
}
