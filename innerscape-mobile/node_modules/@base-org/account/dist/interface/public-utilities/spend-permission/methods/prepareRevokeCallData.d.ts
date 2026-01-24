import { SpendPermission } from '../../../../core/rpc/coinbase_fetchSpendPermissions.js';
import { Address, Hex } from 'viem';
type RevokeSpendPermissionResponse = {
    to: Address;
    data: Hex;
    value: '0x0';
};
export declare const prepareRevokeCallData: ((permission: SpendPermission) => Promise<RevokeSpendPermissionResponse>) | ((permission: SpendPermission) => Promise<RevokeSpendPermissionResponse>);
export {};
//# sourceMappingURL=prepareRevokeCallData.d.ts.map