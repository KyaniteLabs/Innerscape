import { spendPermissionManagerAddress } from '../../../sign/base-account/utils/constants.js';
import { getAddress } from 'viem';
const ETERNITY_TIMESTAMP = 281474976710655; // 2^48 - 1
const SPEND_PERMISSION_TYPED_DATA_TYPES = {
    SpendPermission: [
        {
            name: 'account',
            type: 'address',
        },
        {
            name: 'spender',
            type: 'address',
        },
        {
            name: 'token',
            type: 'address',
        },
        {
            name: 'allowance',
            type: 'uint160',
        },
        {
            name: 'period',
            type: 'uint48',
        },
        {
            name: 'start',
            type: 'uint48',
        },
        {
            name: 'end',
            type: 'uint48',
        },
        {
            name: 'salt',
            type: 'uint256',
        },
        {
            name: 'extraData',
            type: 'bytes',
        },
    ],
};
export function createSpendPermissionTypedData(request) {
    const { account, spender, token, chainId, allowance, periodInDays, start, end, salt, extraData } = request;
    return {
        domain: {
            name: 'Spend Permission Manager',
            version: '1',
            chainId: chainId,
            verifyingContract: spendPermissionManagerAddress,
        },
        types: SPEND_PERMISSION_TYPED_DATA_TYPES,
        primaryType: 'SpendPermission',
        message: {
            account: getAddress(account),
            spender: getAddress(spender),
            token: getAddress(token),
            allowance: allowance.toString(),
            period: 86400 * periodInDays,
            start: dateToTimestampInSeconds(start !== null && start !== void 0 ? start : new Date()),
            end: end ? dateToTimestampInSeconds(end) : ETERNITY_TIMESTAMP,
            salt: salt !== null && salt !== void 0 ? salt : getRandomHexString(32),
            extraData: extraData ? extraData : '0x',
        },
    };
}
function getRandomHexString(byteLength) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    const hexString = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return `0x${hexString}`;
}
/**
 * Converts a JavaScript Date object to a Unix timestamp in seconds.
 *
 * @param date - The Date object to convert.
 * @returns The Unix timestamp in seconds.
 */
export function dateToTimestampInSeconds(date) {
    return Math.floor(date.getTime() / 1000);
}
/**

 * Converts a Unix timestamp in seconds to a Date object.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns A Date object.
 */
export function timestampInSecondsToDate(timestamp) {
    return new Date(timestamp * 1000);
}
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
export function toSpendPermissionArgs(permission) {
    const { account, spender, token, allowance: allowanceStr, period, start, end, salt, extraData, } = permission.permission;
    return {
        account: getAddress(account),
        spender: getAddress(spender),
        token: getAddress(token),
        allowance: BigInt(allowanceStr),
        period,
        start,
        end,
        salt: BigInt(salt),
        extraData: extraData,
    };
}
//# sourceMappingURL=utils.js.map