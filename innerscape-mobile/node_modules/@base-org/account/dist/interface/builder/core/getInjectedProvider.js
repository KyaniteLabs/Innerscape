const TBA_PROVIDER_IDENTIFIER = 'isCoinbaseBrowser';
export function getInjectedProvider() {
    var _a, _b;
    const injectedProvider = (_b = (_a = window.top) === null || _a === void 0 ? void 0 : _a.ethereum) !== null && _b !== void 0 ? _b : window.ethereum;
    if (injectedProvider === null || injectedProvider === void 0 ? void 0 : injectedProvider[TBA_PROVIDER_IDENTIFIER]) {
        return injectedProvider;
    }
    return null;
}
//# sourceMappingURL=getInjectedProvider.js.map