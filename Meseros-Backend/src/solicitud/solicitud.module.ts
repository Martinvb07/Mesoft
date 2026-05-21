import { Module } from '@nestjs/common';
import { SolicitudController } from './solicitud.controller';
import { SolicitudService } from './solicitud.service';

@Module({
  controllers: [SolicitudController],
  providers: [SolicitudService],
})
export class SolicitudModule {}
