import { SetMetadata } from '@nestjs/common';

export const GROUP_PERMISSION_KEY = 'groupPermission';

export const RequireGroupPermission = (permKey: string) =>
  SetMetadata(GROUP_PERMISSION_KEY, permKey);
