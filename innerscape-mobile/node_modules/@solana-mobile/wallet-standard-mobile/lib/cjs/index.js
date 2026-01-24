'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var walletStandardFeatures = require('@solana/wallet-standard-features');
var QRCode = require('qrcode');
var mobileWalletAdapterProtocol = require('@solana-mobile/mobile-wallet-adapter-protocol');
var features = require('@wallet-standard/features');
var base58 = require('bs58');
var walletStandardChains = require('@solana/wallet-standard-chains');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var QRCode__default = /*#__PURE__*/_interopDefaultLegacy(QRCode);
var base58__default = /*#__PURE__*/_interopDefaultLegacy(base58);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __classPrivateFieldGet$1(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet$1(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

var _EmbeddedModal_instances, _EmbeddedModal_root, _EmbeddedModal_eventListeners, _EmbeddedModal_listenersAttached, _EmbeddedModal_injectHTML, _EmbeddedModal_attachEventListeners, _EmbeddedModal_removeEventListeners, _EmbeddedModal_handleKeyDown;
const modalHtml = `
<div class="mobile-wallet-adapter-embedded-modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div data-modal-close style="position: absolute; width: 100%; height: 100%;"></div>
	<div class="mobile-wallet-adapter-embedded-modal-card">
		<div>
			<button data-modal-close class="mobile-wallet-adapter-embedded-modal-close">
				<svg width="14" height="14">
					<path d="M 6.7125,8.3036995 1.9082,13.108199 c -0.2113,0.2112 -0.4765,0.3168 -0.7957,0.3168 -0.3192,0 -0.5844,-0.1056 -0.7958,-0.3168 C 0.1056,12.896899 0,12.631699 0,12.312499 c 0,-0.3192 0.1056,-0.5844 0.3167,-0.7958 L 5.1212,6.7124995 0.3167,1.9082 C 0.1056,1.6969 0,1.4317 0,1.1125 0,0.7933 0.1056,0.5281 0.3167,0.3167 0.5281,0.1056 0.7933,0 1.1125,0 1.4317,0 1.6969,0.1056 1.9082,0.3167 L 6.7125,5.1212 11.5167,0.3167 C 11.7281,0.1056 11.9933,0 12.3125,0 c 0.3192,0 0.5844,0.1056 0.7957,0.3167 0.2112,0.2114 0.3168,0.4766 0.3168,0.7958 0,0.3192 -0.1056,0.5844 -0.3168,0.7957 L 8.3037001,6.7124995 13.1082,11.516699 c 0.2112,0.2114 0.3168,0.4766 0.3168,0.7958 0,0.3192 -0.1056,0.5844 -0.3168,0.7957 -0.2113,0.2112 -0.4765,0.3168 -0.7957,0.3168 -0.3192,0 -0.5844,-0.1056 -0.7958,-0.3168 z" />
				</svg>
			</button>
		</div>
		<div class="mobile-wallet-adapter-embedded-modal-content"></div>
	</div>
</div>
`;
const css$2 = `
.mobile-wallet-adapter-embedded-modal-container {
    display: flex; /* Use flexbox to center content */
    justify-content: center; /* Center horizontally */
    align-items: center; /* Center vertically */
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    overflow-y: auto; /* enable scrolling */
}

.mobile-wallet-adapter-embedded-modal-card {
    display: flex;
    flex-direction: column;
    margin: auto 20px;
    max-width: 780px;
    padding: 20px;
    border-radius: 24px;
    background: #ffffff;
    font-family: "Inter Tight", "PT Sans", Calibri, sans-serif;
    transform: translateY(-200%);
    animation: slide-in 0.5s forwards;
}

@keyframes slide-in {
    100% { transform: translateY(0%); }
}

.mobile-wallet-adapter-embedded-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    cursor: pointer;
    background: #e4e9e9;
    border: none;
    border-radius: 50%;
}

.mobile-wallet-adapter-embedded-modal-close:focus-visible {
    outline-color: red;
}

.mobile-wallet-adapter-embedded-modal-close svg {
    fill: #546266;
    transition: fill 200ms ease 0s;
}

.mobile-wallet-adapter-embedded-modal-close:hover svg {
    fill: #fff;
}
`;
const fonts = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
`;
class EmbeddedModal {
    constructor() {
        _EmbeddedModal_instances.add(this);
        _EmbeddedModal_root.set(this, null);
        _EmbeddedModal_eventListeners.set(this, {});
        _EmbeddedModal_listenersAttached.set(this, false);
        this.dom = null;
        this.open = () => {
            console.debug('Modal open');
            __classPrivateFieldGet$1(this, _EmbeddedModal_instances, "m", _EmbeddedModal_attachEventListeners).call(this);
            if (__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f")) {
                __classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").style.display = 'flex';
            }
        };
        this.close = (event = undefined) => {
            var _a;
            console.debug('Modal close');
            __classPrivateFieldGet$1(this, _EmbeddedModal_instances, "m", _EmbeddedModal_removeEventListeners).call(this);
            if (__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f")) {
                __classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").style.display = 'none';
            }
            (_a = __classPrivateFieldGet$1(this, _EmbeddedModal_eventListeners, "f")['close']) === null || _a === void 0 ? void 0 : _a.forEach((listener) => listener(event));
        };
        _EmbeddedModal_handleKeyDown.set(this, (event) => {
            if (event.key === 'Escape')
                this.close(event);
        });
        // Bind methods to ensure `this` context is correct
        this.init = this.init.bind(this);
        __classPrivateFieldSet$1(this, _EmbeddedModal_root, document.getElementById('mobile-wallet-adapter-embedded-root-ui'), "f");
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Injecting modal');
            __classPrivateFieldGet$1(this, _EmbeddedModal_instances, "m", _EmbeddedModal_injectHTML).call(this);
        });
    }
    addEventListener(event, listener) {
        var _a;
        ((_a = __classPrivateFieldGet$1(this, _EmbeddedModal_eventListeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.push(listener)) || (__classPrivateFieldGet$1(this, _EmbeddedModal_eventListeners, "f")[event] = [listener]);
        return () => this.removeEventListener(event, listener);
    }
    removeEventListener(event, listener) {
        var _a;
        __classPrivateFieldGet$1(this, _EmbeddedModal_eventListeners, "f")[event] = (_a = __classPrivateFieldGet$1(this, _EmbeddedModal_eventListeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.filter((existingListener) => listener !== existingListener);
    }
}
_EmbeddedModal_root = new WeakMap(), _EmbeddedModal_eventListeners = new WeakMap(), _EmbeddedModal_listenersAttached = new WeakMap(), _EmbeddedModal_handleKeyDown = new WeakMap(), _EmbeddedModal_instances = new WeakSet(), _EmbeddedModal_injectHTML = function _EmbeddedModal_injectHTML() {
    // Check if the HTML has already been injected
    if (document.getElementById('mobile-wallet-adapter-embedded-root-ui')) {
        if (!__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f"))
            __classPrivateFieldSet$1(this, _EmbeddedModal_root, document.getElementById('mobile-wallet-adapter-embedded-root-ui'), "f");
        return;
    }
    // Create a container for the modal
    __classPrivateFieldSet$1(this, _EmbeddedModal_root, document.createElement('div'), "f");
    __classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").id = 'mobile-wallet-adapter-embedded-root-ui';
    __classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").innerHTML = modalHtml;
    __classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").style.display = 'none';
    // Add modal content
    const content = __classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").querySelector('.mobile-wallet-adapter-embedded-modal-content');
    if (content)
        content.innerHTML = this.contentHtml;
    // Apply styles
    const styles = document.createElement('style');
    styles.id = 'mobile-wallet-adapter-embedded-modal-styles';
    styles.textContent = css$2 + this.contentStyles;
    // Create a shadow DOM to encapsulate the modal
    const host = document.createElement('div');
    host.innerHTML = fonts;
    this.dom = host.attachShadow({ mode: 'closed' });
    this.dom.appendChild(styles);
    this.dom.appendChild(__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f"));
    // Append the shadow DOM host to the body
    document.body.appendChild(host);
}, _EmbeddedModal_attachEventListeners = function _EmbeddedModal_attachEventListeners() {
    if (!__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f") || __classPrivateFieldGet$1(this, _EmbeddedModal_listenersAttached, "f"))
        return;
    const closers = [...__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").querySelectorAll('[data-modal-close]')];
    closers.forEach(closer => closer === null || closer === void 0 ? void 0 : closer.addEventListener('click', this.close));
    window.addEventListener('load', this.close);
    document.addEventListener('keydown', __classPrivateFieldGet$1(this, _EmbeddedModal_handleKeyDown, "f"));
    __classPrivateFieldSet$1(this, _EmbeddedModal_listenersAttached, true, "f");
}, _EmbeddedModal_removeEventListeners = function _EmbeddedModal_removeEventListeners() {
    if (!__classPrivateFieldGet$1(this, _EmbeddedModal_listenersAttached, "f"))
        return;
    window.removeEventListener('load', this.close);
    document.removeEventListener('keydown', __classPrivateFieldGet$1(this, _EmbeddedModal_handleKeyDown, "f"));
    if (!__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f"))
        return;
    const closers = [...__classPrivateFieldGet$1(this, _EmbeddedModal_root, "f").querySelectorAll('[data-modal-close]')];
    closers.forEach(closer => closer === null || closer === void 0 ? void 0 : closer.removeEventListener('click', this.close));
    __classPrivateFieldSet$1(this, _EmbeddedModal_listenersAttached, false, "f");
};

class RemoteConnectionModal extends EmbeddedModal {
    constructor() {
        super(...arguments);
        this.contentStyles = css$1;
        this.contentHtml = QRCodeHtml;
    }
    initWithQR(qrCode) {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.init.call(this);
            this.populateQRCode(qrCode);
        });
    }
    populateQRCode(qrUrl) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const qrcodeContainer = (_a = this.dom) === null || _a === void 0 ? void 0 : _a.getElementById('mobile-wallet-adapter-embedded-modal-qr-code-container');
            if (qrcodeContainer) {
                const qrCodeElement = yield QRCode__default["default"].toCanvas(qrUrl, { width: 200, margin: 0 });
                if (qrcodeContainer.firstElementChild !== null) {
                    qrcodeContainer.replaceChild(qrCodeElement, qrcodeContainer.firstElementChild);
                }
                else
                    qrcodeContainer.appendChild(qrCodeElement);
            }
            else {
                console.error('QRCode Container not found');
            }
        });
    }
}
const QRCodeHtml = `
<div class="mobile-wallet-adapter-embedded-modal-qr-content">
    <div>
        <svg class="mobile-wallet-adapter-embedded-modal-icon" width="100%" height="100%">
            <circle r="52" cx="53" cy="53" fill="#99b3be" stroke="#000000" stroke-width="2"/>
            <path d="m 53,82.7305 c -3.3116,0 -6.1361,-1.169 -8.4735,-3.507 -2.338,-2.338 -3.507,-5.1625 -3.507,-8.4735 0,-3.3116 1.169,-6.1364 3.507,-8.4744 2.3374,-2.338 5.1619,-3.507 8.4735,-3.507 3.3116,0 6.1361,1.169 8.4735,3.507 2.338,2.338 3.507,5.1628 3.507,8.4744 0,3.311 -1.169,6.1355 -3.507,8.4735 -2.3374,2.338 -5.1619,3.507 -8.4735,3.507 z m 0.007,-5.25 c 1.8532,0 3.437,-0.6598 4.7512,-1.9793 1.3149,-1.3195 1.9723,-2.9058 1.9723,-4.7591 0,-1.8526 -0.6598,-3.4364 -1.9793,-4.7512 -1.3195,-1.3149 -2.9055,-1.9723 -4.7582,-1.9723 -1.8533,0 -3.437,0.6598 -4.7513,1.9793 -1.3148,1.3195 -1.9722,2.9058 -1.9722,4.7591 0,1.8527 0.6597,3.4364 1.9792,4.7512 1.3195,1.3149 2.9056,1.9723 4.7583,1.9723 z m -28,-33.5729 -3.85,-3.6347 c 4.1195,-4.025 8.8792,-7.1984 14.2791,-9.52 5.4005,-2.3223 11.2551,-3.4834 17.5639,-3.4834 6.3087,0 12.1634,1.1611 17.5639,3.4834 5.3999,2.3216 10.1596,5.495 14.2791,9.52 l -3.85,3.6347 C 77.2999,40.358 73.0684,37.5726 68.2985,35.5514 63.5292,33.5301 58.4296,32.5195 53,32.5195 c -5.4297,0 -10.5292,1.0106 -15.2985,3.0319 -4.7699,2.0212 -9.0014,4.8066 -12.6945,8.3562 z m 44.625,10.8771 c -2.2709,-2.1046 -4.7962,-3.7167 -7.5758,-4.8361 -2.7795,-1.12 -5.7983,-1.68 -9.0562,-1.68 -3.2579,0 -6.2621,0.56 -9.0125,1.68 -2.7504,1.1194 -5.2903,2.7315 -7.6195,4.8361 L 32.5189,51.15 c 2.8355,-2.6028 5.9777,-4.6086 9.4263,-6.0174 3.4481,-1.4087 7.133,-2.1131 11.0548,-2.1131 3.9217,0 7.5979,0.7044 11.0285,2.1131 3.43,1.4088 6.5631,3.4146 9.3992,6.0174 z"/>
        </svg>
        <div class="mobile-wallet-adapter-embedded-modal-title">Remote Mobile Wallet Adapter</div>
    </div>
    <div>
        <div>
            <h4 class="mobile-wallet-adapter-embedded-modal-qr-label">
                Open your wallet and scan this code
            </h4>
        </div>
        <div id="mobile-wallet-adapter-embedded-modal-qr-code-container" class="mobile-wallet-adapter-embedded-modal-qr-code-container"></div>
    </div>
</div>
<div class="mobile-wallet-adapter-embedded-modal-divider"><hr></div>
<div class="mobile-wallet-adapter-embedded-modal-footer">
    <div class="mobile-wallet-adapter-embedded-modal-subtitle">
        Follow the instructions on your device. When you're finished, this screen will update.
    </div>
    <div class="mobile-wallet-adapter-embedded-modal-progress-badge">
        <div>
            <div class="spinner">
                <div class="leftWrapper">
                    <div class="left">
                        <div class="circle"></div>
                    </div>
                </div>
                <div class="rightWrapper">
                    <div class="right">
                        <div class="circle"></div>
                    </div>
                </div>
            </div>
        </div>
        <div>Waiting for scan</div>
    </div>
</div>
`;
const css$1 = `
.mobile-wallet-adapter-embedded-modal-qr-content {
    display: flex; 
    margin-top: 10px;
    padding: 10px;
}

.mobile-wallet-adapter-embedded-modal-qr-content > div:first-child {
    display: flex;
    flex-direction: column;
    flex: 2;
    margin-top: auto;
    margin-right: 30px;
}

.mobile-wallet-adapter-embedded-modal-qr-content > div:nth-child(2) {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: auto;
}

.mobile-wallet-adapter-embedded-modal-footer {
    display: flex;
    padding: 10px;
}

.mobile-wallet-adapter-embedded-modal-icon {}

.mobile-wallet-adapter-embedded-modal-title {
    color: #000000;
    font-size: 2.5em;
    font-weight: 600;
}

.mobile-wallet-adapter-embedded-modal-qr-label {
    text-align: right;
    color: #000000;
}

.mobile-wallet-adapter-embedded-modal-qr-code-container {
    margin-left: auto;
}

.mobile-wallet-adapter-embedded-modal-divider {
    margin-top: 20px;
    padding-left: 10px;
    padding-right: 10px;
}

.mobile-wallet-adapter-embedded-modal-divider hr {
    border-top: 1px solid #D9DEDE;
}

.mobile-wallet-adapter-embedded-modal-subtitle {
    margin: auto;
    margin-right: 60px;
    padding: 20px;
    color: #6E8286;
}

.mobile-wallet-adapter-embedded-modal-progress-badge {
    display: flex;
    background: #F7F8F8;
    height: 56px;
    min-width: 200px;
    margin: auto;
    padding-left: 20px;
    padding-right: 20px;
    border-radius: 18px;
    color: #A8B6B8;
    align-items: center;
}

.mobile-wallet-adapter-embedded-modal-progress-badge > div:first-child {
    margin-left: auto;
    margin-right: 20px;
}

.mobile-wallet-adapter-embedded-modal-progress-badge > div:nth-child(2) {
    margin-right: auto;
}

/* Smaller screens */
@media all and (max-width: 600px) {
    .mobile-wallet-adapter-embedded-modal-card {
        text-align: center;
    }
    .mobile-wallet-adapter-embedded-modal-qr-content {
        flex-direction: column;
    }
    .mobile-wallet-adapter-embedded-modal-qr-content > div:first-child {
        margin: auto;
    }
    .mobile-wallet-adapter-embedded-modal-qr-content > div:nth-child(2) {
        margin: auto;
        flex: 2 auto;
    }
    .mobile-wallet-adapter-embedded-modal-footer {
        flex-direction: column;
    }
    .mobile-wallet-adapter-embedded-modal-icon {
        display: none;
    }
    .mobile-wallet-adapter-embedded-modal-title {
        font-size: 1.5em;
    }
    .mobile-wallet-adapter-embedded-modal-subtitle {
        margin-right: unset;
    }
    .mobile-wallet-adapter-embedded-modal-qr-label {
        text-align: center;
    }
    .mobile-wallet-adapter-embedded-modal-qr-code-container {
        margin: auto;
    }
}

/* Spinner */
@keyframes spinLeft {
    0% {
        transform: rotate(20deg);
    }
    50% {
        transform: rotate(160deg);
    }
    100% {
        transform: rotate(20deg);
    }
}
@keyframes spinRight {
    0% {
        transform: rotate(160deg);
    }
    50% {
        transform: rotate(20deg);
    }
    100% {
        transform: rotate(160deg);
    }
}
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(2520deg);
    }
}

.spinner {
    position: relative;
    width: 1.5em;
    height: 1.5em;
    margin: auto;
    animation: spin 10s linear infinite;
}
.spinner::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}
.right, .rightWrapper, .left, .leftWrapper {
    position: absolute;
    top: 0;
    overflow: hidden;
    width: .75em;
    height: 1.5em;
}
.left, .leftWrapper {
    left: 0;
}
.right {
    left: -12px;
}
.rightWrapper {
    right: 0;
}
.circle {
    border: .125em solid #A8B6B8;
    width: 1.25em; /* 1.5em - 2*0.125em border */
    height: 1.25em; /* 1.5em - 2*0.125em border */
    border-radius: 0.75em; /* 0.5*1.5em spinner size 8 */
}
.left {
    transform-origin: 100% 50%;
    animation: spinLeft 2.5s cubic-bezier(.2,0,.8,1) infinite;
}
.right {
    transform-origin: 100% 50%;
    animation: spinRight 2.5s cubic-bezier(.2,0,.8,1) infinite;
}
`;

const icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03IDIuNUgxN0MxNy44Mjg0IDIuNSAxOC41IDMuMTcxNTcgMTguNSA0VjIwQzE4LjUgMjAuODI4NCAxNy44Mjg0IDIxLjUgMTcgMjEuNUg3QzYuMTcxNTcgMjEuNSA1LjUgMjAuODI4NCA1LjUgMjBWNEM1LjUgMy4xNzE1NyA2LjE3MTU3IDIuNSA3IDIuNVpNMyA0QzMgMS43OTA4NiA0Ljc5MDg2IDAgNyAwSDE3QzE5LjIwOTEgMCAyMSAxLjc5MDg2IDIxIDRWMjBDMjEgMjIuMjA5MSAxOS4yMDkxIDI0IDE3IDI0SDdDNC43OTA4NiAyNCAzIDIyLjIwOTEgMyAyMFY0Wk0xMSA0LjYxNTM4QzEwLjQ0NzcgNC42MTUzOCAxMCA1LjA2MzEgMTAgNS42MTUzOFY2LjM4NDYyQzEwIDYuOTM2OSAxMC40NDc3IDcuMzg0NjIgMTEgNy4zODQ2MkgxM0MxMy41NTIzIDcuMzg0NjIgMTQgNi45MzY5IDE0IDYuMzg0NjJWNS42MTUzOEMxNCA1LjA2MzEgMTMuNTUyMyA0LjYxNTM4IDEzIDQuNjE1MzhIMTFaIiBmaWxsPSIjRENCOEZGIi8+Cjwvc3ZnPgo=';

function fromUint8Array(byteArray) {
    return window.btoa(String.fromCharCode.call(null, ...byteArray));
}
function toUint8Array(base64EncodedByteArray) {
    return new Uint8Array(window
        .atob(base64EncodedByteArray)
        .split('')
        .map((c) => c.charCodeAt(0)));
}

var _LocalSolanaMobileWalletAdapterWallet_instances, _LocalSolanaMobileWalletAdapterWallet_listeners, _LocalSolanaMobileWalletAdapterWallet_version, _LocalSolanaMobileWalletAdapterWallet_name, _LocalSolanaMobileWalletAdapterWallet_url, _LocalSolanaMobileWalletAdapterWallet_icon, _LocalSolanaMobileWalletAdapterWallet_appIdentity, _LocalSolanaMobileWalletAdapterWallet_authorization, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, _LocalSolanaMobileWalletAdapterWallet_connecting, _LocalSolanaMobileWalletAdapterWallet_connectionGeneration, _LocalSolanaMobileWalletAdapterWallet_chains, _LocalSolanaMobileWalletAdapterWallet_chainSelector, _LocalSolanaMobileWalletAdapterWallet_optionalFeatures, _LocalSolanaMobileWalletAdapterWallet_onWalletNotFound, _LocalSolanaMobileWalletAdapterWallet_on, _LocalSolanaMobileWalletAdapterWallet_emit, _LocalSolanaMobileWalletAdapterWallet_off, _LocalSolanaMobileWalletAdapterWallet_connect, _LocalSolanaMobileWalletAdapterWallet_performAuthorization, _LocalSolanaMobileWalletAdapterWallet_handleAuthorizationResult, _LocalSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult, _LocalSolanaMobileWalletAdapterWallet_performReauthorization, _LocalSolanaMobileWalletAdapterWallet_disconnect, _LocalSolanaMobileWalletAdapterWallet_transact, _LocalSolanaMobileWalletAdapterWallet_assertIsAuthorized, _LocalSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts, _LocalSolanaMobileWalletAdapterWallet_performSignTransactions, _LocalSolanaMobileWalletAdapterWallet_performSignAndSendTransaction, _LocalSolanaMobileWalletAdapterWallet_signAndSendTransaction, _LocalSolanaMobileWalletAdapterWallet_signTransaction, _LocalSolanaMobileWalletAdapterWallet_signMessage, _LocalSolanaMobileWalletAdapterWallet_signIn, _LocalSolanaMobileWalletAdapterWallet_performSignIn, _RemoteSolanaMobileWalletAdapterWallet_instances, _RemoteSolanaMobileWalletAdapterWallet_listeners, _RemoteSolanaMobileWalletAdapterWallet_version, _RemoteSolanaMobileWalletAdapterWallet_name, _RemoteSolanaMobileWalletAdapterWallet_url, _RemoteSolanaMobileWalletAdapterWallet_icon, _RemoteSolanaMobileWalletAdapterWallet_appIdentity, _RemoteSolanaMobileWalletAdapterWallet_authorization, _RemoteSolanaMobileWalletAdapterWallet_authorizationCache, _RemoteSolanaMobileWalletAdapterWallet_connecting, _RemoteSolanaMobileWalletAdapterWallet_connectionGeneration, _RemoteSolanaMobileWalletAdapterWallet_chains, _RemoteSolanaMobileWalletAdapterWallet_chainSelector, _RemoteSolanaMobileWalletAdapterWallet_optionalFeatures, _RemoteSolanaMobileWalletAdapterWallet_onWalletNotFound, _RemoteSolanaMobileWalletAdapterWallet_hostAuthority, _RemoteSolanaMobileWalletAdapterWallet_session, _RemoteSolanaMobileWalletAdapterWallet_on, _RemoteSolanaMobileWalletAdapterWallet_emit, _RemoteSolanaMobileWalletAdapterWallet_off, _RemoteSolanaMobileWalletAdapterWallet_connect, _RemoteSolanaMobileWalletAdapterWallet_performAuthorization, _RemoteSolanaMobileWalletAdapterWallet_handleAuthorizationResult, _RemoteSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult, _RemoteSolanaMobileWalletAdapterWallet_performReauthorization, _RemoteSolanaMobileWalletAdapterWallet_disconnect, _RemoteSolanaMobileWalletAdapterWallet_transact, _RemoteSolanaMobileWalletAdapterWallet_assertIsAuthorized, _RemoteSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts, _RemoteSolanaMobileWalletAdapterWallet_performSignTransactions, _RemoteSolanaMobileWalletAdapterWallet_performSignAndSendTransaction, _RemoteSolanaMobileWalletAdapterWallet_signAndSendTransaction, _RemoteSolanaMobileWalletAdapterWallet_signTransaction, _RemoteSolanaMobileWalletAdapterWallet_signMessage, _RemoteSolanaMobileWalletAdapterWallet_signIn, _RemoteSolanaMobileWalletAdapterWallet_performSignIn;
const SolanaMobileWalletAdapterWalletName = 'Mobile Wallet Adapter';
const SolanaMobileWalletAdapterRemoteWalletName = 'Remote Mobile Wallet Adapter';
const SIGNATURE_LENGTH_IN_BYTES = 64;
const DEFAULT_FEATURES = [walletStandardFeatures.SolanaSignAndSendTransaction, walletStandardFeatures.SolanaSignTransaction, walletStandardFeatures.SolanaSignMessage, walletStandardFeatures.SolanaSignIn];
class LocalSolanaMobileWalletAdapterWallet {
    constructor(config) {
        _LocalSolanaMobileWalletAdapterWallet_instances.add(this);
        _LocalSolanaMobileWalletAdapterWallet_listeners.set(this, {});
        _LocalSolanaMobileWalletAdapterWallet_version.set(this, '1.0.0'); // wallet-standard version
        _LocalSolanaMobileWalletAdapterWallet_name.set(this, SolanaMobileWalletAdapterWalletName);
        _LocalSolanaMobileWalletAdapterWallet_url.set(this, 'https://solanamobile.com/wallets');
        _LocalSolanaMobileWalletAdapterWallet_icon.set(this, icon);
        _LocalSolanaMobileWalletAdapterWallet_appIdentity.set(this, void 0);
        _LocalSolanaMobileWalletAdapterWallet_authorization.set(this, void 0);
        _LocalSolanaMobileWalletAdapterWallet_authorizationCache.set(this, void 0);
        _LocalSolanaMobileWalletAdapterWallet_connecting.set(this, false);
        /**
         * Every time the connection is recycled in some way (eg. `disconnect()` is called)
         * increment this and use it to make sure that `transact` calls from the previous
         * 'generation' don't continue to do work and throw exceptions.
         */
        _LocalSolanaMobileWalletAdapterWallet_connectionGeneration.set(this, 0);
        _LocalSolanaMobileWalletAdapterWallet_chains.set(this, []);
        _LocalSolanaMobileWalletAdapterWallet_chainSelector.set(this, void 0);
        _LocalSolanaMobileWalletAdapterWallet_optionalFeatures.set(this, void 0);
        _LocalSolanaMobileWalletAdapterWallet_onWalletNotFound.set(this, void 0);
        _LocalSolanaMobileWalletAdapterWallet_on.set(this, (event, listener) => {
            var _a;
            ((_a = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_listeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.push(listener)) || (__classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_listeners, "f")[event] = [listener]);
            return () => __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_instances, "m", _LocalSolanaMobileWalletAdapterWallet_off).call(this, event, listener);
        });
        _LocalSolanaMobileWalletAdapterWallet_connect.set(this, ({ silent } = {}) => __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_connecting, "f") || this.connected) {
                return { accounts: this.accounts };
            }
            __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_connecting, true, "f");
            try {
                if (silent) {
                    const cachedAuthorization = yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, "f").get();
                    if (cachedAuthorization) {
                        yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult, "f").call(this, cachedAuthorization.capabilities);
                        yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_handleAuthorizationResult, "f").call(this, cachedAuthorization);
                    }
                    else {
                        return { accounts: this.accounts };
                    }
                }
                else {
                    yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performAuthorization, "f").call(this);
                }
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
            finally {
                __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_connecting, false, "f");
            }
            return { accounts: this.accounts };
        }));
        _LocalSolanaMobileWalletAdapterWallet_performAuthorization.set(this, (signInPayload) => __awaiter(this, void 0, void 0, function* () {
            try {
                const cachedAuthorizationResult = yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, "f").get();
                if (cachedAuthorizationResult) {
                    // TODO: Evaluate whether there's any threat to not `awaiting` this expression
                    __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_handleAuthorizationResult, "f").call(this, cachedAuthorizationResult);
                    return cachedAuthorizationResult;
                }
                const selectedChain = yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_chainSelector, "f").select(__classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_chains, "f"));
                return yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    const [capabilities, mwaAuthorizationResult] = yield Promise.all([
                        wallet.getCapabilities(),
                        wallet.authorize({
                            chain: selectedChain,
                            identity: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_appIdentity, "f"),
                            sign_in_payload: signInPayload,
                        })
                    ]);
                    const accounts = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts, "f").call(this, mwaAuthorizationResult.accounts);
                    const authorization = Object.assign(Object.assign({}, mwaAuthorizationResult), { accounts, chain: selectedChain, capabilities: capabilities });
                    // TODO: Evaluate whether there's any threat to not `awaiting` this expression
                    Promise.all([
                        __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult, "f").call(this, capabilities),
                        __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, "f").set(authorization),
                        __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_handleAuthorizationResult, "f").call(this, authorization),
                    ]);
                    return authorization;
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_handleAuthorizationResult.set(this, (authorization) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const didPublicKeysChange = 
            // Case 1: We started from having no authorization.
            __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f") == null ||
                // Case 2: The number of authorized accounts changed.
                ((_a = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _a === void 0 ? void 0 : _a.accounts.length) !== authorization.accounts.length ||
                // Case 3: The new list of addresses isn't exactly the same as the old list, in the same order.
                __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f").accounts.some((account, ii) => account.address !== authorization.accounts[ii].address);
            __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, authorization, "f");
            if (didPublicKeysChange) {
                __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_instances, "m", _LocalSolanaMobileWalletAdapterWallet_emit).call(this, 'change', { accounts: this.accounts });
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult.set(this, (capabilities) => __awaiter(this, void 0, void 0, function* () {
            // TODO: investigate why using SolanaSignTransactions constant breaks treeshaking
            const supportsSignTransaction = capabilities.features.includes('solana:signTransactions'); //SolanaSignTransactions);
            const supportsSignAndSendTransaction = capabilities.supports_sign_and_send_transactions;
            const didCapabilitiesChange = walletStandardFeatures.SolanaSignAndSendTransaction in this.features !== supportsSignAndSendTransaction ||
                walletStandardFeatures.SolanaSignTransaction in this.features !== supportsSignTransaction;
            __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_optionalFeatures, Object.assign(Object.assign({}, ((supportsSignAndSendTransaction || (!supportsSignAndSendTransaction && !supportsSignTransaction)) && {
                [walletStandardFeatures.SolanaSignAndSendTransaction]: {
                    version: '1.0.0',
                    supportedTransactionVersions: ['legacy', 0],
                    signAndSendTransaction: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_signAndSendTransaction, "f"),
                },
            })), (supportsSignTransaction && {
                [walletStandardFeatures.SolanaSignTransaction]: {
                    version: '1.0.0',
                    supportedTransactionVersions: ['legacy', 0],
                    signTransaction: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_signTransaction, "f"),
                },
            })), "f");
            if (didCapabilitiesChange) {
                __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_instances, "m", _LocalSolanaMobileWalletAdapterWallet_emit).call(this, 'change', { features: this.features });
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_performReauthorization.set(this, (wallet, authToken, chain) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            try {
                const [capabilities, mwaAuthorizationResult] = yield Promise.all([
                    (_c = (_b = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _b === void 0 ? void 0 : _b.capabilities) !== null && _c !== void 0 ? _c : yield wallet.getCapabilities(),
                    wallet.authorize({
                        auth_token: authToken,
                        identity: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_appIdentity, "f"),
                        chain: chain
                    })
                ]);
                const accounts = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts, "f").call(this, mwaAuthorizationResult.accounts);
                const authorization = Object.assign(Object.assign({}, mwaAuthorizationResult), { accounts: accounts, chain: chain, capabilities: capabilities });
                // TODO: Evaluate whether there's any threat to not `awaiting` this expression
                Promise.all([
                    __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, "f").set(authorization),
                    __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_handleAuthorizationResult, "f").call(this, authorization),
                ]);
            }
            catch (e) {
                __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_disconnect, "f").call(this);
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_disconnect.set(this, () => __awaiter(this, void 0, void 0, function* () {
            var _d;
            __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, "f").clear(); // TODO: Evaluate whether there's any threat to not `awaiting` this expression
            __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_connecting, false, "f");
            __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_connectionGeneration, (_d = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_connectionGeneration, "f"), _d++, _d), "f");
            __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, undefined, "f");
            __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_instances, "m", _LocalSolanaMobileWalletAdapterWallet_emit).call(this, 'change', { accounts: this.accounts });
        }));
        _LocalSolanaMobileWalletAdapterWallet_transact.set(this, (callback) => __awaiter(this, void 0, void 0, function* () {
            var _e;
            const walletUriBase = (_e = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _e === void 0 ? void 0 : _e.wallet_uri_base;
            const config = walletUriBase ? { baseUri: walletUriBase } : undefined;
            const currentConnectionGeneration = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_connectionGeneration, "f");
            try {
                return yield mobileWalletAdapterProtocol.transact(callback, config);
            }
            catch (e) {
                if (__classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_connectionGeneration, "f") !== currentConnectionGeneration) {
                    yield new Promise(() => { }); // Never resolve.
                }
                if (e instanceof Error &&
                    e.name === 'SolanaMobileWalletAdapterError' &&
                    e.code === 'ERROR_WALLET_NOT_FOUND') {
                    yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_onWalletNotFound, "f").call(this, this);
                }
                throw e;
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_assertIsAuthorized.set(this, () => {
            if (!__classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f"))
                throw new Error('Wallet not connected');
            return { authToken: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f").auth_token, chain: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f").chain };
        });
        _LocalSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts.set(this, (accounts) => {
            return accounts.map((account) => {
                var _a, _b;
                const publicKey = toUint8Array(account.address);
                return {
                    address: base58__default["default"].encode(publicKey),
                    publicKey,
                    label: account.label,
                    icon: account.icon,
                    chains: (_a = account.chains) !== null && _a !== void 0 ? _a : __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_chains, "f"),
                    // TODO: get supported features from getCapabilities API 
                    features: (_b = account.features) !== null && _b !== void 0 ? _b : DEFAULT_FEATURES
                };
            });
        });
        _LocalSolanaMobileWalletAdapterWallet_performSignTransactions.set(this, (transactions) => __awaiter(this, void 0, void 0, function* () {
            const { authToken, chain } = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_assertIsAuthorized, "f").call(this);
            try {
                const base64Transactions = transactions.map((tx) => { return fromUint8Array(tx); });
                return yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performReauthorization, "f").call(this, wallet, authToken, chain);
                    const signedTransactions = (yield wallet.signTransactions({
                        payloads: base64Transactions,
                    })).signed_payloads.map(toUint8Array);
                    return signedTransactions;
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_performSignAndSendTransaction.set(this, (transaction, options) => __awaiter(this, void 0, void 0, function* () {
            const { authToken, chain } = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_assertIsAuthorized, "f").call(this);
            try {
                return yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    const [capabilities, _1] = yield Promise.all([
                        wallet.getCapabilities(),
                        __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performReauthorization, "f").call(this, wallet, authToken, chain)
                    ]);
                    if (capabilities.supports_sign_and_send_transactions) {
                        const base64Transaction = fromUint8Array(transaction);
                        const signatures = (yield wallet.signAndSendTransactions(Object.assign(Object.assign({}, options), { payloads: [base64Transaction] }))).signatures.map(toUint8Array);
                        return signatures[0];
                    }
                    else {
                        throw new Error('connected wallet does not support signAndSendTransaction');
                    }
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_signAndSendTransaction.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            const outputs = [];
            for (const input of inputs) {
                const signature = yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performSignAndSendTransaction, "f").call(this, input.transaction, input.options);
                outputs.push({ signature });
            }
            return outputs;
        }));
        _LocalSolanaMobileWalletAdapterWallet_signTransaction.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            return (yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performSignTransactions, "f").call(this, inputs.map(({ transaction }) => transaction)))
                .map((signedTransaction) => {
                return { signedTransaction };
            });
        }));
        _LocalSolanaMobileWalletAdapterWallet_signMessage.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            const { authToken, chain } = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_assertIsAuthorized, "f").call(this);
            const addresses = inputs.map(({ account }) => fromUint8Array(account.publicKey));
            const messages = inputs.map(({ message }) => fromUint8Array(message));
            try {
                return yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performReauthorization, "f").call(this, wallet, authToken, chain);
                    const signedMessages = (yield wallet.signMessages({
                        addresses: addresses,
                        payloads: messages,
                    })).signed_payloads.map(toUint8Array);
                    return signedMessages.map((signedMessage) => {
                        return { signedMessage: signedMessage, signature: signedMessage.slice(-SIGNATURE_LENGTH_IN_BYTES) };
                    });
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _LocalSolanaMobileWalletAdapterWallet_signIn.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            const outputs = [];
            if (inputs.length > 1) {
                for (const input of inputs) {
                    outputs.push(yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performSignIn, "f").call(this, input));
                }
            }
            else {
                return [yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performSignIn, "f").call(this, inputs[0])];
            }
            return outputs;
        }));
        _LocalSolanaMobileWalletAdapterWallet_performSignIn.set(this, (input) => __awaiter(this, void 0, void 0, function* () {
            var _f, _g, _h;
            __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_connecting, true, "f");
            try {
                const authorizationResult = yield __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_performAuthorization, "f").call(this, Object.assign(Object.assign({}, input), { domain: (_f = input === null || input === void 0 ? void 0 : input.domain) !== null && _f !== void 0 ? _f : window.location.host }));
                if (!authorizationResult.sign_in_result) {
                    throw new Error("Sign in failed, no sign in result returned by wallet");
                }
                const signedInAddress = authorizationResult.sign_in_result.address;
                const signedInAccount = authorizationResult.accounts.find(acc => acc.address == signedInAddress);
                return {
                    account: Object.assign(Object.assign({}, signedInAccount !== null && signedInAccount !== void 0 ? signedInAccount : {
                        address: base58__default["default"].encode(toUint8Array(signedInAddress))
                    }), { publicKey: toUint8Array(signedInAddress), chains: (_g = signedInAccount === null || signedInAccount === void 0 ? void 0 : signedInAccount.chains) !== null && _g !== void 0 ? _g : __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_chains, "f"), features: (_h = signedInAccount === null || signedInAccount === void 0 ? void 0 : signedInAccount.features) !== null && _h !== void 0 ? _h : authorizationResult.capabilities.features }),
                    signedMessage: toUint8Array(authorizationResult.sign_in_result.signed_message),
                    signature: toUint8Array(authorizationResult.sign_in_result.signature)
                };
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
            finally {
                __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_connecting, false, "f");
            }
        }));
        __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, config.authorizationCache, "f");
        __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_appIdentity, config.appIdentity, "f");
        __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_chains, config.chains, "f");
        __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_chainSelector, config.chainSelector, "f");
        __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_onWalletNotFound, config.onWalletNotFound, "f");
        __classPrivateFieldSet$1(this, _LocalSolanaMobileWalletAdapterWallet_optionalFeatures, {
            // In MWA 1.0, signAndSend is optional and signTransaction is mandatory. Whereas in MWA 2.0+,
            // signAndSend is mandatory and signTransaction is optional (and soft deprecated). As of mid
            // 2025, all MWA wallets support both signAndSendTransaction and signTransaction so its safe
            // assume both are supported here. The features will be updated based on the actual connected 
            // wallets capabilities during connection regardless, so this is safe. 
            [walletStandardFeatures.SolanaSignAndSendTransaction]: {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signAndSendTransaction: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_signAndSendTransaction, "f"),
            },
            [walletStandardFeatures.SolanaSignTransaction]: {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signTransaction: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_signTransaction, "f"),
            },
        }, "f");
    }
    get version() {
        return __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_version, "f");
    }
    get name() {
        return __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_name, "f");
    }
    get url() {
        return __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_url, "f");
    }
    get icon() {
        return __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_icon, "f");
    }
    get chains() {
        return __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_chains, "f");
    }
    get features() {
        return Object.assign({ [features.StandardConnect]: {
                version: '1.0.0',
                connect: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_connect, "f"),
            }, [features.StandardDisconnect]: {
                version: '1.0.0',
                disconnect: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_disconnect, "f"),
            }, [features.StandardEvents]: {
                version: '1.0.0',
                on: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_on, "f"),
            }, [walletStandardFeatures.SolanaSignMessage]: {
                version: '1.0.0',
                signMessage: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_signMessage, "f"),
            }, [walletStandardFeatures.SolanaSignIn]: {
                version: '1.0.0',
                signIn: __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_signIn, "f"),
            } }, __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_optionalFeatures, "f"));
    }
    get accounts() {
        var _a, _b;
        return (_b = (_a = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _a === void 0 ? void 0 : _a.accounts) !== null && _b !== void 0 ? _b : [];
    }
    get connected() {
        return !!__classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f");
    }
    get isAuthorized() {
        return !!__classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f");
    }
    get currentAuthorization() {
        return __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorization, "f");
    }
    get cachedAuthorizationResult() {
        return __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_authorizationCache, "f").get();
    }
}
_LocalSolanaMobileWalletAdapterWallet_listeners = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_version = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_name = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_url = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_icon = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_appIdentity = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_authorization = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_authorizationCache = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_connecting = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_connectionGeneration = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_chains = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_chainSelector = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_optionalFeatures = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_onWalletNotFound = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_on = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_connect = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_performAuthorization = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_handleAuthorizationResult = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_performReauthorization = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_disconnect = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_transact = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_assertIsAuthorized = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_performSignTransactions = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_performSignAndSendTransaction = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_signAndSendTransaction = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_signTransaction = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_signMessage = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_signIn = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_performSignIn = new WeakMap(), _LocalSolanaMobileWalletAdapterWallet_instances = new WeakSet(), _LocalSolanaMobileWalletAdapterWallet_emit = function _LocalSolanaMobileWalletAdapterWallet_emit(event, ...args) {
    var _a;
    // eslint-disable-next-line prefer-spread
    (_a = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_listeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.forEach((listener) => listener.apply(null, args));
}, _LocalSolanaMobileWalletAdapterWallet_off = function _LocalSolanaMobileWalletAdapterWallet_off(event, listener) {
    var _a;
    __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_listeners, "f")[event] = (_a = __classPrivateFieldGet$1(this, _LocalSolanaMobileWalletAdapterWallet_listeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.filter((existingListener) => listener !== existingListener);
};
class RemoteSolanaMobileWalletAdapterWallet {
    constructor(config) {
        _RemoteSolanaMobileWalletAdapterWallet_instances.add(this);
        _RemoteSolanaMobileWalletAdapterWallet_listeners.set(this, {});
        _RemoteSolanaMobileWalletAdapterWallet_version.set(this, '1.0.0'); // wallet-standard version
        _RemoteSolanaMobileWalletAdapterWallet_name.set(this, SolanaMobileWalletAdapterRemoteWalletName);
        _RemoteSolanaMobileWalletAdapterWallet_url.set(this, 'https://solanamobile.com/wallets');
        _RemoteSolanaMobileWalletAdapterWallet_icon.set(this, icon);
        _RemoteSolanaMobileWalletAdapterWallet_appIdentity.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_authorization.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_authorizationCache.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_connecting.set(this, false);
        /**
         * Every time the connection is recycled in some way (eg. `disconnect()` is called)
         * increment this and use it to make sure that `transact` calls from the previous
         * 'generation' don't continue to do work and throw exceptions.
         */
        _RemoteSolanaMobileWalletAdapterWallet_connectionGeneration.set(this, 0);
        _RemoteSolanaMobileWalletAdapterWallet_chains.set(this, []);
        _RemoteSolanaMobileWalletAdapterWallet_chainSelector.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_optionalFeatures.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_onWalletNotFound.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_hostAuthority.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_session.set(this, void 0);
        _RemoteSolanaMobileWalletAdapterWallet_on.set(this, (event, listener) => {
            var _a;
            ((_a = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_listeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.push(listener)) || (__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_listeners, "f")[event] = [listener]);
            return () => __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_instances, "m", _RemoteSolanaMobileWalletAdapterWallet_off).call(this, event, listener);
        });
        _RemoteSolanaMobileWalletAdapterWallet_connect.set(this, ({ silent } = {}) => __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connecting, "f") || this.connected) {
                return { accounts: this.accounts };
            }
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connecting, true, "f");
            try {
                yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performAuthorization, "f").call(this);
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
            finally {
                __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connecting, false, "f");
            }
            return { accounts: this.accounts };
        }));
        _RemoteSolanaMobileWalletAdapterWallet_performAuthorization.set(this, (signInPayload) => __awaiter(this, void 0, void 0, function* () {
            try {
                const cachedAuthorizationResult = yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorizationCache, "f").get();
                if (cachedAuthorizationResult) {
                    // TODO: Evaluate whether there's any threat to not `awaiting` this expression
                    __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_handleAuthorizationResult, "f").call(this, cachedAuthorizationResult);
                    return cachedAuthorizationResult;
                }
                if (__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, "f"))
                    __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, undefined, "f");
                const selectedChain = yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_chainSelector, "f").select(__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_chains, "f"));
                return yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    const [capabilities, mwaAuthorizationResult] = yield Promise.all([
                        wallet.getCapabilities(),
                        wallet.authorize({
                            chain: selectedChain,
                            identity: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_appIdentity, "f"),
                            sign_in_payload: signInPayload,
                        })
                    ]);
                    const accounts = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts, "f").call(this, mwaAuthorizationResult.accounts);
                    const authorizationResult = Object.assign(Object.assign({}, mwaAuthorizationResult), { accounts, chain: selectedChain, capabilities: capabilities });
                    // TODO: Evaluate whether there's any threat to not `awaiting` this expression
                    Promise.all([
                        __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult, "f").call(this, capabilities),
                        __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorizationCache, "f").set(authorizationResult),
                        __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_handleAuthorizationResult, "f").call(this, authorizationResult),
                    ]);
                    return authorizationResult;
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_handleAuthorizationResult.set(this, (authorization) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const didPublicKeysChange = 
            // Case 1: We started from having no authorization.
            __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f") == null ||
                // Case 2: The number of authorized accounts changed.
                ((_a = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _a === void 0 ? void 0 : _a.accounts.length) !== authorization.accounts.length ||
                // Case 3: The new list of addresses isn't exactly the same as the old list, in the same order.
                __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f").accounts.some((account, ii) => account.address !== authorization.accounts[ii].address);
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, authorization, "f");
            if (didPublicKeysChange) {
                __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_instances, "m", _RemoteSolanaMobileWalletAdapterWallet_emit).call(this, 'change', { accounts: this.accounts });
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult.set(this, (capabilities) => __awaiter(this, void 0, void 0, function* () {
            // TODO: investigate why using SolanaSignTransactions constant breaks treeshaking
            const supportsSignTransaction = capabilities.features.includes('solana:signTransactions'); //SolanaSignTransactions);
            const supportsSignAndSendTransaction = capabilities.supports_sign_and_send_transactions ||
                capabilities.features.includes('solana:signAndSendTransaction');
            const didCapabilitiesChange = walletStandardFeatures.SolanaSignAndSendTransaction in this.features !== supportsSignAndSendTransaction ||
                walletStandardFeatures.SolanaSignTransaction in this.features !== supportsSignTransaction;
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_optionalFeatures, Object.assign(Object.assign({}, (supportsSignAndSendTransaction && {
                [walletStandardFeatures.SolanaSignAndSendTransaction]: {
                    version: '1.0.0',
                    supportedTransactionVersions: capabilities.supported_transaction_versions,
                    signAndSendTransaction: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_signAndSendTransaction, "f"),
                },
            })), (supportsSignTransaction && {
                [walletStandardFeatures.SolanaSignTransaction]: {
                    version: '1.0.0',
                    supportedTransactionVersions: capabilities.supported_transaction_versions,
                    signTransaction: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_signTransaction, "f"),
                },
            })), "f");
            if (didCapabilitiesChange) {
                __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_instances, "m", _RemoteSolanaMobileWalletAdapterWallet_emit).call(this, 'change', { features: this.features });
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_performReauthorization.set(this, (wallet, authToken, chain) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            try {
                const [capabilities, mwaAuthorizationResult] = yield Promise.all([
                    (_c = (_b = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _b === void 0 ? void 0 : _b.capabilities) !== null && _c !== void 0 ? _c : yield wallet.getCapabilities(),
                    wallet.authorize({
                        auth_token: authToken,
                        identity: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_appIdentity, "f"),
                        chain: chain
                    })
                ]);
                const accounts = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts, "f").call(this, mwaAuthorizationResult.accounts);
                const authorization = Object.assign(Object.assign({}, mwaAuthorizationResult), { accounts: accounts, chain: chain, capabilities: capabilities });
                // TODO: Evaluate whether there's any threat to not `awaiting` this expression
                Promise.all([
                    __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorizationCache, "f").set(authorization),
                    __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_handleAuthorizationResult, "f").call(this, authorization),
                ]);
            }
            catch (e) {
                __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_disconnect, "f").call(this);
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_disconnect.set(this, () => __awaiter(this, void 0, void 0, function* () {
            var _d;
            var _e;
            (_d = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, "f")) === null || _d === void 0 ? void 0 : _d.close();
            __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorizationCache, "f").clear(); // TODO: Evaluate whether there's any threat to not `awaiting` this expression
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connecting, false, "f");
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connectionGeneration, (_e = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connectionGeneration, "f"), _e++, _e), "f");
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, undefined, "f");
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, undefined, "f");
            __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_instances, "m", _RemoteSolanaMobileWalletAdapterWallet_emit).call(this, 'change', { accounts: this.accounts });
        }));
        _RemoteSolanaMobileWalletAdapterWallet_transact.set(this, (callback) => __awaiter(this, void 0, void 0, function* () {
            var _f;
            const walletUriBase = (_f = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _f === void 0 ? void 0 : _f.wallet_uri_base;
            const baseConfig = walletUriBase ? { baseUri: walletUriBase } : undefined;
            const remoteConfig = Object.assign(Object.assign({}, baseConfig), { remoteHostAuthority: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_hostAuthority, "f") });
            const currentConnectionGeneration = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connectionGeneration, "f");
            const modal = new RemoteConnectionModal();
            if (__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, "f")) {
                return callback(__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, "f").wallet);
            }
            try {
                const { associationUrl, close, wallet } = yield mobileWalletAdapterProtocol.startRemoteScenario(remoteConfig);
                const removeCloseListener = modal.addEventListener('close', (event) => {
                    if (event)
                        close();
                });
                modal.initWithQR(associationUrl.toString());
                modal.open();
                __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, { close, wallet: yield wallet }, "f");
                removeCloseListener();
                modal.close();
                return yield callback(__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, "f").wallet);
            }
            catch (e) {
                modal.close();
                if (__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connectionGeneration, "f") !== currentConnectionGeneration) {
                    yield new Promise(() => { }); // Never resolve.
                }
                if (e instanceof Error &&
                    e.name === 'SolanaMobileWalletAdapterError' &&
                    e.code === 'ERROR_WALLET_NOT_FOUND') {
                    yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_onWalletNotFound, "f").call(this, this);
                }
                throw e;
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_assertIsAuthorized.set(this, () => {
            if (!__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f"))
                throw new Error('Wallet not connected');
            return { authToken: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f").auth_token, chain: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f").chain };
        });
        _RemoteSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts.set(this, (accounts) => {
            return accounts.map((account) => {
                var _a, _b;
                const publicKey = toUint8Array(account.address);
                return {
                    address: base58__default["default"].encode(publicKey),
                    publicKey,
                    label: account.label,
                    icon: account.icon,
                    chains: (_a = account.chains) !== null && _a !== void 0 ? _a : __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_chains, "f"),
                    // TODO: get supported features from getCapabilities API 
                    features: (_b = account.features) !== null && _b !== void 0 ? _b : DEFAULT_FEATURES
                };
            });
        });
        _RemoteSolanaMobileWalletAdapterWallet_performSignTransactions.set(this, (transactions) => __awaiter(this, void 0, void 0, function* () {
            const { authToken, chain } = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_assertIsAuthorized, "f").call(this);
            try {
                return yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performReauthorization, "f").call(this, wallet, authToken, chain);
                    const signedTransactions = (yield wallet.signTransactions({
                        payloads: transactions.map(fromUint8Array),
                    })).signed_payloads.map(toUint8Array);
                    return signedTransactions;
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_performSignAndSendTransaction.set(this, (transaction, options) => __awaiter(this, void 0, void 0, function* () {
            const { authToken, chain } = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_assertIsAuthorized, "f").call(this);
            try {
                return yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    const [capabilities, _1] = yield Promise.all([
                        wallet.getCapabilities(),
                        __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performReauthorization, "f").call(this, wallet, authToken, chain)
                    ]);
                    if (capabilities.supports_sign_and_send_transactions) {
                        const signatures = (yield wallet.signAndSendTransactions(Object.assign(Object.assign({}, options), { payloads: [fromUint8Array(transaction)] }))).signatures.map(toUint8Array);
                        return signatures[0];
                    }
                    else {
                        throw new Error('connected wallet does not support signAndSendTransaction');
                    }
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_signAndSendTransaction.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            const outputs = [];
            for (const input of inputs) {
                const signature = (yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performSignAndSendTransaction, "f").call(this, input.transaction, input.options));
                outputs.push({ signature });
            }
            return outputs;
        }));
        _RemoteSolanaMobileWalletAdapterWallet_signTransaction.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            return (yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performSignTransactions, "f").call(this, inputs.map(({ transaction }) => transaction)))
                .map((signedTransaction) => {
                return { signedTransaction };
            });
        }));
        _RemoteSolanaMobileWalletAdapterWallet_signMessage.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            const { authToken, chain } = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_assertIsAuthorized, "f").call(this);
            const addresses = inputs.map(({ account }) => fromUint8Array(account.publicKey));
            const messages = inputs.map(({ message }) => fromUint8Array(message));
            try {
                return yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_transact, "f").call(this, (wallet) => __awaiter(this, void 0, void 0, function* () {
                    yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performReauthorization, "f").call(this, wallet, authToken, chain);
                    const signedMessages = (yield wallet.signMessages({
                        addresses: addresses,
                        payloads: messages,
                    })).signed_payloads.map(toUint8Array);
                    return signedMessages.map((signedMessage) => {
                        return { signedMessage: signedMessage, signature: signedMessage.slice(-SIGNATURE_LENGTH_IN_BYTES) };
                    });
                }));
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
        }));
        _RemoteSolanaMobileWalletAdapterWallet_signIn.set(this, (...inputs) => __awaiter(this, void 0, void 0, function* () {
            const outputs = [];
            if (inputs.length > 1) {
                for (const input of inputs) {
                    outputs.push(yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performSignIn, "f").call(this, input));
                }
            }
            else {
                return [yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performSignIn, "f").call(this, inputs[0])];
            }
            return outputs;
        }));
        _RemoteSolanaMobileWalletAdapterWallet_performSignIn.set(this, (input) => __awaiter(this, void 0, void 0, function* () {
            var _g, _h, _j;
            __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connecting, true, "f");
            try {
                const authorizationResult = yield __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_performAuthorization, "f").call(this, Object.assign(Object.assign({}, input), { domain: (_g = input === null || input === void 0 ? void 0 : input.domain) !== null && _g !== void 0 ? _g : window.location.host }));
                if (!authorizationResult.sign_in_result) {
                    throw new Error("Sign in failed, no sign in result returned by wallet");
                }
                const signedInAddress = authorizationResult.sign_in_result.address;
                const signedInAccount = authorizationResult.accounts.find(acc => acc.address == signedInAddress);
                return {
                    account: Object.assign(Object.assign({}, signedInAccount !== null && signedInAccount !== void 0 ? signedInAccount : {
                        address: base58__default["default"].encode(toUint8Array(signedInAddress))
                    }), { publicKey: toUint8Array(signedInAddress), chains: (_h = signedInAccount === null || signedInAccount === void 0 ? void 0 : signedInAccount.chains) !== null && _h !== void 0 ? _h : __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_chains, "f"), features: (_j = signedInAccount === null || signedInAccount === void 0 ? void 0 : signedInAccount.features) !== null && _j !== void 0 ? _j : authorizationResult.capabilities.features }),
                    signedMessage: toUint8Array(authorizationResult.sign_in_result.signed_message),
                    signature: toUint8Array(authorizationResult.sign_in_result.signature)
                };
            }
            catch (e) {
                throw new Error((e instanceof Error && e.message) || 'Unknown error');
            }
            finally {
                __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connecting, false, "f");
            }
        }));
        __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorizationCache, config.authorizationCache, "f");
        __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_appIdentity, config.appIdentity, "f");
        __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_chains, config.chains, "f");
        __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_chainSelector, config.chainSelector, "f");
        __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_hostAuthority, config.remoteHostAuthority, "f");
        __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_onWalletNotFound, config.onWalletNotFound, "f");
        __classPrivateFieldSet$1(this, _RemoteSolanaMobileWalletAdapterWallet_optionalFeatures, {
            // In MWA 1.0, signAndSend is optional and signTransaction is mandatory. Whereas in MWA 2.0+,
            // signAndSend is mandatory and signTransaction is optional (and soft deprecated). As of mid
            // 2025, all MWA wallets support both signAndSendTransaction and signTransaction so its safe
            // assume both are supported here. The features will be updated based on the actual connected 
            // wallets capabilities during connection regardless, so this is safe. 
            [walletStandardFeatures.SolanaSignAndSendTransaction]: {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signAndSendTransaction: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_signAndSendTransaction, "f"),
            },
            [walletStandardFeatures.SolanaSignTransaction]: {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signTransaction: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_signTransaction, "f"),
            },
        }, "f");
    }
    get version() {
        return __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_version, "f");
    }
    get name() {
        return __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_name, "f");
    }
    get url() {
        return __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_url, "f");
    }
    get icon() {
        return __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_icon, "f");
    }
    get chains() {
        return __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_chains, "f");
    }
    get features() {
        return Object.assign({ [features.StandardConnect]: {
                version: '1.0.0',
                connect: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_connect, "f"),
            }, [features.StandardDisconnect]: {
                version: '1.0.0',
                disconnect: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_disconnect, "f"),
            }, [features.StandardEvents]: {
                version: '1.0.0',
                on: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_on, "f"),
            }, [walletStandardFeatures.SolanaSignMessage]: {
                version: '1.0.0',
                signMessage: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_signMessage, "f"),
            }, [walletStandardFeatures.SolanaSignIn]: {
                version: '1.0.0',
                signIn: __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_signIn, "f"),
            } }, __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_optionalFeatures, "f"));
    }
    get accounts() {
        var _a, _b;
        return (_b = (_a = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f")) === null || _a === void 0 ? void 0 : _a.accounts) !== null && _b !== void 0 ? _b : [];
    }
    get connected() {
        return !!__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_session, "f") && !!__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f");
    }
    get isAuthorized() {
        return !!__classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f");
    }
    get currentAuthorization() {
        return __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorization, "f");
    }
    get cachedAuthorizationResult() {
        return __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_authorizationCache, "f").get();
    }
}
_RemoteSolanaMobileWalletAdapterWallet_listeners = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_version = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_name = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_url = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_icon = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_appIdentity = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_authorization = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_authorizationCache = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_connecting = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_connectionGeneration = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_chains = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_chainSelector = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_optionalFeatures = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_onWalletNotFound = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_hostAuthority = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_session = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_on = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_connect = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_performAuthorization = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_handleAuthorizationResult = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_handleWalletCapabilitiesResult = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_performReauthorization = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_disconnect = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_transact = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_assertIsAuthorized = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_accountsToWalletStandardAccounts = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_performSignTransactions = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_performSignAndSendTransaction = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_signAndSendTransaction = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_signTransaction = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_signMessage = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_signIn = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_performSignIn = new WeakMap(), _RemoteSolanaMobileWalletAdapterWallet_instances = new WeakSet(), _RemoteSolanaMobileWalletAdapterWallet_emit = function _RemoteSolanaMobileWalletAdapterWallet_emit(event, ...args) {
    var _a;
    // eslint-disable-next-line prefer-spread
    (_a = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_listeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.forEach((listener) => listener.apply(null, args));
}, _RemoteSolanaMobileWalletAdapterWallet_off = function _RemoteSolanaMobileWalletAdapterWallet_off(event, listener) {
    var _a;
    __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_listeners, "f")[event] = (_a = __classPrivateFieldGet$1(this, _RemoteSolanaMobileWalletAdapterWallet_listeners, "f")[event]) === null || _a === void 0 ? void 0 : _a.filter((existingListener) => listener !== existingListener);
};

var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _RegisterWalletEvent_detail;
/**
 * Register a {@link "@wallet-standard/base".Wallet} as a Standard Wallet with the app.
 *
 * This dispatches a {@link "@wallet-standard/base".WindowRegisterWalletEvent} to notify the app that the Wallet is
 * ready to be registered.
 *
 * This also adds a listener for {@link "@wallet-standard/base".WindowAppReadyEvent} to listen for a notification from
 * the app that the app is ready to register the Wallet.
 *
 * This combination of event dispatch and listener guarantees that the Wallet will be registered synchronously as soon
 * as the app is ready whether the Wallet loads before or after the app.
 *
 * @param wallet Wallet to register.
 *
 * @group Wallet
 */
function registerWallet(wallet) {
    const callback = ({ register }) => register(wallet);
    try {
        window.dispatchEvent(new RegisterWalletEvent(callback));
    }
    catch (error) {
        console.error('wallet-standard:register-wallet event could not be dispatched\n', error);
    }
    try {
        window.addEventListener('wallet-standard:app-ready', ({ detail: api }) => callback(api));
    }
    catch (error) {
        console.error('wallet-standard:app-ready event listener could not be added\n', error);
    }
}
class RegisterWalletEvent extends Event {
    constructor(callback) {
        super('wallet-standard:register-wallet', {
            bubbles: false,
            cancelable: false,
            composed: false,
        });
        _RegisterWalletEvent_detail.set(this, void 0);
        __classPrivateFieldSet(this, _RegisterWalletEvent_detail, callback, "f");
    }
    get detail() {
        return __classPrivateFieldGet(this, _RegisterWalletEvent_detail, "f");
    }
    get type() {
        return 'wallet-standard:register-wallet';
    }
    /** @deprecated */
    preventDefault() {
        throw new Error('preventDefault cannot be called');
    }
    /** @deprecated */
    stopImmediatePropagation() {
        throw new Error('stopImmediatePropagation cannot be called');
    }
    /** @deprecated */
    stopPropagation() {
        throw new Error('stopPropagation cannot be called');
    }
}
_RegisterWalletEvent_detail = new WeakMap();

(undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
(undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};

function getIsLocalAssociationSupported() {
    return (typeof window !== 'undefined' &&
        window.isSecureContext &&
        typeof document !== 'undefined' &&
        /android/i.test(navigator.userAgent));
}
function getIsRemoteAssociationSupported() {
    return (typeof window !== 'undefined' &&
        window.isSecureContext &&
        typeof document !== 'undefined' &&
        !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}
// Source: https://github.com/anza-xyz/wallet-adapter/blob/master/packages/core/react/src/getEnvironment.ts#L14
// This is the same implementation that gated MWA in the Anza wallet-adapter-react library.
function isWebView(userAgentString) {
    return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(userAgentString);
}

function registerMwa(config) {
    if (typeof window === 'undefined') {
        console.warn(`MWA not registered: no window object`);
        return;
    }
    if (!window.isSecureContext) {
        console.warn(`MWA not registered: secure context required (https)`);
        return;
    }
    // Local association technically is possible in a webview, but we prevent registration
    // by default because it usually fails in the most common cases (e.g wallet browsers).
    if (getIsLocalAssociationSupported() && !isWebView(navigator.userAgent)) {
        registerWallet(new LocalSolanaMobileWalletAdapterWallet(config));
    }
    else if (getIsRemoteAssociationSupported() && config.remoteHostAuthority !== undefined) {
        registerWallet(new RemoteSolanaMobileWalletAdapterWallet(Object.assign(Object.assign({}, config), { remoteHostAuthority: config.remoteHostAuthority })));
    }
    else ;
}

const WALLET_NOT_FOUND_ERROR_MESSAGE = 'To use mobile wallet adapter, you must have a compatible mobile wallet application installed on your device.';
const BROWSER_NOT_SUPPORTED_ERROR_MESSAGE = 'This browser appears to be incompatible with mobile wallet adapter. Open this page in a compatible mobile browser app and try again.';
class ErrorModal extends EmbeddedModal {
    constructor() {
        super(...arguments);
        this.contentStyles = css;
        this.contentHtml = ErrorDialogHtml;
    }
    initWithError(error) {
        super.init();
        this.populateError(error);
    }
    populateError(error) {
        var _a, _b;
        const errorMessageElement = (_a = this.dom) === null || _a === void 0 ? void 0 : _a.getElementById('mobile-wallet-adapter-error-message');
        const actionBtn = (_b = this.dom) === null || _b === void 0 ? void 0 : _b.getElementById('mobile-wallet-adapter-error-action');
        if (errorMessageElement) {
            if (error.name === 'SolanaMobileWalletAdapterError') {
                switch (error.code) {
                    case 'ERROR_WALLET_NOT_FOUND':
                        errorMessageElement.innerHTML = WALLET_NOT_FOUND_ERROR_MESSAGE;
                        if (actionBtn)
                            actionBtn.addEventListener('click', () => {
                                window.location.href = 'https://solanamobile.com/wallets';
                            });
                        return;
                    case 'ERROR_BROWSER_NOT_SUPPORTED':
                        errorMessageElement.innerHTML = BROWSER_NOT_SUPPORTED_ERROR_MESSAGE;
                        if (actionBtn)
                            actionBtn.style.display = 'none';
                        return;
                }
            }
            errorMessageElement.innerHTML = `An unexpected error occurred: ${error.message}`;
        }
        else {
            console.log('Failed to locate error dialog element');
        }
    }
}
const ErrorDialogHtml = `
<svg class="mobile-wallet-adapter-embedded-modal-error-icon" xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px" fill="#000000"><path d="M 280,-80 Q 197,-80 138.5,-138.5 80,-197 80,-280 80,-363 138.5,-421.5 197,-480 280,-480 q 83,0 141.5,58.5 58.5,58.5 58.5,141.5 0,83 -58.5,141.5 Q 363,-80 280,-80 Z M 824,-120 568,-376 Q 556,-389 542.5,-402.5 529,-416 516,-428 q 38,-24 61,-64 23,-40 23,-88 0,-75 -52.5,-127.5 Q 495,-760 420,-760 345,-760 292.5,-707.5 240,-655 240,-580 q 0,6 0.5,11.5 0.5,5.5 1.5,11.5 -18,2 -39.5,8 -21.5,6 -38.5,14 -2,-11 -3,-22 -1,-11 -1,-23 0,-109 75.5,-184.5 Q 311,-840 420,-840 q 109,0 184.5,75.5 75.5,75.5 75.5,184.5 0,43 -13.5,81.5 Q 653,-460 629,-428 l 251,252 z m -615,-61 71,-71 70,71 29,-28 -71,-71 71,-71 -28,-28 -71,71 -71,-71 -28,28 71,71 -71,71 z"/></svg>
<div class="mobile-wallet-adapter-embedded-modal-title">We can't find a wallet.</div>
<div id="mobile-wallet-adapter-error-message" class="mobile-wallet-adapter-embedded-modal-subtitle"></div>
<div>
    <button data-error-action id="mobile-wallet-adapter-error-action" class="mobile-wallet-adapter-embedded-modal-error-action">
        Find a wallet
    </button>
</div>
`;
const css = `
.mobile-wallet-adapter-embedded-modal-content {
    text-align: center;
}

.mobile-wallet-adapter-embedded-modal-error-icon {
    margin-top: 24px;
}

.mobile-wallet-adapter-embedded-modal-title {
    margin: 18px 100px auto 100px;
    color: #000000;
    font-size: 2.75em;
    font-weight: 600;
}

.mobile-wallet-adapter-embedded-modal-subtitle {
    margin: 30px 60px 40px 60px;
    color: #000000;
    font-size: 1.25em;
    font-weight: 400;
}

.mobile-wallet-adapter-embedded-modal-error-action {
    display: block;
    width: 100%;
    height: 56px;
    /*margin-top: 40px;*/
    font-size: 1.25em;
    /*line-height: 24px;*/
    /*letter-spacing: -1%;*/
    background: #000000;
    color: #FFFFFF;
    border-radius: 18px;
}

/* Smaller screens */
@media all and (max-width: 600px) {
    .mobile-wallet-adapter-embedded-modal-title {
        font-size: 1.5em;
        margin-right: 12px;
        margin-left: 12px;
    }
    .mobile-wallet-adapter-embedded-modal-subtitle {
        margin-right: 12px;
        margin-left: 12px;
    }
}
`;

function defaultErrorModalWalletNotFoundHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof window !== 'undefined') {
            const userAgent = window.navigator.userAgent.toLowerCase();
            const errorDialog = new ErrorModal();
            if (userAgent.includes('wv')) { // Android WebView
                // MWA is not supported in this browser so we inform the user
                // errorDialog.initWithError(
                //     new SolanaMobileWalletAdapterError(
                //         SolanaMobileWalletAdapterErrorCode.ERROR_BROWSER_NOT_SUPPORTED, 
                //         ''
                //     )
                // );
                // TODO: investigate why instantiating a new SolanaMobileWalletAdapterError here breaks treeshaking 
                errorDialog.initWithError({
                    name: 'SolanaMobileWalletAdapterError',
                    code: 'ERROR_BROWSER_NOT_SUPPORTED',
                    message: ''
                });
            }
            else { // Browser, user does not have a wallet installed.
                // errorDialog.initWithError(
                //     new SolanaMobileWalletAdapterError(
                //         SolanaMobileWalletAdapterErrorCode.ERROR_WALLET_NOT_FOUND, 
                //         ''
                //     )
                // );
                // TODO: investigate why instantiating a new SolanaMobileWalletAdapterError here breaks treeshaking 
                errorDialog.initWithError({
                    name: 'SolanaMobileWalletAdapterError',
                    code: 'ERROR_WALLET_NOT_FOUND',
                    message: ''
                });
            }
            errorDialog.open();
        }
    });
}
function createDefaultWalletNotFoundHandler() {
    return () => __awaiter(this, void 0, void 0, function* () { defaultErrorModalWalletNotFoundHandler(); });
}

const CACHE_KEY = 'SolanaMobileWalletAdapterDefaultAuthorizationCache';
function createDefaultAuthorizationCache() {
    let storage;
    try {
        storage = window.localStorage;
        // eslint-disable-next-line no-empty
    }
    catch (_a) { }
    return {
        clear() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!storage) {
                    return;
                }
                try {
                    storage.removeItem(CACHE_KEY);
                    // eslint-disable-next-line no-empty
                }
                catch (_a) { }
            });
        },
        get() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!storage) {
                    return;
                }
                try {
                    const parsed = JSON.parse(storage.getItem(CACHE_KEY));
                    if (parsed && parsed.accounts) {
                        const parsedAccounts = parsed.accounts.map((account) => {
                            return Object.assign(Object.assign({}, account), { publicKey: 'publicKey' in account
                                    ? new Uint8Array(Object.values(account.publicKey)) // Rebuild publicKey for WalletAccount
                                    : base58__default["default"].decode(account.address) });
                        });
                        return Object.assign(Object.assign({}, parsed), { accounts: parsedAccounts });
                    }
                    else
                        return parsed || undefined;
                    // eslint-disable-next-line no-empty
                }
                catch (_a) { }
            });
        },
        set(authorization) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!storage) {
                    return;
                }
                try {
                    storage.setItem(CACHE_KEY, JSON.stringify(authorization));
                    // eslint-disable-next-line no-empty
                }
                catch (_a) { }
            });
        },
    };
}

function createDefaultChainSelector() {
    return {
        select(chains) {
            return __awaiter(this, void 0, void 0, function* () {
                if (chains.length === 1) {
                    return chains[0];
                }
                else if (chains.includes(walletStandardChains.SOLANA_MAINNET_CHAIN)) {
                    return walletStandardChains.SOLANA_MAINNET_CHAIN;
                }
                else
                    return chains[0];
            });
        },
    };
}

exports.LocalSolanaMobileWalletAdapterWallet = LocalSolanaMobileWalletAdapterWallet;
exports.RemoteSolanaMobileWalletAdapterWallet = RemoteSolanaMobileWalletAdapterWallet;
exports.SolanaMobileWalletAdapterRemoteWalletName = SolanaMobileWalletAdapterRemoteWalletName;
exports.SolanaMobileWalletAdapterWalletName = SolanaMobileWalletAdapterWalletName;
exports.createDefaultAuthorizationCache = createDefaultAuthorizationCache;
exports.createDefaultChainSelector = createDefaultChainSelector;
exports.createDefaultWalletNotFoundHandler = createDefaultWalletNotFoundHandler;
exports.defaultErrorModalWalletNotFoundHandler = defaultErrorModalWalletNotFoundHandler;
exports.registerMwa = registerMwa;
