import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
// Endpoints require authentication by default. Opt out explicitly with @Public().
export const Public = () => SetMetadata(IS_PUBLIC, true);
