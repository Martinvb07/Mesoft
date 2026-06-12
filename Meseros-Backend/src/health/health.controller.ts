import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller(['healthz', 'api/healthz'])
export class HealthController {
  @Get()
  healthz() {
    return 'ok';
  }
}
