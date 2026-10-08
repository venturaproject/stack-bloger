import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller()
export class WebController {
  @Get()
  root(@Res() res: Response) {
    return res.redirect('/login');
  }

  @Get('login')
  login(@Res() res: Response) {
    return this.serveSpa(res);
  }

  @Get('admin')
  admin(@Res() res: Response) {
    return this.serveSpa(res);
  }

  @Get('admin/*path')
  adminWildcard(@Res() res: Response) {
    return this.serveSpa(res);
  }

  @Get('blog')
  blogIndex(@Res() res: Response) {
    return this.serveSpa(res);
  }

  @Get('blog/*path')
  blogWildcard(@Res() res: Response) {
    return this.serveSpa(res);
  }

  private serveSpa(res: Response) {
    const buildPath = join(process.cwd(), 'public', 'build', 'index.html');
    const devFallback = join(process.cwd(), 'public', 'index.html');

    if (existsSync(buildPath)) {
      return res.sendFile(buildPath);
    }

    if (existsSync(devFallback)) {
      return res.sendFile(devFallback);
    }

    return res.status(200).send('Blog API is running');
  }
}
