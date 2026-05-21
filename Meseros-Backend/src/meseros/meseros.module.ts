import { Module } from '@nestjs/common';
import { MeserosController } from './meseros.controller';
import { MeserosService } from './meseros.service';

@Module({
  controllers: [MeserosController],
  providers: [MeserosService],
})
export class MeserosModule {}
