import { Controller, All, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from './better-auth';
import { toNodeHandler } from 'better-auth/node';

@Controller('auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return toNodeHandler(auth)(req.raw, res.raw);
  }
}
