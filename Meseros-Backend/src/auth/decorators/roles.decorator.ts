import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Restringe un endpoint a usuarios con alguno de estos roles
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
