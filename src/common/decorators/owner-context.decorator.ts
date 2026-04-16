import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OwnerContext as OwnerContextType } from '../interfaces/owner-context.interface';

export const OwnerContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OwnerContextType => {
    const request = ctx.switchToHttp().getRequest();
    return request.ownerContext;
  },
);
