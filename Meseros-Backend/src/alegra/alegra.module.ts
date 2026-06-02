import { Global, Module } from '@nestjs/common';
import { AlegraService } from './alegra.service';

@Global()
@Module({
  providers: [AlegraService],
  exports: [AlegraService],
})
export class AlegraModule {}
