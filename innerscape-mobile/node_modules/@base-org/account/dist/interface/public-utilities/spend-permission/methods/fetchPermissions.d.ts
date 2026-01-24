import { ProviderInterface } from '../../../../core/provider/interface.js';
import { SpendPermission } from '../../../../core/rpc/coinbase_fetchSpendPermissions.js';
type FetchPermissionsType = {
    account: string;
    chainId: number;
    spender: string;
};
export declare const fetchPermissions: (({ provider, account, chainId, spender, }: FetchPermissionsType & {
    provider: ProviderInterface;
}) => Promise<SpendPermission[]>) | ((args_0: FetchPermissionsType & {
    provider: ProviderInterface;
}) => Promise<SpendPermission[]>);
export {};
//# sourceMappingURL=fetchPermissions.d.ts.map