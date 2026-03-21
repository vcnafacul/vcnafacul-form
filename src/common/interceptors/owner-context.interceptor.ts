import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Env } from '../modules/env/env';
import { OwnerContext } from '../interfaces/owner-context.interface';

const EXEMPT_ROUTES = ['/v1/section/global-active'];

@Injectable()
export class OwnerContextInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService<Env>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    if (EXEMPT_ROUTES.includes(req.path)) {
      return next.handle();
    }

    const ownerType = req.headers['x-owner-type'] as string | undefined;

    if (!ownerType || !['GLOBAL', 'PARTNER'].includes(ownerType)) {
      throw new BadRequestException('X-Owner-Type header is required (GLOBAL or PARTNER)');
    }

    const ownerId = req.headers['x-owner-id'] as string | undefined;

    if (ownerType === 'PARTNER' && !ownerId) {
      throw new BadRequestException('X-Owner-Id header is required for PARTNER context');
    }

    if (ownerType === 'GLOBAL') {
      const adminSecret = req.headers['x-admin-context'] as string | undefined;
      const expectedSecret = this.configService.get('ADMIN_FORM_SECRET');
      if (expectedSecret && adminSecret !== expectedSecret) {
        throw new UnauthorizedException('Invalid admin context');
      }
    }

    const ownerContext: OwnerContext = {
      ownerType: ownerType as 'GLOBAL' | 'PARTNER',
      ownerId: ownerType === 'PARTNER' ? ownerId! : null,
    };

    req.ownerContext = ownerContext;
    return next.handle();
  }
}
