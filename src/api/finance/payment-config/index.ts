import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface PaymentMaintenanceVO {
  maintenanceId: number;
  clientId: number;
  maintenanceCode: string;
  adminName: string;
  direction: number;
  message?: string;
  messageVi?: string;
  status: number;
  hide: number;
  scheduleJson?: string;
  dependsOn?: string;
  sortOrder?: number;
  operatorId?: string;
  updatedAt?: string;
}

export interface PaymentLimitTierVO {
  tierCode: string;
  tierName: string;
  limitValue: number;
  sortOrder?: number;
  status?: number;
  updatedAt?: string;
}

export const listPaymentMaintenance = (): AxiosPromise<PaymentMaintenanceVO[]> =>
  request({ url: '/infra/finance/payment-maintenance/list', method: 'get' });

export const updatePaymentMaintenance = (data: PaymentMaintenanceVO): AxiosPromise<number> =>
  request({ url: '/infra/finance/payment-maintenance', method: 'put', data });

export const listPaymentLimitTiers = (): AxiosPromise<PaymentLimitTierVO[]> =>
  request({ url: '/infra/finance/payment-limit/list', method: 'get' });

export const updatePaymentLimitTier = (data: PaymentLimitTierVO): AxiosPromise<number> =>
  request({ url: '/infra/finance/payment-limit', method: 'put', data });
