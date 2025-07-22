// src/utils/productHelpers.ts
import { ProductStatus } from '@/types';

const allowedStatuses = ['active', 'inactive', 'pending_review'] as const;

export function toProductStatus(status: string): ProductStatus | undefined {
  return allowedStatuses.includes(status as ProductStatus)
    ? (status as ProductStatus)
    : undefined;
}
