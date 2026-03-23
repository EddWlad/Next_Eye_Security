import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health(): { message: string; timestamp: string } {
    return {
      message: 'NextEyeSecurity backend operativo',
      timestamp: new Date().toISOString(),
    };
  }
}
