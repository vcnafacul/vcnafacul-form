import { HttpException, HttpStatus } from '@nestjs/common';
import { OwnerType } from 'src/modules/form/enum/owner-type.enum';

export interface OwnershipContext {
  ownerType: OwnerType;
  ownerId: string | null;
  isAdminContext: boolean;
}

export class OwnershipContextHelper {
  static extract(
    headers: Record<string, string | undefined>,
    adminSecret: string,
  ): OwnershipContext {
    const ownerType = headers['x-owner-type'] as OwnerType | undefined;
    const ownerId = headers['x-owner-id'] || null;
    const adminToken = headers['x-admin-context'];

    if (!ownerType || !Object.values(OwnerType).includes(ownerType)) {
      throw new HttpException(
        'Missing or invalid X-Owner-Type header',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isAdminContext =
      ownerType === OwnerType.GLOBAL && adminToken === adminSecret;

    if (ownerType === OwnerType.GLOBAL && !isAdminContext) {
      throw new HttpException(
        'Invalid admin context for global form',
        HttpStatus.FORBIDDEN,
      );
    }

    if (ownerType === OwnerType.PARTNER && !ownerId) {
      throw new HttpException(
        'X-Owner-Id required for partner context',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { ownerType, ownerId, isAdminContext };
  }

  static validateOwnership(
    context: OwnershipContext,
    form: { ownerType: OwnerType; ownerId: string | null },
  ): void {
    if (context.ownerType !== form.ownerType) {
      throw new HttpException(
        'Ownership mismatch: caller context does not match form owner',
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      context.ownerType === OwnerType.PARTNER &&
      context.ownerId !== form.ownerId
    ) {
      throw new HttpException(
        'Ownership mismatch: partnerId does not match form owner',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
