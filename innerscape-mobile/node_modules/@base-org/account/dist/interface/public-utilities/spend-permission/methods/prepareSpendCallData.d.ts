import { SpendPermission } from '../../../../core/rpc/coinbase_fetchSpendPermissions.js';
import { Address, Hex } from 'viem';
type Call = {
    to: Address;
    data: Hex;
    value: '0x0';
};
export type PrepareSpendCallDataResponseType = Call[];
export declare const prepareSpendCallData: ((permission: SpendPermission, amount: bigint | "max-remaining-allowance") => Promise<PrepareSpendCallDataResponseType>) | ((permission: SpendPermission, amount: bigint | "max-remaining-allowance") => Promise<PrepareSpendCallDataResponseType>);
export {};
//# sourceMappingURL=prepareSpendCallData.d.ts.map