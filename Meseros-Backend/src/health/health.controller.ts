import { Controller, Get } from '@nestjs/common';

@Controller(['healthz', 'api/healthz'])
export class HealthController {
  @Get()
  healthz() {
    return 'ok';
  }
}
