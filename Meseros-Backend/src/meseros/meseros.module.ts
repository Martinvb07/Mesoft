import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { MeserosController } from './meseros.controller';
import { MeserosService } from './meseros.service';

@Module({
  imports: [GatewayModule],
  controllers: [MeserosController],
  providers: [MeserosService],
})
export class MeserosModule {}
