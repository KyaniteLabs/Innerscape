import { SpendPermission } from '../../../core/rpc/coinbase_fetchSpendPermissions.js';
import { spendPermissionManagerAddress } from '../../../sign/base-account/utils/constants.js';
import { Address, Hex } from 'viem';
import { RequestSpendPermissionType } from './methods/requestSpendPermission.js';
declare const SPEND_PERMISSION_TYPED_DATA_TYPES: {
    SpendPermission: {
        name: string;
        type: string;
    }[];
};
export type SpendPermissionTypedData = {
    domain: {
        name: 'Spend Permission Manager';
        version: '1';
        chainId: number;
        verifyingContract: typeof spendPermissionManagerAddress;
    };
    types: typeof SPEND_PERMISSION_TYPED_DATA_TYPES;
    primaryType: 'SpendPermission';
    message: {
        account: Address;
        spender: Address;
        token: Address;
        allowance: string;
        period: number;
        start: number;
        end: number;
        salt: string;
        extraData: Hex;
    };
};
export declare function createSpendPermissionTypedData(request: RequestSpendPermissionType): SpendPermissionTypedData;
/**
 * Converts a JavaScript Date object to a Unix timestamp in seconds.
 *
 * @param date - The Date object to convert.
 * @returns The Unix timestamp in seconds.
 */
export declare function dateToTimestampInSeconds(date: Date): number;
/**

 * Converts a Unix timestamp in seconds to a Date object.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns A Date object.
 */
export declare function timestampInSecondsToDate(timestamp: number): Date;
/**
 * Converts a SpendPermission object to the arguments expected by the SpendPermissionManager contract.
 *
 * This function creates the standard args in the correct order.
 *
 * @param permission - The SpendPermission object to convert.
 * @returns The arguments expected by the SpendPermissionManager contract.
 *
 * @example
 * ```typescript
 * import { toSpendPermissionArgs } from '@base-org/account/spend-permission';
 *
 * const args = toSpendPermissionArgs(permission);
 * const currentPeriod = await readContract(client, {
 *   address: spendPermissionManagerAddress,
 *   abi: spendPermissionManagerAbi,
 *   functionName: 'getCurrentPeriod',
 *   args: [args]
 * });
 * ```
 */
export declare function toSpendPermissionArgs(permission: SpendPermission): {
    account: `0x${string}`;
    spender: `0x${string}`;
    token: `0x${string}`;
    allowance: bigint;
    period: number;
    start: number;
    end: number;
    salt: bigint;
    extraData: Hex;
};
export {};
//# sourceMappingURL=utils.d.ts.map