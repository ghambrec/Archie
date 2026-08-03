import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export const RequirePermission = (permKey: string) =>
  SetMetadata(PERMISSION_KEY, permKey);
