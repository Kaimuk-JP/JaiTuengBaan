import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';
import { Public } from './common/decorators/public.decorator';
import { mascotBase64 } from './common/constants/mascot.base64';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Public()
  async getHello(@Res() res: Response) {
    const dbHealth = await this.appService.checkDatabaseHealth();
    const isHealthy = dbHealth.status === 'success';

    const templatePath = join(process.cwd(), 'src/common/templates/landing-page.html');
    let html = readFileSync(templatePath, 'utf-8');

    html = html
      .replaceAll('{{MASCOT}}', mascotBase64)
      .replaceAll('{{STATUS_CLASS}}', isHealthy ? 'ok' : 'err')
      .replaceAll('{{STATUS_ICON}}', isHealthy ? '🟢' : '🔴')
      .replaceAll('{{DB_MESSAGE}}', dbHealth.message)
      .replaceAll('{{TIMESTAMP}}', new Date(dbHealth.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }));

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('health')
  @Public()
  async checkHealth() {
    return this.appService.checkDatabaseHealth();
  }
}
