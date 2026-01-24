import { SpendPermission } from '../../../../core/rpc/coinbase_fetchSpendPermissions.js';
export type GetPermissionStatusResponseType = {
    remainingSpend: bigint;
    nextPeriodStart: Date;
    isActive: boolean;
};
export declare const getPermissionStatus: ((permission: SpendPermission) => Promise<GetPermissionStatusResponseType>) | ((permission: SpendPermission) => Promise<GetPermissionStatusResponseType>);
//# sourceMappingURL=getPermissionStatus.d.ts.map