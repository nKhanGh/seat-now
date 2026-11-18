import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ENTITLEMENT_KEY, EntitlementGuard } from './entitlement.guard';
import { EntitlementKey } from './services/entitlement.service';

export const RequireEntitlement = (key: EntitlementKey) => applyDecorators(SetMetadata(ENTITLEMENT_KEY, key), UseGuards(EntitlementGuard));
