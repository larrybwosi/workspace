import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const V2Context = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.v2Context;
  },
);
