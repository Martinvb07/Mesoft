import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppGateway } from './app.gateway';

@Global()
@Module({
  imports: [AuthModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
