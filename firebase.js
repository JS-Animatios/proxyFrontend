/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const stringToByteArray$1 = function (str) {
    // TODO(user): Use native implementations if/when available
    const out = [];
    let p = 0;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128) {
            out[p++] = c;
        }
        else if (c < 2048) {
            out[p++] = (c >> 6) | 192;
            out[p++] = (c & 63) | 128;
        }
        else if ((c & 0xfc00) === 0xd800 &&
            i + 1 < str.length &&
            (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
            // Surrogate Pair
            c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
            out[p++] = (c >> 18) | 240;
            out[p++] = ((c >> 12) & 63) | 128;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        }
        else {
            out[p++] = (c >> 12) | 224;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        }
    }
    return out;
};
/**
 * Turns an array of numbers into the string given by the concatenation of the
 * characters to which the numbers correspond.
 * @param bytes Array of numbers representing characters.
 * @return Stringification of the array.
 */
const byteArrayToString = function (bytes) {
    // TODO(user): Use native implementations if/when available
    const out = [];
    let pos = 0, c = 0;
    while (pos < bytes.length) {
        const c1 = bytes[pos++];
        if (c1 < 128) {
            out[c++] = String.fromCharCode(c1);
        }
        else if (c1 > 191 && c1 < 224) {
            const c2 = bytes[pos++];
            out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
        }
        else if (c1 > 239 && c1 < 365) {
            // Surrogate Pair
            const c2 = bytes[pos++];
            const c3 = bytes[pos++];
            const c4 = bytes[pos++];
            const u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
                0x10000;
            out[c++] = String.fromCharCode(0xd800 + (u >> 10));
            out[c++] = String.fromCharCode(0xdc00 + (u & 1023));
        }
        else {
            const c2 = bytes[pos++];
            const c3 = bytes[pos++];
            out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        }
    }
    return out.join('');
};
// We define it as an object literal instead of a class because a class compiled down to es5 can't
// be treeshaked. https://github.com/rollup/rollup/issues/1691
// Static lookup maps, lazily populated by init_()
const base64 = {
    /**
     * Maps bytes to characters.
     */
    byteToCharMap_: null,
    /**
     * Maps characters to bytes.
     */
    charToByteMap_: null,
    /**
     * Maps bytes to websafe characters.
     * @private
     */
    byteToCharMapWebSafe_: null,
    /**
     * Maps websafe characters to bytes.
     * @private
     */
    charToByteMapWebSafe_: null,
    /**
     * Our default alphabet, shared between
     * ENCODED_VALS and ENCODED_VALS_WEBSAFE
     */
    ENCODED_VALS_BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789',
    /**
     * Our default alphabet. Value 64 (=) is special; it means "nothing."
     */
    get ENCODED_VALS() {
        return this.ENCODED_VALS_BASE + '+/=';
    },
    /**
     * Our websafe alphabet.
     */
    get ENCODED_VALS_WEBSAFE() {
        return this.ENCODED_VALS_BASE + '-_.';
    },
    /**
     * Whether this browser supports the atob and btoa functions. This extension
     * started at Mozilla but is now implemented by many browsers. We use the
     * ASSUME_* variables to avoid pulling in the full useragent detection library
     * but still allowing the standard per-browser compilations.
     *
     */
    HAS_NATIVE_SUPPORT: typeof atob === 'function',
    /**
     * Base64-encode an array of bytes.
     *
     * @param input An array of bytes (numbers with
     *     value in [0, 255]) to encode.
     * @param webSafe Boolean indicating we should use the
     *     alternative alphabet.
     * @return The base64 encoded string.
     */
    encodeByteArray(input, webSafe) {
        if (!Array.isArray(input)) {
            throw Error('encodeByteArray takes an array as a parameter');
        }
        this.init_();
        const byteToCharMap = webSafe
            ? this.byteToCharMapWebSafe_
            : this.byteToCharMap_;
        const output = [];
        for (let i = 0; i < input.length; i += 3) {
            const byte1 = input[i];
            const haveByte2 = i + 1 < input.length;
            const byte2 = haveByte2 ? input[i + 1] : 0;
            const haveByte3 = i + 2 < input.length;
            const byte3 = haveByte3 ? input[i + 2] : 0;
            const outByte1 = byte1 >> 2;
            const outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
            let outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
            let outByte4 = byte3 & 0x3f;
            if (!haveByte3) {
                outByte4 = 64;
                if (!haveByte2) {
                    outByte3 = 64;
                }
            }
            output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
        }
        return output.join('');
    },
    /**
     * Base64-encode a string.
     *
     * @param input A string to encode.
     * @param webSafe If true, we should use the
     *     alternative alphabet.
     * @return The base64 encoded string.
     */
    encodeString(input, webSafe) {
        // Shortcut for Mozilla browsers that implement
        // a native base64 encoder in the form of "btoa/atob"
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
            return btoa(input);
        }
        return this.encodeByteArray(stringToByteArray$1(input), webSafe);
    },
    /**
     * Base64-decode a string.
     *
     * @param input to decode.
     * @param webSafe True if we should use the
     *     alternative alphabet.
     * @return string representing the decoded value.
     */
    decodeString(input, webSafe) {
        // Shortcut for Mozilla browsers that implement
        // a native base64 encoder in the form of "btoa/atob"
        if (this.HAS_NATIVE_SUPPORT && !webSafe) {
            return atob(input);
        }
        return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
    },
    /**
     * Base64-decode a string.
     *
     * In base-64 decoding, groups of four characters are converted into three
     * bytes.  If the encoder did not apply padding, the input length may not
     * be a multiple of 4.
     *
     * In this case, the last group will have fewer than 4 characters, and
     * padding will be inferred.  If the group has one or two characters, it decodes
     * to one byte.  If the group has three characters, it decodes to two bytes.
     *
     * @param input Input to decode.
     * @param webSafe True if we should use the web-safe alphabet.
     * @return bytes representing the decoded value.
     */
    decodeStringToByteArray(input, webSafe) {
        this.init_();
        const charToByteMap = webSafe
            ? this.charToByteMapWebSafe_
            : this.charToByteMap_;
        const output = [];
        for (let i = 0; i < input.length;) {
            const byte1 = charToByteMap[input.charAt(i++)];
            const haveByte2 = i < input.length;
            const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
            ++i;
            const haveByte3 = i < input.length;
            const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
            ++i;
            const haveByte4 = i < input.length;
            const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
            ++i;
            if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
                throw new DecodeBase64StringError();
            }
            const outByte1 = (byte1 << 2) | (byte2 >> 4);
            output.push(outByte1);
            if (byte3 !== 64) {
                const outByte2 = ((byte2 << 4) & 0xf0) | (byte3 >> 2);
                output.push(outByte2);
                if (byte4 !== 64) {
                    const outByte3 = ((byte3 << 6) & 0xc0) | byte4;
                    output.push(outByte3);
                }
            }
        }
        return output;
    },
    /**
     * Lazy static initialization function. Called before
     * accessing any of the static map variables.
     * @private
     */
    init_() {
        if (!this.byteToCharMap_) {
            this.byteToCharMap_ = {};
            this.charToByteMap_ = {};
            this.byteToCharMapWebSafe_ = {};
            this.charToByteMapWebSafe_ = {};
            // We want quick mappings back and forth, so we precompute two maps.
            for (let i = 0; i < this.ENCODED_VALS.length; i++) {
                this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
                this.charToByteMap_[this.byteToCharMap_[i]] = i;
                this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
                this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
                // Be forgiving when decoding and correctly decode both encodings.
                if (i >= this.ENCODED_VALS_BASE.length) {
                    this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
                    this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
                }
            }
        }
    }
};
/**
 * An error encountered while decoding base64 string.
 */
class DecodeBase64StringError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'DecodeBase64StringError';
    }
}
/**
 * URL-safe base64 encoding
 */
const base64Encode = function (str) {
    const utf8Bytes = stringToByteArray$1(str);
    return base64.encodeByteArray(utf8Bytes, true);
};
/**
 * URL-safe base64 encoding (without "." padding in the end).
 * e.g. Used in JSON Web Token (JWT) parts.
 */
const base64urlEncodeWithoutPadding = function (str) {
    // Use base64url encoding and remove padding in the end (dot characters).
    return base64Encode(str).replace(/\./g, '');
};
/**
 * URL-safe base64 decoding
 *
 * NOTE: DO NOT use the global atob() function - it does NOT support the
 * base64Url variant encoding.
 *
 * @param str To be decoded
 * @return Decoded result, if possible
 */
const base64Decode = function (str) {
    try {
        return base64.decodeString(str, true);
    }
    catch (e) {
        console.error('base64Decode failed: ', e);
    }
    return null;
};

/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Polyfill for `globalThis` object.
 * @returns the `globalThis` object for the given environment.
 * @public
 */
function getGlobal() {
    if (typeof self !== 'undefined') {
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    throw new Error('Unable to locate global object.');
}

/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
/**
 * Attempt to read defaults from a JSON string provided to
 * process(.)env(.)__FIREBASE_DEFAULTS__ or a JSON file whose path is in
 * process(.)env(.)__FIREBASE_DEFAULTS_PATH__
 * The dots are in parens because certain compilers (Vite?) cannot
 * handle seeing that variable in comments.
 * See https://github.com/firebase/firebase-js-sdk/issues/6838
 */
const getDefaultsFromEnvVariable = () => {
    if (typeof process === 'undefined' || typeof process.env === 'undefined') {
        return;
    }
    const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
    if (defaultsJsonString) {
        return JSON.parse(defaultsJsonString);
    }
};
const getDefaultsFromCookie = () => {
    if (typeof document === 'undefined') {
        return;
    }
    let match;
    try {
        match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
    }
    catch (e) {
        // Some environments such as Angular Universal SSR have a
        // `document` object but error on accessing `document.cookie`.
        return;
    }
    const decoded = match && base64Decode(match[1]);
    return decoded && JSON.parse(decoded);
};
/**
 * Get the __FIREBASE_DEFAULTS__ object. It checks in order:
 * (1) if such an object exists as a property of `globalThis`
 * (2) if such an object was provided on a shell environment variable
 * (3) if such an object exists in a cookie
 * @public
 */
const getDefaults = () => {
    try {
        return (getDefaultsFromGlobal() ||
            getDefaultsFromEnvVariable() ||
            getDefaultsFromCookie());
    }
    catch (e) {
        /**
         * Catch-all for being unable to get __FIREBASE_DEFAULTS__ due
         * to any environment case we have not accounted for. Log to
         * info instead of swallowing so we can find these unknown cases
         * and add paths for them if needed.
         */
        console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
        return;
    }
};
/**
 * Returns Firebase app config stored in the __FIREBASE_DEFAULTS__ object.
 * @public
 */
const getDefaultAppConfig = () => { var _a; return (_a = getDefaults()) === null || _a === void 0 ? void 0 : _a.config; };

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Deferred {
    constructor() {
        this.reject = () => { };
        this.resolve = () => { };
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    /**
     * Our API internals are not promiseified and cannot because our callback APIs have subtle expectations around
     * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
     * and returns a node-style callback which will resolve or reject the Deferred's promise.
     */
    wrapCallback(callback) {
        return (error, value) => {
            if (error) {
                this.reject(error);
            }
            else {
                this.resolve(value);
            }
            if (typeof callback === 'function') {
                // Attaching noop handler just in case developer wasn't expecting
                // promises
                this.promise.catch(() => { });
                // Some of our callbacks don't expect a value and our own tests
                // assert that the parameter length is 1
                if (callback.length === 1) {
                    callback(error);
                }
                else {
                    callback(error, value);
                }
            }
        };
    }
}
/**
 * This method checks if indexedDB is supported by current browser/service worker context
 * @return true if indexedDB is supported by current browser/service worker context
 */
function isIndexedDBAvailable() {
    try {
        return typeof indexedDB === 'object';
    }
    catch (e) {
        return false;
    }
}
/**
 * This method validates browser/sw context for indexedDB by opening a dummy indexedDB database and reject
 * if errors occur during the database open operation.
 *
 * @throws exception if current browser/sw context can't run idb.open (ex: Safari iframe, Firefox
 * private browsing)
 */
function validateIndexedDBOpenable() {
    return new Promise((resolve, reject) => {
        try {
            let preExist = true;
            const DB_CHECK_NAME = 'validate-browser-context-for-indexeddb-analytics-module';
            const request = self.indexedDB.open(DB_CHECK_NAME);
            request.onsuccess = () => {
                request.result.close();
                // delete database only when it doesn't pre-exist
                if (!preExist) {
                    self.indexedDB.deleteDatabase(DB_CHECK_NAME);
                }
                resolve(true);
            };
            request.onupgradeneeded = () => {
                preExist = false;
            };
            request.onerror = () => {
                var _a;
                reject(((_a = request.error) === null || _a === void 0 ? void 0 : _a.message) || '');
            };
        }
        catch (error) {
            reject(error);
        }
    });
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Standardized Firebase Error.
 *
 * Usage:
 *
 *   // Typescript string literals for type-safe codes
 *   type Err =
 *     'unknown' |
 *     'object-not-found'
 *     ;
 *
 *   // Closure enum for type-safe error codes
 *   // at-enum {string}
 *   var Err = {
 *     UNKNOWN: 'unknown',
 *     OBJECT_NOT_FOUND: 'object-not-found',
 *   }
 *
 *   let errors: Map<Err, string> = {
 *     'generic-error': "Unknown error",
 *     'file-not-found': "Could not find file: {$file}",
 *   };
 *
 *   // Type-safe function - must pass a valid error code as param.
 *   let error = new ErrorFactory<Err>('service', 'Service', errors);
 *
 *   ...
 *   throw error.create(Err.GENERIC);
 *   ...
 *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
 *   ...
 *   // Service: Could not file file: foo.txt (service/file-not-found).
 *
 *   catch (e) {
 *     assert(e.message === "Could not find file: foo.txt.");
 *     if ((e as FirebaseError)?.code === 'service/file-not-found') {
 *       console.log("Could not read file: " + e['file']);
 *     }
 *   }
 */
const ERROR_NAME = 'FirebaseError';
// Based on code from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
class FirebaseError extends Error {
    constructor(
    /** The error code for this error. */
    code, message, 
    /** Custom data for this error. */
    customData) {
        super(message);
        this.code = code;
        this.customData = customData;
        /** The custom name for all FirebaseErrors. */
        this.name = ERROR_NAME;
        // Fix For ES5
        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, FirebaseError.prototype);
        // Maintains proper stack trace for where our error was thrown.
        // Only available on V8.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrorFactory.prototype.create);
        }
    }
}
class ErrorFactory {
    constructor(service, serviceName, errors) {
        this.service = service;
        this.serviceName = serviceName;
        this.errors = errors;
    }
    create(code, ...data) {
        const customData = data[0] || {};
        const fullCode = `${this.service}/${code}`;
        const template = this.errors[code];
        const message = template ? replaceTemplate(template, customData) : 'Error';
        // Service Name: Error message (service/code).
        const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
        const error = new FirebaseError(fullCode, fullMessage, customData);
        return error;
    }
}
function replaceTemplate(template, data) {
    return template.replace(PATTERN, (_, key) => {
        const value = data[key];
        return value != null ? String(value) : `<${key}?>`;
    });
}
const PATTERN = /\{\$([^}]+)}/g;
/**
 * Deep equal two objects. Support Arrays and Objects.
 */
function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    for (const k of aKeys) {
        if (!bKeys.includes(k)) {
            return false;
        }
        const aProp = a[k];
        const bProp = b[k];
        if (isObject(aProp) && isObject(bProp)) {
            if (!deepEqual(aProp, bProp)) {
                return false;
            }
        }
        else if (aProp !== bProp) {
            return false;
        }
    }
    for (const k of bKeys) {
        if (!aKeys.includes(k)) {
            return false;
        }
    }
    return true;
}
function isObject(thing) {
    return thing !== null && typeof thing === 'object';
}

/**
 * Component for service name T, e.g. `auth`, `auth-internal`
 */
class Component {
    /**
     *
     * @param name The public service name, e.g. app, auth, firestore, database
     * @param instanceFactory Service factory responsible for creating the public interface
     * @param type whether the service provided by the component is public or private
     */
    constructor(name, instanceFactory, type) {
        this.name = name;
        this.instanceFactory = instanceFactory;
        this.type = type;
        this.multipleInstances = false;
        /**
         * Properties to be added to the service namespace
         */
        this.serviceProps = {};
        this.instantiationMode = "LAZY" /* InstantiationMode.LAZY */;
        this.onInstanceCreated = null;
    }
    setInstantiationMode(mode) {
        this.instantiationMode = mode;
        return this;
    }
    setMultipleInstances(multipleInstances) {
        this.multipleInstances = multipleInstances;
        return this;
    }
    setServiceProps(props) {
        this.serviceProps = props;
        return this;
    }
    setInstanceCreatedCallback(callback) {
        this.onInstanceCreated = callback;
        return this;
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_ENTRY_NAME$1 = '[DEFAULT]';

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Provider for instance for service name T, e.g. 'auth', 'auth-internal'
 * NameServiceMapping[T] is an alias for the type of the instance
 */
class Provider {
    constructor(name, container) {
        this.name = name;
        this.container = container;
        this.component = null;
        this.instances = new Map();
        this.instancesDeferred = new Map();
        this.instancesOptions = new Map();
        this.onInitCallbacks = new Map();
    }
    /**
     * @param identifier A provider can provide mulitple instances of a service
     * if this.component.multipleInstances is true.
     */
    get(identifier) {
        // if multipleInstances is not supported, use the default name
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        if (!this.instancesDeferred.has(normalizedIdentifier)) {
            const deferred = new Deferred();
            this.instancesDeferred.set(normalizedIdentifier, deferred);
            if (this.isInitialized(normalizedIdentifier) ||
                this.shouldAutoInitialize()) {
                // initialize the service if it can be auto-initialized
                try {
                    const instance = this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                    if (instance) {
                        deferred.resolve(instance);
                    }
                }
                catch (e) {
                    // when the instance factory throws an exception during get(), it should not cause
                    // a fatal error. We just return the unresolved promise in this case.
                }
            }
        }
        return this.instancesDeferred.get(normalizedIdentifier).promise;
    }
    getImmediate(options) {
        var _a;
        // if multipleInstances is not supported, use the default name
        const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === void 0 ? void 0 : options.identifier);
        const optional = (_a = options === null || options === void 0 ? void 0 : options.optional) !== null && _a !== void 0 ? _a : false;
        if (this.isInitialized(normalizedIdentifier) ||
            this.shouldAutoInitialize()) {
            try {
                return this.getOrInitializeService({
                    instanceIdentifier: normalizedIdentifier
                });
            }
            catch (e) {
                if (optional) {
                    return null;
                }
                else {
                    throw e;
                }
            }
        }
        else {
            // In case a component is not initialized and should/can not be auto-initialized at the moment, return null if the optional flag is set, or throw
            if (optional) {
                return null;
            }
            else {
                throw Error(`Service ${this.name} is not available`);
            }
        }
    }
    getComponent() {
        return this.component;
    }
    setComponent(component) {
        if (component.name !== this.name) {
            throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
        }
        if (this.component) {
            throw Error(`Component for ${this.name} has already been provided`);
        }
        this.component = component;
        // return early without attempting to initialize the component if the component requires explicit initialization (calling `Provider.initialize()`)
        if (!this.shouldAutoInitialize()) {
            return;
        }
        // if the service is eager, initialize the default instance
        if (isComponentEager(component)) {
            try {
                this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME$1 });
            }
            catch (e) {
                // when the instance factory for an eager Component throws an exception during the eager
                // initialization, it should not cause a fatal error.
                // TODO: Investigate if we need to make it configurable, because some component may want to cause
                // a fatal error in this case?
            }
        }
        // Create service instances for the pending promises and resolve them
        // NOTE: if this.multipleInstances is false, only the default instance will be created
        // and all promises with resolve with it regardless of the identifier.
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            try {
                // `getOrInitializeService()` should always return a valid instance since a component is guaranteed. use ! to make typescript happy.
                const instance = this.getOrInitializeService({
                    instanceIdentifier: normalizedIdentifier
                });
                instanceDeferred.resolve(instance);
            }
            catch (e) {
                // when the instance factory throws an exception, it should not cause
                // a fatal error. We just leave the promise unresolved.
            }
        }
    }
    clearInstance(identifier = DEFAULT_ENTRY_NAME$1) {
        this.instancesDeferred.delete(identifier);
        this.instancesOptions.delete(identifier);
        this.instances.delete(identifier);
    }
    // app.delete() will call this method on every provider to delete the services
    // TODO: should we mark the provider as deleted?
    async delete() {
        const services = Array.from(this.instances.values());
        await Promise.all([
            ...services
                .filter(service => 'INTERNAL' in service) // legacy services
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map(service => service.INTERNAL.delete()),
            ...services
                .filter(service => '_delete' in service) // modularized services
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map(service => service._delete())
        ]);
    }
    isComponentSet() {
        return this.component != null;
    }
    isInitialized(identifier = DEFAULT_ENTRY_NAME$1) {
        return this.instances.has(identifier);
    }
    getOptions(identifier = DEFAULT_ENTRY_NAME$1) {
        return this.instancesOptions.get(identifier) || {};
    }
    initialize(opts = {}) {
        const { options = {} } = opts;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
        if (this.isInitialized(normalizedIdentifier)) {
            throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
        }
        if (!this.isComponentSet()) {
            throw Error(`Component ${this.name} has not been registered yet`);
        }
        const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier,
            options
        });
        // resolve any pending promise waiting for the service instance
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            if (normalizedIdentifier === normalizedDeferredIdentifier) {
                instanceDeferred.resolve(instance);
            }
        }
        return instance;
    }
    /**
     *
     * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
     * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
     *
     * @param identifier An optional instance identifier
     * @returns a function to unregister the callback
     */
    onInit(callback, identifier) {
        var _a;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== void 0 ? _a : new Set();
        existingCallbacks.add(callback);
        this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
        const existingInstance = this.instances.get(normalizedIdentifier);
        if (existingInstance) {
            callback(existingInstance, normalizedIdentifier);
        }
        return () => {
            existingCallbacks.delete(callback);
        };
    }
    /**
     * Invoke onInit callbacks synchronously
     * @param instance the service instance`
     */
    invokeOnInitCallbacks(instance, identifier) {
        const callbacks = this.onInitCallbacks.get(identifier);
        if (!callbacks) {
            return;
        }
        for (const callback of callbacks) {
            try {
                callback(instance, identifier);
            }
            catch (_a) {
                // ignore errors in the onInit callback
            }
        }
    }
    getOrInitializeService({ instanceIdentifier, options = {} }) {
        let instance = this.instances.get(instanceIdentifier);
        if (!instance && this.component) {
            instance = this.component.instanceFactory(this.container, {
                instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
                options
            });
            this.instances.set(instanceIdentifier, instance);
            this.instancesOptions.set(instanceIdentifier, options);
            /**
             * Invoke onInit listeners.
             * Note this.component.onInstanceCreated is different, which is used by the component creator,
             * while onInit listeners are registered by consumers of the provider.
             */
            this.invokeOnInitCallbacks(instance, instanceIdentifier);
            /**
             * Order is important
             * onInstanceCreated() should be called after this.instances.set(instanceIdentifier, instance); which
             * makes `isInitialized()` return true.
             */
            if (this.component.onInstanceCreated) {
                try {
                    this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
                }
                catch (_a) {
                    // ignore errors in the onInstanceCreatedCallback
                }
            }
        }
        return instance || null;
    }
    normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME$1) {
        if (this.component) {
            return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME$1;
        }
        else {
            return identifier; // assume multiple instances are supported before the component is provided.
        }
    }
    shouldAutoInitialize() {
        return (!!this.component &&
            this.component.instantiationMode !== "EXPLICIT" /* InstantiationMode.EXPLICIT */);
    }
}
// undefined should be passed to the service factory for the default instance
function normalizeIdentifierForFactory(identifier) {
    return identifier === DEFAULT_ENTRY_NAME$1 ? undefined : identifier;
}
function isComponentEager(component) {
    return component.instantiationMode === "EAGER" /* InstantiationMode.EAGER */;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * ComponentContainer that provides Providers for service name T, e.g. `auth`, `auth-internal`
 */
class ComponentContainer {
    constructor(name) {
        this.name = name;
        this.providers = new Map();
    }
    /**
     *
     * @param component Component being added
     * @param overwrite When a component with the same name has already been registered,
     * if overwrite is true: overwrite the existing component with the new component and create a new
     * provider with the new component. It can be useful in tests where you want to use different mocks
     * for different tests.
     * if overwrite is false: throw an exception
     */
    addComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
            throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
        }
        provider.setComponent(component);
    }
    addOrOverwriteComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
            // delete the existing provider from the container, so we can register the new component
            this.providers.delete(component.name);
        }
        this.addComponent(component);
    }
    /**
     * getProvider provides a type safe interface where it can only be called with a field name
     * present in NameServiceMapping interface.
     *
     * Firebase SDKs providing services should extend NameServiceMapping interface to register
     * themselves.
     */
    getProvider(name) {
        if (this.providers.has(name)) {
            return this.providers.get(name);
        }
        // create a Provider for a service that hasn't registered with Firebase
        const provider = new Provider(name, this);
        this.providers.set(name, provider);
        return provider;
    }
    getProviders() {
        return Array.from(this.providers.values());
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A container for all of the Logger instances
 */
const instances = [];
/**
 * The JS SDK supports 5 log levels and also allows a user the ability to
 * silence the logs altogether.
 *
 * The order is a follows:
 * DEBUG < VERBOSE < INFO < WARN < ERROR
 *
 * All of the log types above the current log level will be captured (i.e. if
 * you set the log level to `INFO`, errors will still be logged, but `DEBUG` and
 * `VERBOSE` logs will not)
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["VERBOSE"] = 1] = "VERBOSE";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
const levelStringToEnum = {
    'debug': LogLevel.DEBUG,
    'verbose': LogLevel.VERBOSE,
    'info': LogLevel.INFO,
    'warn': LogLevel.WARN,
    'error': LogLevel.ERROR,
    'silent': LogLevel.SILENT
};
/**
 * The default log level
 */
const defaultLogLevel = LogLevel.INFO;
/**
 * By default, `console.debug` is not displayed in the developer console (in
 * chrome). To avoid forcing users to have to opt-in to these logs twice
 * (i.e. once for firebase, and once in the console), we are sending `DEBUG`
 * logs to the `console.log` function.
 */
const ConsoleMethod = {
    [LogLevel.DEBUG]: 'log',
    [LogLevel.VERBOSE]: 'log',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error'
};
/**
 * The default log handler will forward DEBUG, VERBOSE, INFO, WARN, and ERROR
 * messages on to their corresponding console counterparts (if the log method
 * is supported by the current log level)
 */
const defaultLogHandler = (instance, logType, ...args) => {
    if (logType < instance.logLevel) {
        return;
    }
    const now = new Date().toISOString();
    const method = ConsoleMethod[logType];
    if (method) {
        console[method](`[${now}]  ${instance.name}:`, ...args);
    }
    else {
        throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
    }
};
class Logger {
    /**
     * Gives you an instance of a Logger to capture messages according to
     * Firebase's logging scheme.
     *
     * @param name The name that the logs will be associated with
     */
    constructor(name) {
        this.name = name;
        /**
         * The log level of the given Logger instance.
         */
        this._logLevel = defaultLogLevel;
        /**
         * The main (internal) log handler for the Logger instance.
         * Can be set to a new function in internal package code but not by user.
         */
        this._logHandler = defaultLogHandler;
        /**
         * The optional, additional, user-defined log handler for the Logger instance.
         */
        this._userLogHandler = null;
        /**
         * Capture the current instance for later use
         */
        instances.push(this);
    }
    get logLevel() {
        return this._logLevel;
    }
    set logLevel(val) {
        if (!(val in LogLevel)) {
            throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
        }
        this._logLevel = val;
    }
    // Workaround for setter/getter having to be the same type.
    setLogLevel(val) {
        this._logLevel = typeof val === 'string' ? levelStringToEnum[val] : val;
    }
    get logHandler() {
        return this._logHandler;
    }
    set logHandler(val) {
        if (typeof val !== 'function') {
            throw new TypeError('Value assigned to `logHandler` must be a function');
        }
        this._logHandler = val;
    }
    get userLogHandler() {
        return this._userLogHandler;
    }
    set userLogHandler(val) {
        this._userLogHandler = val;
    }
    /**
     * The functions below are all based on the `console` interface
     */
    debug(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
        this._logHandler(this, LogLevel.DEBUG, ...args);
    }
    log(...args) {
        this._userLogHandler &&
            this._userLogHandler(this, LogLevel.VERBOSE, ...args);
        this._logHandler(this, LogLevel.VERBOSE, ...args);
    }
    info(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
        this._logHandler(this, LogLevel.INFO, ...args);
    }
    warn(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
        this._logHandler(this, LogLevel.WARN, ...args);
    }
    error(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
        this._logHandler(this, LogLevel.ERROR, ...args);
    }
}
function setLogLevel$1(level) {
    instances.forEach(inst => {
        inst.setLogLevel(level);
    });
}
function setUserLogHandler(logCallback, options) {
    for (const instance of instances) {
        let customLogLevel = null;
        if (options && options.level) {
            customLogLevel = levelStringToEnum[options.level];
        }
        if (logCallback === null) {
            instance.userLogHandler = null;
        }
        else {
            instance.userLogHandler = (instance, level, ...args) => {
                const message = args
                    .map(arg => {
                    if (arg == null) {
                        return null;
                    }
                    else if (typeof arg === 'string') {
                        return arg;
                    }
                    else if (typeof arg === 'number' || typeof arg === 'boolean') {
                        return arg.toString();
                    }
                    else if (arg instanceof Error) {
                        return arg.message;
                    }
                    else {
                        try {
                            return JSON.stringify(arg);
                        }
                        catch (ignored) {
                            return null;
                        }
                    }
                })
                    .filter(arg => arg)
                    .join(' ');
                if (level >= (customLogLevel !== null && customLogLevel !== void 0 ? customLogLevel : instance.logLevel)) {
                    logCallback({
                        level: LogLevel[level].toLowerCase(),
                        message,
                        args,
                        type: instance.name
                    });
                }
            };
        }
    }
}

const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const cursorRequestMap = new WeakMap();
const transactionDoneMap = new WeakMap();
const transactionStoreNamesMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    promise
        .then((value) => {
        // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
        // (see wrapFunction).
        if (value instanceof IDBCursor) {
            cursorRequestMap.set(value, request);
        }
        // Catching to avoid "Uncaught Promise exceptions"
    })
        .catch(() => { });
    // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Polyfill for objectStoreNames because of Edge.
            if (prop === 'objectStoreNames') {
                return target.objectStoreNames || transactionStoreNamesMap.get(target);
            }
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
    if (func === IDBDatabase.prototype.transaction &&
        !('objectStoreNames' in IDBTransaction.prototype)) {
        return function (storeNames, ...args) {
            const tx = func.call(unwrap(this), storeNames, ...args);
            transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
            return wrap(tx);
        };
    }
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(cursorRequestMap.get(this));
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class PlatformLoggerServiceImpl {
    constructor(container) {
        this.container = container;
    }
    // In initial implementation, this will be called by installations on
    // auth token refresh, and installations will send this string.
    getPlatformInfoString() {
        const providers = this.container.getProviders();
        // Loop through providers and get library/version pairs from any that are
        // version components.
        return providers
            .map(provider => {
            if (isVersionServiceProvider(provider)) {
                const service = provider.getImmediate();
                return `${service.library}/${service.version}`;
            }
            else {
                return null;
            }
        })
            .filter(logString => logString)
            .join(' ');
    }
}
/**
 *
 * @param provider check if this provider provides a VersionService
 *
 * NOTE: Using Provider<'app-version'> is a hack to indicate that the provider
 * provides VersionService. The provider is not necessarily a 'app-version'
 * provider.
 */
function isVersionServiceProvider(provider) {
    const component = provider.getComponent();
    return (component === null || component === void 0 ? void 0 : component.type) === "VERSION" /* ComponentType.VERSION */;
}

const name$o = "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
const version$1 = "0.9.9";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const logger = new Logger('https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js');

const name$n = "@firebase/app-compat";

const name$m = "@firebase/analytics-compat";

const name$l = "@firebase/analytics";

const name$k = "@firebase/app-check-compat";

const name$j = "@firebase/app-check";

const name$i = "@firebase/auth";

const name$h = "@firebase/auth-compat";

const name$g = "@firebase/database";

const name$f = "@firebase/database-compat";

const name$e = "@firebase/functions";

const name$d = "@firebase/functions-compat";

const name$c = "@firebase/installations";

const name$b = "@firebase/installations-compat";

const name$a = "@firebase/messaging";

const name$9 = "@firebase/messaging-compat";

const name$8 = "@firebase/performance";

const name$7 = "@firebase/performance-compat";

const name$6 = "@firebase/remote-config";

const name$5 = "@firebase/remote-config-compat";

const name$4 = "@firebase/storage";

const name$3 = "@firebase/storage-compat";

const name$2 = "@firebase/firestore";

const name$1 = "@firebase/firestore-compat";

const name$p = "firebase";
const version$2 = "9.21.0";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The default app name
 *
 * @internal
 */
const DEFAULT_ENTRY_NAME = '[DEFAULT]';
const PLATFORM_LOG_STRING = {
    [name$o]: 'fire-core',
    [name$n]: 'fire-core-compat',
    [name$l]: 'fire-analytics',
    [name$m]: 'fire-analytics-compat',
    [name$j]: 'fire-app-check',
    [name$k]: 'fire-app-check-compat',
    [name$i]: 'fire-auth',
    [name$h]: 'fire-auth-compat',
    [name$g]: 'fire-rtdb',
    [name$f]: 'fire-rtdb-compat',
    [name$e]: 'fire-fn',
    [name$d]: 'fire-fn-compat',
    [name$c]: 'fire-iid',
    [name$b]: 'fire-iid-compat',
    [name$a]: 'fire-fcm',
    [name$9]: 'fire-fcm-compat',
    [name$8]: 'fire-perf',
    [name$7]: 'fire-perf-compat',
    [name$6]: 'fire-rc',
    [name$5]: 'fire-rc-compat',
    [name$4]: 'fire-gcs',
    [name$3]: 'fire-gcs-compat',
    [name$2]: 'fire-fst',
    [name$1]: 'fire-fst-compat',
    'fire-js': 'fire-js',
    [name$p]: 'fire-js-all'
};

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @internal
 */
const _apps = new Map();
/**
 * Registered components.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _components = new Map();
/**
 * @param component - the component being added to this app's container
 *
 * @internal
 */
function _addComponent(app, component) {
    try {
        app.container.addComponent(component);
    }
    catch (e) {
        logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
    }
}
/**
 *
 * @internal
 */
function _addOrOverwriteComponent(app, component) {
    app.container.addOrOverwriteComponent(component);
}
/**
 *
 * @param component - the component to register
 * @returns whether or not the component is registered successfully
 *
 * @internal
 */
function _registerComponent(component) {
    const componentName = component.name;
    if (_components.has(componentName)) {
        logger.debug(`There were multiple attempts to register component ${componentName}.`);
        return false;
    }
    _components.set(componentName, component);
    // add the component to existing app instances
    for (const app of _apps.values()) {
        _addComponent(app, component);
    }
    return true;
}
/**
 *
 * @param app - FirebaseApp instance
 * @param name - service name
 *
 * @returns the provider for the service with the matching name
 *
 * @internal
 */
function _getProvider(app, name) {
    const heartbeatController = app.container
        .getProvider('heartbeat')
        .getImmediate({ optional: true });
    if (heartbeatController) {
        void heartbeatController.triggerHeartbeat();
    }
    return app.container.getProvider(name);
}
/**
 *
 * @param app - FirebaseApp instance
 * @param name - service name
 * @param instanceIdentifier - service instance identifier in case the service supports multiple instances
 *
 * @internal
 */
function _removeServiceInstance(app, name, instanceIdentifier = DEFAULT_ENTRY_NAME) {
    _getProvider(app, name).clearInstance(instanceIdentifier);
}
/**
 * Test only
 *
 * @internal
 */
function _clearComponents() {
    _components.clear();
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ERRORS = {
    ["no-app" /* AppError.NO_APP */]: "No Firebase App '{$appName}' has been created - " +
        'call Firebase App.initializeApp()',
    ["bad-app-name" /* AppError.BAD_APP_NAME */]: "Illegal App name: '{$appName}",
    ["duplicate-app" /* AppError.DUPLICATE_APP */]: "Firebase App named '{$appName}' already exists with different options or config",
    ["app-deleted" /* AppError.APP_DELETED */]: "Firebase App named '{$appName}' already deleted",
    ["no-options" /* AppError.NO_OPTIONS */]: 'Need to provide options, when not being deployed to hosting via source.',
    ["invalid-app-argument" /* AppError.INVALID_APP_ARGUMENT */]: 'firebase.{$appName}() takes either no argument or a ' +
        'Firebase App instance.',
    ["invalid-log-argument" /* AppError.INVALID_LOG_ARGUMENT */]: 'First argument to `onLog` must be null or a function.',
    ["idb-open" /* AppError.IDB_OPEN */]: 'Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.',
    ["idb-get" /* AppError.IDB_GET */]: 'Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.',
    ["idb-set" /* AppError.IDB_WRITE */]: 'Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.',
    ["idb-delete" /* AppError.IDB_DELETE */]: 'Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.'
};
const ERROR_FACTORY = new ErrorFactory('app', 'Firebase', ERRORS);

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class FirebaseAppImpl {
    constructor(options, config, container) {
        this._isDeleted = false;
        this._options = Object.assign({}, options);
        this._config = Object.assign({}, config);
        this._name = config.name;
        this._automaticDataCollectionEnabled =
            config.automaticDataCollectionEnabled;
        this._container = container;
        this.container.addComponent(new Component('app', () => this, "PUBLIC" /* ComponentType.PUBLIC */));
    }
    get automaticDataCollectionEnabled() {
        this.checkDestroyed();
        return this._automaticDataCollectionEnabled;
    }
    set automaticDataCollectionEnabled(val) {
        this.checkDestroyed();
        this._automaticDataCollectionEnabled = val;
    }
    get name() {
        this.checkDestroyed();
        return this._name;
    }
    get options() {
        this.checkDestroyed();
        return this._options;
    }
    get config() {
        this.checkDestroyed();
        return this._config;
    }
    get container() {
        return this._container;
    }
    get isDeleted() {
        return this._isDeleted;
    }
    set isDeleted(val) {
        this._isDeleted = val;
    }
    /**
     * This function will throw an Error if the App has already been deleted -
     * use before performing API actions on the App.
     */
    checkDestroyed() {
        if (this.isDeleted) {
            throw ERROR_FACTORY.create("app-deleted" /* AppError.APP_DELETED */, { appName: this._name });
        }
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The current SDK version.
 *
 * @public
 */
const SDK_VERSION = version$2;
function initializeApp(_options, rawConfig = {}) {
    let options = _options;
    if (typeof rawConfig !== 'object') {
        const name = rawConfig;
        rawConfig = { name };
    }
    const config = Object.assign({ name: DEFAULT_ENTRY_NAME, automaticDataCollectionEnabled: false }, rawConfig);
    const name = config.name;
    if (typeof name !== 'string' || !name) {
        throw ERROR_FACTORY.create("bad-app-name" /* AppError.BAD_APP_NAME */, {
            appName: String(name)
        });
    }
    options || (options = getDefaultAppConfig());
    if (!options) {
        throw ERROR_FACTORY.create("no-options" /* AppError.NO_OPTIONS */);
    }
    const existingApp = _apps.get(name);
    if (existingApp) {
        // return the existing app if options and config deep equal the ones in the existing app.
        if (deepEqual(options, existingApp.options) &&
            deepEqual(config, existingApp.config)) {
            return existingApp;
        }
        else {
            throw ERROR_FACTORY.create("duplicate-app" /* AppError.DUPLICATE_APP */, { appName: name });
        }
    }
    const container = new ComponentContainer(name);
    for (const component of _components.values()) {
        container.addComponent(component);
    }
    const newApp = new FirebaseAppImpl(options, config, container);
    _apps.set(name, newApp);
    return newApp;
}
/**
 * Retrieves a {@link @firebase/app#FirebaseApp} instance.
 *
 * When called with no arguments, the default app is returned. When an app name
 * is provided, the app corresponding to that name is returned.
 *
 * An exception is thrown if the app being retrieved has not yet been
 * initialized.
 *
 * @example
 * ```javascript
 * // Return the default app
 * const app = getApp();
 * ```
 *
 * @example
 * ```javascript
 * // Return a named app
 * const otherApp = getApp("otherApp");
 * ```
 *
 * @param name - Optional name of the app to return. If no name is
 *   provided, the default is `"[DEFAULT]"`.
 *
 * @returns The app corresponding to the provided app name.
 *   If no app name is provided, the default app is returned.
 *
 * @public
 */
function getApp(name = DEFAULT_ENTRY_NAME) {
    const app = _apps.get(name);
    if (!app && name === DEFAULT_ENTRY_NAME) {
        return initializeApp();
    }
    if (!app) {
        throw ERROR_FACTORY.create("no-app" /* AppError.NO_APP */, { appName: name });
    }
    return app;
}
/**
 * A (read-only) array of all initialized apps.
 * @public
 */
function getApps() {
    return Array.from(_apps.values());
}
/**
 * Renders this app unusable and frees the resources of all associated
 * services.
 *
 * @example
 * ```javascript
 * deleteApp(app)
 *   .then(function() {
 *     console.log("App deleted successfully");
 *   })
 *   .catch(function(error) {
 *     console.log("Error deleting app:", error);
 *   });
 * ```
 *
 * @public
 */
async function deleteApp(app) {
    const name = app.name;
    if (_apps.has(name)) {
        _apps.delete(name);
        await Promise.all(app.container
            .getProviders()
            .map(provider => provider.delete()));
        app.isDeleted = true;
    }
}
/**
 * Registers a library's name and version for platform logging purposes.
 * @param library - Name of 1p or 3p library (e.g. firestore, angularfire)
 * @param version - Current version of that library.
 * @param variant - Bundle variant, e.g., node, rn, etc.
 *
 * @public
 */
function registerVersion(libraryKeyOrName, version, variant) {
    var _a;
    // TODO: We can use this check to whitelist strings when/if we set up
    // a good whitelist system.
    let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0 ? _a : libraryKeyOrName;
    if (variant) {
        library += `-${variant}`;
    }
    const libraryMismatch = library.match(/\s|\//);
    const versionMismatch = version.match(/\s|\//);
    if (libraryMismatch || versionMismatch) {
        const warning = [
            `Unable to register library "${library}" with version "${version}":`
        ];
        if (libraryMismatch) {
            warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
        }
        if (libraryMismatch && versionMismatch) {
            warning.push('and');
        }
        if (versionMismatch) {
            warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
        }
        logger.warn(warning.join(' '));
        return;
    }
    _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION" /* ComponentType.VERSION */));
}
/**
 * Sets log handler for all Firebase SDKs.
 * @param logCallback - An optional custom log handler that executes user code whenever
 * the Firebase SDK makes a logging call.
 *
 * @public
 */
function onLog(logCallback, options) {
    if (logCallback !== null && typeof logCallback !== 'function') {
        throw ERROR_FACTORY.create("invalid-log-argument" /* AppError.INVALID_LOG_ARGUMENT */);
    }
    setUserLogHandler(logCallback, options);
}
/**
 * Sets log level for all Firebase SDKs.
 *
 * All of the log types above the current log level are captured (i.e. if
 * you set the log level to `info`, errors are logged, but `debug` and
 * `verbose` logs are not).
 *
 * @public
 */
function setLogLevel(logLevel) {
    setLogLevel$1(logLevel);
}

/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DB_NAME = 'firebase-heartbeat-database';
const DB_VERSION = 1;
const STORE_NAME = 'firebase-heartbeat-store';
let dbPromise = null;
function getDbPromise() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade: (db, oldVersion) => {
                // We don't use 'break' in this switch statement, the fall-through
                // behavior is what we want, because if there are multiple versions between
                // the old version and the current version, we want ALL the migrations
                // that correspond to those versions to run, not only the last one.
                // eslint-disable-next-line default-case
                switch (oldVersion) {
                    case 0:
                        db.createObjectStore(STORE_NAME);
                }
            }
        }).catch(e => {
            throw ERROR_FACTORY.create("idb-open" /* AppError.IDB_OPEN */, {
                originalErrorMessage: e.message
            });
        });
    }
    return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app) {
    try {
        const db = await getDbPromise();
        return db
            .transaction(STORE_NAME)
            .objectStore(STORE_NAME)
            .get(computeKey(app));
    }
    catch (e) {
        if (e instanceof FirebaseError) {
            logger.warn(e.message);
        }
        else {
            const idbGetError = ERROR_FACTORY.create("idb-get" /* AppError.IDB_GET */, {
                originalErrorMessage: e === null || e === void 0 ? void 0 : e.message
            });
            logger.warn(idbGetError.message);
        }
    }
}
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
    try {
        const db = await getDbPromise();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const objectStore = tx.objectStore(STORE_NAME);
        await objectStore.put(heartbeatObject, computeKey(app));
        return tx.done;
    }
    catch (e) {
        if (e instanceof FirebaseError) {
            logger.warn(e.message);
        }
        else {
            const idbGetError = ERROR_FACTORY.create("idb-set" /* AppError.IDB_WRITE */, {
                originalErrorMessage: e === null || e === void 0 ? void 0 : e.message
            });
            logger.warn(idbGetError.message);
        }
    }
}
function computeKey(app) {
    return `${app.name}!${app.options.appId}`;
}

/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const MAX_HEADER_BYTES = 1024;
// 30 days
const STORED_HEARTBEAT_RETENTION_MAX_MILLIS = 30 * 24 * 60 * 60 * 1000;
class HeartbeatServiceImpl {
    constructor(container) {
        this.container = container;
        /**
         * In-memory cache for heartbeats, used by getHeartbeatsHeader() to generate
         * the header string.
         * Stores one record per date. This will be consolidated into the standard
         * format of one record per user agent string before being sent as a header.
         * Populated from indexedDB when the controller is instantiated and should
         * be kept in sync with indexedDB.
         * Leave public for easier testing.
         */
        this._heartbeatsCache = null;
        const app = this.container.getProvider('app').getImmediate();
        this._storage = new HeartbeatStorageImpl(app);
        this._heartbeatsCachePromise = this._storage.read().then(result => {
            this._heartbeatsCache = result;
            return result;
        });
    }
    /**
     * Called to report a heartbeat. The function will generate
     * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
     * to IndexedDB.
     * Note that we only store one heartbeat per day. So if a heartbeat for today is
     * already logged, subsequent calls to this function in the same day will be ignored.
     */
    async triggerHeartbeat() {
        const platformLogger = this.container
            .getProvider('platform-logger')
            .getImmediate();
        // This is the "Firebase user agent" string from the platform logger
        // service, not the browser user agent.
        const agent = platformLogger.getPlatformInfoString();
        const date = getUTCDateString();
        if (this._heartbeatsCache === null) {
            this._heartbeatsCache = await this._heartbeatsCachePromise;
        }
        // Do not store a heartbeat if one is already stored for this day
        // or if a header has already been sent today.
        if (this._heartbeatsCache.lastSentHeartbeatDate === date ||
            this._heartbeatsCache.heartbeats.some(singleDateHeartbeat => singleDateHeartbeat.date === date)) {
            return;
        }
        else {
            // There is no entry for this date. Create one.
            this._heartbeatsCache.heartbeats.push({ date, agent });
        }
        // Remove entries older than 30 days.
        this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter(singleDateHeartbeat => {
            const hbTimestamp = new Date(singleDateHeartbeat.date).valueOf();
            const now = Date.now();
            return now - hbTimestamp <= STORED_HEARTBEAT_RETENTION_MAX_MILLIS;
        });
        return this._storage.overwrite(this._heartbeatsCache);
    }
    /**
     * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
     * It also clears all heartbeats from memory as well as in IndexedDB.
     *
     * NOTE: Consuming product SDKs should not send the header if this method
     * returns an empty string.
     */
    async getHeartbeatsHeader() {
        if (this._heartbeatsCache === null) {
            await this._heartbeatsCachePromise;
        }
        // If it's still null or the array is empty, there is no data to send.
        if (this._heartbeatsCache === null ||
            this._heartbeatsCache.heartbeats.length === 0) {
            return '';
        }
        const date = getUTCDateString();
        // Extract as many heartbeats from the cache as will fit under the size limit.
        const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
        const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
        // Store last sent date to prevent another being logged/sent for the same day.
        this._heartbeatsCache.lastSentHeartbeatDate = date;
        if (unsentEntries.length > 0) {
            // Store any unsent entries if they exist.
            this._heartbeatsCache.heartbeats = unsentEntries;
            // This seems more likely than emptying the array (below) to lead to some odd state
            // since the cache isn't empty and this will be called again on the next request,
            // and is probably safest if we await it.
            await this._storage.overwrite(this._heartbeatsCache);
        }
        else {
            this._heartbeatsCache.heartbeats = [];
            // Do not wait for this, to reduce latency.
            void this._storage.overwrite(this._heartbeatsCache);
        }
        return headerString;
    }
}
function getUTCDateString() {
    const today = new Date();
    // Returns date format 'YYYY-MM-DD'
    return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
    // Heartbeats grouped by user agent in the standard format to be sent in
    // the header.
    const heartbeatsToSend = [];
    // Single date format heartbeats that are not sent.
    let unsentEntries = heartbeatsCache.slice();
    for (const singleDateHeartbeat of heartbeatsCache) {
        // Look for an existing entry with the same user agent.
        const heartbeatEntry = heartbeatsToSend.find(hb => hb.agent === singleDateHeartbeat.agent);
        if (!heartbeatEntry) {
            // If no entry for this user agent exists, create one.
            heartbeatsToSend.push({
                agent: singleDateHeartbeat.agent,
                dates: [singleDateHeartbeat.date]
            });
            if (countBytes(heartbeatsToSend) > maxSize) {
                // If the header would exceed max size, remove the added heartbeat
                // entry and stop adding to the header.
                heartbeatsToSend.pop();
                break;
            }
        }
        else {
            heartbeatEntry.dates.push(singleDateHeartbeat.date);
            // If the header would exceed max size, remove the added date
            // and stop adding to the header.
            if (countBytes(heartbeatsToSend) > maxSize) {
                heartbeatEntry.dates.pop();
                break;
            }
        }
        // Pop unsent entry from queue. (Skipped if adding the entry exceeded
        // quota and the loop breaks early.)
        unsentEntries = unsentEntries.slice(1);
    }
    return {
        heartbeatsToSend,
        unsentEntries
    };
}
class HeartbeatStorageImpl {
    constructor(app) {
        this.app = app;
        this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
    }
    async runIndexedDBEnvironmentCheck() {
        if (!isIndexedDBAvailable()) {
            return false;
        }
        else {
            return validateIndexedDBOpenable()
                .then(() => true)
                .catch(() => false);
        }
    }
    /**
     * Read all heartbeats.
     */
    async read() {
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
            return { heartbeats: [] };
        }
        else {
            const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
            return idbHeartbeatObject || { heartbeats: [] };
        }
    }
    // overwrite the storage with the provided heartbeats
    async overwrite(heartbeatsObject) {
        var _a;
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
            return;
        }
        else {
            const existingHeartbeatsObject = await this.read();
            return writeHeartbeatsToIndexedDB(this.app, {
                lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
                heartbeats: heartbeatsObject.heartbeats
            });
        }
    }
    // add heartbeats
    async add(heartbeatsObject) {
        var _a;
        const canUseIndexedDB = await this._canUseIndexedDBPromise;
        if (!canUseIndexedDB) {
            return;
        }
        else {
            const existingHeartbeatsObject = await this.read();
            return writeHeartbeatsToIndexedDB(this.app, {
                lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
                heartbeats: [
                    ...existingHeartbeatsObject.heartbeats,
                    ...heartbeatsObject.heartbeats
                ]
            });
        }
    }
}
/**
 * Calculate bytes of a HeartbeatsByUserAgent array after being wrapped
 * in a platform logging header JSON object, stringified, and converted
 * to base 64.
 */
function countBytes(heartbeatsCache) {
    // base64 has a restricted set of characters, all of which should be 1 byte.
    return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache })).length;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function registerCoreComponents(variant) {
    _registerComponent(new Component('platform-logger', container => new PlatformLoggerServiceImpl(container), "PRIVATE" /* ComponentType.PRIVATE */));
    _registerComponent(new Component('heartbeat', container => new HeartbeatServiceImpl(container), "PRIVATE" /* ComponentType.PRIVATE */));
    // Register `app` package.
    registerVersion(name$o, version$1, variant);
    // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
    registerVersion(name$o, version$1, 'esm2017');
    // Register platform SDK identifier (no version).
    registerVersion('fire-js', '');
}

/**
 * Firebase App
 *
 * @remarks This package coordinates the communication between the different Firebase components
 * @packageDocumentation
 */
registerCoreComponents('');

var name = "firebase";
var version = "9.21.0";

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
registerVersion(name, version, 'cdn');

export { FirebaseError, SDK_VERSION, DEFAULT_ENTRY_NAME as _DEFAULT_ENTRY_NAME, _addComponent, _addOrOverwriteComponent, _apps, _clearComponents, _components, _getProvider, _registerComponent, _removeServiceInstance, deleteApp, getApp, getApps, initializeApp, onLog, registerVersion, setLogLevel };

//# sourceMappingURL=firebase-app.js.map





import{registerVersion as e,_registerComponent as t,_getProvider as n,getApp as a}from"https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";var i;!function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"}(i||(i={}));const r={debug:i.DEBUG,verbose:i.VERBOSE,info:i.INFO,warn:i.WARN,error:i.ERROR,silent:i.SILENT},o=i.INFO,s={[i.DEBUG]:"log",[i.VERBOSE]:"log",[i.INFO]:"info",[i.WARN]:"warn",[i.ERROR]:"error"},c=(e,t,...n)=>{if(t<e.logLevel)return;const a=(new Date).toISOString(),i=s[t];if(!i)throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`);console[i](`[${a}]  ${e.name}:`,...n)};function l(){const e="object"==typeof chrome?chrome.runtime:"object"==typeof browser?browser.runtime:void 0;return"object"==typeof e&&void 0!==e.id}function u(){try{return"object"==typeof indexedDB}catch(e){return!1}}function d(){return new Promise(((e,t)=>{try{let n=!0;const a="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(a);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(a),e(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{var e;t((null===(e=i.error)||void 0===e?void 0:e.message)||"")}}catch(e){t(e)}}))}function f(){return!("undefined"==typeof navigator||!navigator.cookieEnabled)}class p extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,p.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,h.prototype.create)}}class h{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},a=`${this.service}/${e}`,i=this.errors[e],r=i?function(e,t){return e.replace(g,((e,n)=>{const a=t[n];return null!=a?String(a):`<${n}?>`}))}(i,n):"Error",o=`${this.serviceName}: ${r} (${a}).`;return new p(a,o,n)}}const g=/\{\$([^}]+)}/g;function m(e,t){if(e===t)return!0;const n=Object.keys(e),a=Object.keys(t);for(const i of n){if(!a.includes(i))return!1;const n=e[i],r=t[i];if(w(n)&&w(r)){if(!m(n,r))return!1}else if(n!==r)return!1}for(const e of a)if(!n.includes(e))return!1;return!0}function w(e){return null!==e&&"object"==typeof e}function y(e,t=1e3,n=2){const a=t*Math.pow(n,e),i=Math.round(.5*a*(Math.random()-.5)*2);return Math.min(144e5,a+i)}function v(e){return e&&e._delegate?e._delegate:e}class I{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}let b,E;const T=new WeakMap,S=new WeakMap,D=new WeakMap,k=new WeakMap,L=new WeakMap;let j={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return S.get(e);if("objectStoreNames"===t)return e.objectStoreNames||D.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return $(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function C(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(E||(E=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(P(this),t),$(T.get(this))}:function(...t){return $(e.apply(P(this),t))}:function(t,...n){const a=e.call(P(this),t,...n);return D.set(a,t.sort?t.sort():[t]),$(a)}}function O(e){return"function"==typeof e?C(e):(e instanceof IDBTransaction&&function(e){if(S.has(e))return;const t=new Promise(((t,n)=>{const a=()=>{e.removeEventListener("complete",i),e.removeEventListener("error",r),e.removeEventListener("abort",r)},i=()=>{t(),a()},r=()=>{n(e.error||new DOMException("AbortError","AbortError")),a()};e.addEventListener("complete",i),e.addEventListener("error",r),e.addEventListener("abort",r)}));S.set(e,t)}(e),t=e,(b||(b=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some((e=>t instanceof e))?new Proxy(e,j):e);var t}function $(e){if(e instanceof IDBRequest)return function(e){const t=new Promise(((t,n)=>{const a=()=>{e.removeEventListener("success",i),e.removeEventListener("error",r)},i=()=>{t($(e.result)),a()},r=()=>{n(e.error),a()};e.addEventListener("success",i),e.addEventListener("error",r)}));return t.then((t=>{t instanceof IDBCursor&&T.set(t,e)})).catch((()=>{})),L.set(t,e),t}(e);if(k.has(e))return k.get(e);const t=O(e);return t!==e&&(k.set(e,t),L.set(t,e)),t}const P=e=>L.get(e);const _=["get","getKey","getAll","getAllKeys","count"],M=["put","add","delete","clear"],A=new Map;function B(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(A.get(t))return A.get(t);const n=t.replace(/FromIndex$/,""),a=t!==n,i=M.includes(n);if(!(n in(a?IDBIndex:IDBObjectStore).prototype)||!i&&!_.includes(n))return;const r=async function(e,...t){const r=this.transaction(e,i?"readwrite":"readonly");let o=r.store;return a&&(o=o.index(t.shift())),(await Promise.all([o[n](...t),i&&r.done]))[0]};return A.set(t,r),r}j=(e=>({...e,get:(t,n,a)=>B(t,n)||e.get(t,n,a),has:(t,n)=>!!B(t,n)||e.has(t,n)}))(j);const N="@firebase/installations",F=new h("installations","Installations",{"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."});function R(e){return e instanceof p&&e.code.includes("request-failed")}function x({projectId:e}){return`https://firebaseinstallations.googleapis.com/v1/projects/${e}/installations`}function H(e){return{token:e.token,requestStatus:2,expiresIn:(t=e.expiresIn,Number(t.replace("s","000"))),creationTime:Date.now()};var t}async function q(e,t){const n=(await t.json()).error;return F.create("request-failed",{requestName:e,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function V({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function z(e,{refreshToken:t}){const n=V(e);return n.append("Authorization",function(e){return`FIS_v2 ${e}`}(t)),n}async function U(e){const t=await e();return t.status>=500&&t.status<600?e():t}function W(e){return new Promise((t=>{setTimeout(t,e)}))}const K=/^[cdef][\w-]{21}$/;function G(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const t=function(e){return(t=e,btoa(String.fromCharCode(...t)).replace(/\+/g,"-").replace(/\//g,"_")).substr(0,22);var t}(e);return K.test(t)?t:""}catch(e){return""}}function J(e){return`${e.appName}!${e.appId}`}const Y=new Map;function Z(e,t){const n=J(e);Q(n,t),function(e,t){const n=function(){!X&&"BroadcastChannel"in self&&(X=new BroadcastChannel("[Firebase] FID Change"),X.onmessage=e=>{Q(e.data.key,e.data.fid)});return X}();n&&n.postMessage({key:e,fid:t});0===Y.size&&X&&(X.close(),X=null)}(n,t)}function Q(e,t){const n=Y.get(e);if(n)for(const e of n)e(t)}let X=null;const ee="firebase-installations-store";let te=null;function ne(){return te||(te=function(e,t,{blocked:n,upgrade:a,blocking:i,terminated:r}={}){const o=indexedDB.open(e,t),s=$(o);return a&&o.addEventListener("upgradeneeded",(e=>{a($(o.result),e.oldVersion,e.newVersion,$(o.transaction),e)})),n&&o.addEventListener("blocked",(e=>n(e.oldVersion,e.newVersion,e))),s.then((e=>{r&&e.addEventListener("close",(()=>r())),i&&e.addEventListener("versionchange",(e=>i(e.oldVersion,e.newVersion,e)))})).catch((()=>{})),s}("firebase-installations-database",1,{upgrade:(e,t)=>{if(0===t)e.createObjectStore(ee)}})),te}async function ae(e,t){const n=J(e),a=(await ne()).transaction(ee,"readwrite"),i=a.objectStore(ee),r=await i.get(n);return await i.put(t,n),await a.done,r&&r.fid===t.fid||Z(e,t.fid),t}async function ie(e){const t=J(e),n=(await ne()).transaction(ee,"readwrite");await n.objectStore(ee).delete(t),await n.done}async function re(e,t){const n=J(e),a=(await ne()).transaction(ee,"readwrite"),i=a.objectStore(ee),r=await i.get(n),o=t(r);return void 0===o?await i.delete(n):await i.put(o,n),await a.done,!o||r&&r.fid===o.fid||Z(e,o.fid),o}async function oe(e){let t;const n=await re(e.appConfig,(n=>{const a=function(e){return le(e||{fid:G(),registrationStatus:0})}(n),i=function(e,t){if(0===t.registrationStatus){if(!navigator.onLine){return{installationEntry:t,registrationPromise:Promise.reject(F.create("app-offline"))}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},a=async function(e,t){try{const n=await async function({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const a=x(e),i=V(e),r=t.getImmediate({optional:!0});if(r){const e=await r.getHeartbeatsHeader();e&&i.append("x-firebase-client",e)}const o={fid:n,authVersion:"FIS_v2",appId:e.appId,sdkVersion:"w:0.6.4"},s={method:"POST",headers:i,body:JSON.stringify(o)},c=await U((()=>fetch(a,s)));if(c.ok){const e=await c.json();return{fid:e.fid||n,registrationStatus:2,refreshToken:e.refreshToken,authToken:H(e.authToken)}}throw await q("Create Installation",c)}(e,t);return ae(e.appConfig,n)}catch(n){throw R(n)&&409===n.customData.serverCode?await ie(e.appConfig):await ae(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}(e,n);return{installationEntry:n,registrationPromise:a}}return 1===t.registrationStatus?{installationEntry:t,registrationPromise:se(e)}:{installationEntry:t}}(e,a);return t=i.registrationPromise,i.installationEntry}));return""===n.fid?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}async function se(e){let t=await ce(e.appConfig);for(;1===t.registrationStatus;)await W(100),t=await ce(e.appConfig);if(0===t.registrationStatus){const{installationEntry:t,registrationPromise:n}=await oe(e);return n||t}return t}function ce(e){return re(e,(e=>{if(!e)throw F.create("installation-not-found");return le(e)}))}function le(e){return 1===(t=e).registrationStatus&&t.registrationTime+1e4<Date.now()?{fid:e.fid,registrationStatus:0}:e;var t}async function ue({appConfig:e,heartbeatServiceProvider:t},n){const a=function(e,{fid:t}){return`${x(e)}/${t}/authTokens:generate`}(e,n),i=z(e,n),r=t.getImmediate({optional:!0});if(r){const e=await r.getHeartbeatsHeader();e&&i.append("x-firebase-client",e)}const o={installation:{sdkVersion:"w:0.6.4",appId:e.appId}},s={method:"POST",headers:i,body:JSON.stringify(o)},c=await U((()=>fetch(a,s)));if(c.ok){return H(await c.json())}throw await q("Generate Auth Token",c)}async function de(e,t=!1){let n;const a=await re(e.appConfig,(a=>{if(!pe(a))throw F.create("not-registered");const i=a.authToken;if(!t&&function(e){return 2===e.requestStatus&&!function(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+36e5}(e)}(i))return a;if(1===i.requestStatus)return n=async function(e,t){let n=await fe(e.appConfig);for(;1===n.authToken.requestStatus;)await W(100),n=await fe(e.appConfig);const a=n.authToken;return 0===a.requestStatus?de(e,t):a}(e,t),a;{if(!navigator.onLine)throw F.create("app-offline");const t=function(e){const t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}(a);return n=async function(e,t){try{const n=await ue(e,t),a=Object.assign(Object.assign({},t),{authToken:n});return await ae(e.appConfig,a),n}catch(n){if(!R(n)||401!==n.customData.serverCode&&404!==n.customData.serverCode){const n=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await ae(e.appConfig,n)}else await ie(e.appConfig);throw n}}(e,t),t}}));return n?await n:a.authToken}function fe(e){return re(e,(e=>{if(!pe(e))throw F.create("not-registered");const t=e.authToken;return 1===(n=t).requestStatus&&n.requestTime+1e4<Date.now()?Object.assign(Object.assign({},e),{authToken:{requestStatus:0}}):e;var n}))}function pe(e){return void 0!==e&&2===e.registrationStatus}async function he(e,t=!1){const n=e;await async function(e){const{registrationPromise:t}=await oe(e);t&&await t}(n);return(await de(n,t)).token}function ge(e){return F.create("missing-app-config-values",{valueName:e})}const me=e=>{const t=e.getProvider("app").getImmediate(),a=n(t,"installations").getImmediate();return{getId:()=>async function(e){const t=e,{installationEntry:n,registrationPromise:a}=await oe(t);return a?a.catch(console.error):de(t).catch(console.error),n.fid}(a),getToken:e=>he(a,e)}};t(new I("installations",(e=>{const t=e.getProvider("app").getImmediate(),a=function(e){if(!e||!e.options)throw ge("App Configuration");if(!e.name)throw ge("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw ge(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}(t);return{app:t,appConfig:a,heartbeatServiceProvider:n(t,"heartbeat"),_delete:()=>Promise.resolve()}}),"PUBLIC")),t(new I("installations-internal",me,"PRIVATE")),e(N,"0.6.4"),e(N,"0.6.4","esm2017");const we="https://www.googletagmanager.com/gtag/js",ye=new class{constructor(e){this.name=e,this._logLevel=o,this._logHandler=c,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in i))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?r[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,i.DEBUG,...e),this._logHandler(this,i.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,i.VERBOSE,...e),this._logHandler(this,i.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,i.INFO,...e),this._logHandler(this,i.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,i.WARN,...e),this._logHandler(this,i.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,i.ERROR,...e),this._logHandler(this,i.ERROR,...e)}}("@firebase/analytics"),ve=new h("analytics","Analytics",{"already-exists":"A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.","already-initialized":"initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-intialized instance.","already-initialized-settings":"Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.","interop-component-reg-failed":"Firebase Analytics Interop Component failed to instantiate: {$reason}","invalid-analytics-context":"Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","indexeddb-unavailable":"IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","fetch-throttle":"The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.","config-fetch-failed":"Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}","no-api-key":'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',"no-app-id":'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',"no-client-id":'The "client_id" field is empty.',"invalid-gtag-resource":"Trusted Types detected an invalid gtag resource: {$gtagURL}."});function Ie(e){if(!e.startsWith(we)){const t=ve.create("invalid-gtag-resource",{gtagURL:e});return ye.warn(t.message),""}return e}function be(e){return Promise.all(e.map((e=>e.catch((e=>e)))))}function Ee(e,t){const n=function(e,t){let n;return window.trustedTypes&&(n=window.trustedTypes.createPolicy(e,t)),n}("firebase-js-sdk-policy",{createScriptURL:Ie}),a=document.createElement("script"),i=`${we}?l=${e}&id=${t}`;a.src=n?null==n?void 0:n.createScriptURL(i):i,a.async=!0,document.head.appendChild(a)}function Te(e,t,n,a){return async function(i,...r){try{if("event"===i){const[a,i]=r;await async function(e,t,n,a,i){try{let r=[];if(i&&i.send_to){let e=i.send_to;Array.isArray(e)||(e=[e]);const a=await be(n);for(const n of e){const e=a.find((e=>e.measurementId===n)),i=e&&t[e.appId];if(!i){r=[];break}r.push(i)}}0===r.length&&(r=Object.values(t)),await Promise.all(r),e("event",a,i||{})}catch(e){ye.error(e)}}(e,t,n,a,i)}else if("config"===i){const[i,o]=r;await async function(e,t,n,a,i,r){const o=a[i];try{if(o)await t[o];else{const e=(await be(n)).find((e=>e.measurementId===i));e&&await t[e.appId]}}catch(e){ye.error(e)}e("config",i,r)}(e,t,n,a,i,o)}else if("consent"===i){const[t]=r;e("consent","update",t)}else if("get"===i){const[t,n,a]=r;e("get",t,n,a)}else if("set"===i){const[t]=r;e("set",t)}else e(i,...r)}catch(e){ye.error(e)}}}const Se=new class{constructor(e={},t=1e3){this.throttleMetadata=e,this.intervalMillis=t}getThrottleMetadata(e){return this.throttleMetadata[e]}setThrottleMetadata(e,t){this.throttleMetadata[e]=t}deleteThrottleMetadata(e){delete this.throttleMetadata[e]}};function De(e){return new Headers({Accept:"application/json","x-goog-api-key":e})}async function ke(e,t=Se,n){const{appId:a,apiKey:i,measurementId:r}=e.options;if(!a)throw ve.create("no-app-id");if(!i){if(r)return{measurementId:r,appId:a};throw ve.create("no-api-key")}const o=t.getThrottleMetadata(a)||{backoffCount:0,throttleEndTimeMillis:Date.now()},s=new je;return setTimeout((async()=>{s.abort()}),void 0!==n?n:6e4),Le({appId:a,apiKey:i,measurementId:r},o,s,t)}async function Le(e,{throttleEndTimeMillis:t,backoffCount:n},a,i=Se){var r;const{appId:o,measurementId:s}=e;try{await function(e,t){return new Promise(((n,a)=>{const i=Math.max(t-Date.now(),0),r=setTimeout(n,i);e.addEventListener((()=>{clearTimeout(r),a(ve.create("fetch-throttle",{throttleEndTimeMillis:t}))}))}))}(a,t)}catch(e){if(s)return ye.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${s} provided in the "measurementId" field in the local Firebase config. [${null==e?void 0:e.message}]`),{appId:o,measurementId:s};throw e}try{const t=await async function(e){var t;const{appId:n,apiKey:a}=e,i={method:"GET",headers:De(a)},r="https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig".replace("{app-id}",n),o=await fetch(r,i);if(200!==o.status&&304!==o.status){let e="";try{const n=await o.json();(null===(t=n.error)||void 0===t?void 0:t.message)&&(e=n.error.message)}catch(e){}throw ve.create("config-fetch-failed",{httpStatus:o.status,responseMessage:e})}return o.json()}(e);return i.deleteThrottleMetadata(o),t}catch(t){const c=t;if(!function(e){if(!(e instanceof p&&e.customData))return!1;const t=Number(e.customData.httpStatus);return 429===t||500===t||503===t||504===t}(c)){if(i.deleteThrottleMetadata(o),s)return ye.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${s} provided in the "measurementId" field in the local Firebase config. [${null==c?void 0:c.message}]`),{appId:o,measurementId:s};throw t}const l=503===Number(null===(r=null==c?void 0:c.customData)||void 0===r?void 0:r.httpStatus)?y(n,i.intervalMillis,30):y(n,i.intervalMillis),u={throttleEndTimeMillis:Date.now()+l,backoffCount:n+1};return i.setThrottleMetadata(o,u),ye.debug(`Calling attemptFetch again in ${l} millis`),Le(e,u,a,i)}}class je{constructor(){this.listeners=[]}addEventListener(e){this.listeners.push(e)}abort(){this.listeners.forEach((e=>e()))}}let Ce,Oe;function $e(e){Oe=e}function Pe(e){Ce=e}async function _e(e,t,n,a,i,r,o){var s;const c=ke(e);c.then((t=>{n[t.measurementId]=t.appId,e.options.measurementId&&t.measurementId!==e.options.measurementId&&ye.warn(`The measurement ID in the local Firebase config (${e.options.measurementId}) does not match the measurement ID fetched from the server (${t.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)})).catch((e=>ye.error(e))),t.push(c);const l=async function(){if(!u())return ye.warn(ve.create("indexeddb-unavailable",{errorInfo:"IndexedDB is not available in this environment."}).message),!1;try{await d()}catch(e){return ye.warn(ve.create("indexeddb-unavailable",{errorInfo:null==e?void 0:e.toString()}).message),!1}return!0}().then((e=>e?a.getId():void 0)),[f,p]=await Promise.all([c,l]);(function(e){const t=window.document.getElementsByTagName("script");for(const n of Object.values(t))if(n.src&&n.src.includes(we)&&n.src.includes(e))return n;return null})(r)||Ee(r,f.measurementId),Oe&&(i("consent","default",Oe),$e(void 0)),i("js",new Date);const h=null!==(s=null==o?void 0:o.config)&&void 0!==s?s:{};return h.origin="firebase",h.update=!0,null!=p&&(h.firebase_id=p),i("config",f.measurementId,h),Ce&&(i("set",Ce),Pe(void 0)),f.measurementId}class Me{constructor(e){this.app=e}_delete(){return delete Ae[this.app.options.appId],Promise.resolve()}}let Ae={},Be=[];const Ne={};let Fe,Re,xe="dataLayer",He="gtag",qe=!1;function Ve(e){if(qe)throw ve.create("already-initialized");e.dataLayerName&&(xe=e.dataLayerName),e.gtagName&&(He=e.gtagName)}function ze(e,t,n){!function(){const e=[];if(l()&&e.push("This is a browser extension environment."),f()||e.push("Cookies are not available."),e.length>0){const t=e.map(((e,t)=>`(${t+1}) ${e}`)).join(" "),n=ve.create("invalid-analytics-context",{errorInfo:t});ye.warn(n.message)}}();const a=e.options.appId;if(!a)throw ve.create("no-app-id");if(!e.options.apiKey){if(!e.options.measurementId)throw ve.create("no-api-key");ye.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${e.options.measurementId} provided in the "measurementId" field in the local Firebase config.`)}if(null!=Ae[a])throw ve.create("already-exists",{id:a});if(!qe){!function(e){let t=[];Array.isArray(window[e])?t=window[e]:window[e]=t}(xe);const{wrappedGtag:e,gtagCore:t}=function(e,t,n,a,i){let r=function(...e){window[a].push(arguments)};return window[i]&&"function"==typeof window[i]&&(r=window[i]),window[i]=Te(r,e,t,n),{gtagCore:r,wrappedGtag:window[i]}}(Ae,Be,Ne,xe,He);Re=e,Fe=t,qe=!0}Ae[a]=_e(e,Be,Ne,t,Fe,xe,n);return new Me(e)}function Ue(e=a()){e=v(e);const t=n(e,"analytics");return t.isInitialized()?t.getImmediate():We(e)}function We(e,t={}){const a=n(e,"analytics");if(a.isInitialized()){const e=a.getImmediate();if(m(t,a.getOptions()))return e;throw ve.create("already-initialized")}return a.initialize({options:t})}async function Ke(){if(l())return!1;if(!f())return!1;if(!u())return!1;try{return await d()}catch(e){return!1}}function Ge(e,t,n){e=v(e),async function(e,t,n,a){if(a&&a.global)return e("set",{screen_name:n}),Promise.resolve();e("config",await t,{update:!0,screen_name:n})}(Re,Ae[e.app.options.appId],t,n).catch((e=>ye.error(e)))}async function Je(e){return e=v(e),async function(e,t){const n=await t;return new Promise(((t,a)=>{e("get",n,"client_id",(e=>{e||a(ve.create("no-client-id")),t(e)}))}))}(Re,Ae[e.app.options.appId])}function Ye(e,t,n){e=v(e),async function(e,t,n,a){if(a&&a.global)return e("set",{user_id:n}),Promise.resolve();e("config",await t,{update:!0,user_id:n})}(Re,Ae[e.app.options.appId],t,n).catch((e=>ye.error(e)))}function Ze(e,t,n){e=v(e),async function(e,t,n,a){if(a&&a.global){const t={};for(const e of Object.keys(n))t[`user_properties.${e}`]=n[e];return e("set",t),Promise.resolve()}e("config",await t,{update:!0,user_properties:n})}(Re,Ae[e.app.options.appId],t,n).catch((e=>ye.error(e)))}function Qe(e,t){e=v(e),async function(e,t){const n=await e;window[`ga-disable-${n}`]=!t}(Ae[e.app.options.appId],t).catch((e=>ye.error(e)))}function Xe(e){Re?Re("set",e):Pe(e)}function et(e,t,n,a){e=v(e),async function(e,t,n,a,i){if(i&&i.global)e("event",n,a);else{const i=await t;e("event",n,Object.assign(Object.assign({},a),{send_to:i}))}}(Re,Ae[e.app.options.appId],t,n,a).catch((e=>ye.error(e)))}function tt(e){Re?Re("consent","update",e):$e(e)}const nt="@firebase/analytics";t(new I("analytics",((e,{options:t})=>ze(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),t)),"PUBLIC")),t(new I("analytics-internal",(function(e){try{const t=e.getProvider("analytics").getImmediate();return{logEvent:(e,n,a)=>et(t,e,n,a)}}catch(e){throw ve.create("interop-component-reg-failed",{reason:e})}}),"PRIVATE")),e(nt,"0.10.0"),e(nt,"0.10.0","esm2017");export{Ue as getAnalytics,Je as getGoogleAnalyticsClientId,We as initializeAnalytics,Ke as isSupported,et as logEvent,Qe as setAnalyticsCollectionEnabled,tt as setConsent,Ge as setCurrentScreen,Xe as setDefaultEventParameters,Ye as setUserId,Ze as setUserProperties,Ve as settings};

//# sourceMappingURL=firebase-analytics.js.map





!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(require("@firebase/app")):"function"==typeof define&&define.amd?define(["@firebase/app"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).firebase)}(this,function(ca){"use strict";try{!function(){function e(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var t=e(ca),r=function(e,t){return(r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(e,t)};function n(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");function n(){this.constructor=e}r(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}var l=function(){return(l=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var i in t=arguments[n])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e}).apply(this,arguments)};function i(e,s,a,u){return new(a=a||Promise)(function(n,t){function r(e){try{o(u.next(e))}catch(e){t(e)}}function i(e){try{o(u.throw(e))}catch(e){t(e)}}function o(e){var t;e.done?n(e.value):((t=e.value)instanceof a?t:new a(function(e){e(t)})).then(r,i)}o((u=u.apply(e,s||[])).next())})}function o(n,r){var i,o,s,a={label:0,sent:function(){if(1&s[0])throw s[1];return s[1]},trys:[],ops:[]},e={next:t(0),throw:t(1),return:t(2)};return"function"==typeof Symbol&&(e[Symbol.iterator]=function(){return this}),e;function t(t){return function(e){return function(t){if(i)throw new TypeError("Generator is already executing.");for(;a;)try{if(i=1,o&&(s=2&t[0]?o.return:t[0]?o.throw||((s=o.return)&&s.call(o),0):o.next)&&!(s=s.call(o,t[1])).done)return s;switch(o=0,(t=s?[2&t[0],s.value]:t)[0]){case 0:case 1:s=t;break;case 4:return a.label++,{value:t[1],done:!1};case 5:a.label++,o=t[1],t=[0];continue;case 7:t=a.ops.pop(),a.trys.pop();continue;default:if(!(s=0<(s=a.trys).length&&s[s.length-1])&&(6===t[0]||2===t[0])){a=0;continue}if(3===t[0]&&(!s||t[1]>s[0]&&t[1]<s[3])){a.label=t[1];break}if(6===t[0]&&a.label<s[1]){a.label=s[1],s=t;break}if(s&&a.label<s[2]){a.label=s[2],a.ops.push(t);break}s[2]&&a.ops.pop(),a.trys.pop();continue}t=r.call(n,a)}catch(e){t=[6,e],o=0}finally{i=s=0}if(5&t[0])throw t[1];return{value:t[0]?t[1]:void 0,done:!0}}([t,e])}}}function _(e){var t="function"==typeof Symbol&&Symbol.iterator,n=t&&e[t],r=0;if(n)return n.call(e);if(e&&"number"==typeof e.length)return{next:function(){return{value:(e=e&&r>=e.length?void 0:e)&&e[r++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")}function y(e,t){var n="function"==typeof Symbol&&e[Symbol.iterator];if(!n)return e;var r,i,o=n.call(e),s=[];try{for(;(void 0===t||0<t--)&&!(r=o.next()).done;)s.push(r.value)}catch(e){i={error:e}}finally{try{r&&!r.done&&(n=o.return)&&n.call(o)}finally{if(i)throw i.error}}return s}function s(e,t){for(var n=0,r=t.length,i=e.length;n<r;n++,i++)e[i]=t[n];return e}function a(e){for(var t=[],n=0,r=0;r<e.length;r++){var i=e.charCodeAt(r);i<128?t[n++]=i:(i<2048?t[n++]=i>>6|192:(55296==(64512&i)&&r+1<e.length&&56320==(64512&e.charCodeAt(r+1))?(i=65536+((1023&i)<<10)+(1023&e.charCodeAt(++r)),t[n++]=i>>18|240,t[n++]=i>>12&63|128):t[n++]=i>>12|224,t[n++]=i>>6&63|128),t[n++]=63&i|128)}return t}function u(e){try{return c.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null}var h={NODE_CLIENT:!1,NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"},g=function(e,t){if(!e)throw m(t)},m=function(e){return new Error("Firebase Database ("+h.SDK_VERSION+") INTERNAL ASSERT FAILED: "+e)},c={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray:function(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();for(var n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[],i=0;i<e.length;i+=3){var o=e[i],s=i+1<e.length,a=s?e[i+1]:0,u=i+2<e.length,l=u?e[i+2]:0,h=o>>2,o=(3&o)<<4|a>>4,a=(15&a)<<2|l>>6,l=63&l;u||(l=64,s||(a=64)),r.push(n[h],n[o],n[a],n[l])}return r.join("")},encodeString:function(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(a(e),t)},decodeString:function(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):function(e){for(var t=[],n=0,r=0;n<e.length;){var i,o,s,a=e[n++];a<128?t[r++]=String.fromCharCode(a):191<a&&a<224?(o=e[n++],t[r++]=String.fromCharCode((31&a)<<6|63&o)):239<a&&a<365?(i=((7&a)<<18|(63&(o=e[n++]))<<12|(63&(s=e[n++]))<<6|63&e[n++])-65536,t[r++]=String.fromCharCode(55296+(i>>10)),t[r++]=String.fromCharCode(56320+(1023&i))):(o=e[n++],s=e[n++],t[r++]=String.fromCharCode((15&a)<<12|(63&o)<<6|63&s))}return t.join("")}(this.decodeStringToByteArray(e,t))},decodeStringToByteArray:function(e,t){this.init_();for(var n=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[],i=0;i<e.length;){var o=n[e.charAt(i++)],s=i<e.length?n[e.charAt(i)]:0,a=++i<e.length?n[e.charAt(i)]:64,u=++i<e.length?n[e.charAt(i)]:64;if(++i,null==o||null==s||null==a||null==u)throw Error();o=o<<2|s>>4;r.push(o),64!==a&&(s=s<<4&240|a>>2,r.push(s),64!==u&&(u=a<<6&192|u,r.push(u)))}return r},init_:function(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(var e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),(this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e)>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};function d(e){return function e(t,n){if(!(n instanceof Object))return n;switch(n.constructor){case Date:var r=n;return new Date(r.getTime());case Object:void 0===t&&(t={});break;case Array:t=[];break;default:return n}for(var i in n)n.hasOwnProperty(i)&&p(i)&&(t[i]=e(t[i],n[i]));return t}(void 0,e)}function p(e){return"__proto__"!==e}var f=(v.prototype.wrapCallback=function(n){var r=this;return function(e,t){e?r.reject(e):r.resolve(t),"function"==typeof n&&(r.promise.catch(function(){}),1===n.length?n(e):n(e,t))}},v);function v(){var n=this;this.reject=function(){},this.resolve=function(){},this.promise=new Promise(function(e,t){n.resolve=e,n.reject=t})}function w(){return"undefined"!=typeof window&&(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test("undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:"")}function C(){return!0===h.NODE_ADMIN}var b,E="FirebaseError",S=(n(T,b=Error),T);function T(e,t,n){t=b.call(this,t)||this;return t.code=e,t.customData=n,t.name=E,Object.setPrototypeOf(t,T.prototype),Error.captureStackTrace&&Error.captureStackTrace(t,I.prototype.create),t}var I=(P.prototype.create=function(e){for(var t=[],n=1;n<arguments.length;n++)t[n-1]=arguments[n];var r,i=t[0]||{},o=this.service+"/"+e,e=this.errors[e],e=e?(r=i,e.replace(N,function(e,t){var n=r[t];return null!=n?String(n):"<"+t+"?>"})):"Error",e=this.serviceName+": "+e+" ("+o+").";return new S(o,e,i)},P);function P(e,t,n){this.service=e,this.serviceName=t,this.errors=n}var N=/\{\$([^}]+)}/g;function R(e){return JSON.parse(e)}function x(e){return JSON.stringify(e)}function k(e){var t={},n={},r={},i="";try{var o=e.split("."),t=R(u(o[0])||""),n=R(u(o[1])||""),i=o[2],r=n.d||{};delete n.d}catch(e){}return{header:t,claims:n,data:r,signature:i}}function D(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function O(e,t){if(Object.prototype.hasOwnProperty.call(e,t))return e[t]}function A(e){for(var t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function L(e,t,n){var r,i={};for(r in e)Object.prototype.hasOwnProperty.call(e,r)&&(i[r]=t.call(n,e[r],r,e));return i}function M(e){for(var n=[],t=0,r=Object.entries(e);t<r.length;t++){var i=r[t];!function(t,e){Array.isArray(e)?e.forEach(function(e){n.push(encodeURIComponent(t)+"="+encodeURIComponent(e))}):n.push(encodeURIComponent(t)+"="+encodeURIComponent(e))}(i[0],i[1])}return n.length?"&"+n.join("&"):""}var F=(q.prototype.reset=function(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0},q.prototype.compress_=function(e,t){t=t||0;var n=this.W_;if("string"==typeof e)for(var r=0;r<16;r++)n[r]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(r=0;r<16;r++)n[r]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(r=16;r<80;r++){var i=n[r-3]^n[r-8]^n[r-14]^n[r-16];n[r]=4294967295&(i<<1|i>>>31)}for(var o,s=this.chain_[0],a=this.chain_[1],u=this.chain_[2],l=this.chain_[3],h=this.chain_[4],r=0;r<80;r++)var c=r<40?r<20?(o=l^a&(u^l),1518500249):(o=a^u^l,1859775393):r<60?(o=a&u|l&(a|u),2400959708):(o=a^u^l,3395469782),i=(s<<5|s>>>27)+o+h+c+n[r]&4294967295,h=l,l=u,u=4294967295&(a<<30|a>>>2),a=s,s=i;this.chain_[0]=this.chain_[0]+s&4294967295,this.chain_[1]=this.chain_[1]+a&4294967295,this.chain_[2]=this.chain_[2]+u&4294967295,this.chain_[3]=this.chain_[3]+l&4294967295,this.chain_[4]=this.chain_[4]+h&4294967295},q.prototype.update=function(e,t){if(null!=e){for(var n=(t=void 0===t?e.length:t)-this.blockSize,r=0,i=this.buf_,o=this.inbuf_;r<t;){if(0===o)for(;r<=n;)this.compress_(e,r),r+=this.blockSize;if("string"==typeof e){for(;r<t;)if(i[o]=e.charCodeAt(r),++r,++o===this.blockSize){this.compress_(i),o=0;break}}else for(;r<t;)if(i[o]=e[r],++r,++o===this.blockSize){this.compress_(i),o=0;break}}this.inbuf_=o,this.total_+=t}},q.prototype.digest=function(){var e=[],t=8*this.total_;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(var n=this.blockSize-1;56<=n;n--)this.buf_[n]=255&t,t/=256;this.compress_(this.buf_);for(var r=0,n=0;n<5;n++)for(var i=24;0<=i;i-=8)e[r]=this.chain_[n]>>i&255,++r;return e},q);function q(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=64,this.pad_[0]=128;for(var e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}function W(e,t,n,r){var i;if(r<t?i="at least "+t:n<r&&(i=0===n?"none":"no more than "+n),i)throw new Error(e+" failed: Was called with "+r+(1===r?" argument.":" arguments.")+" Expects "+i+".")}function Q(e,t,n){var r="";switch(t){case 1:r=n?"first":"First";break;case 2:r=n?"second":"Second";break;case 3:r=n?"third":"Third";break;case 4:r=n?"fourth":"Fourth";break;default:throw new Error("errorPrefix called with argumentNumber > 4.  Need to update it?")}e+=" failed: ";return e+=r+" argument "}function j(e,t,n,r){if((!r||n)&&"function"!=typeof n)throw new Error(Q(e,t,r)+"must be a valid function.")}function U(e,t,n,r){if((!r||n)&&("object"!=typeof n||null===n))throw new Error(Q(e,t,r)+"must be a valid context object.")}function B(e){for(var t=0,n=0;n<e.length;n++){var r=e.charCodeAt(n);r<128?t++:r<2048?t+=2:55296<=r&&r<=56319?(t+=4,n++):t+=3}return t}var H;(G=H=H||{})[G.DEBUG=0]="DEBUG",G[G.VERBOSE=1]="VERBOSE",G[G.INFO=2]="INFO",G[G.WARN=3]="WARN",G[G.ERROR=4]="ERROR",G[G.SILENT=5]="SILENT";function V(e,t){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];if(!(t<e.logLevel)){var i=(new Date).toISOString(),o=Y[t];if(!o)throw new Error("Attempted to log a message with an invalid logType (value: "+t+")");console[o].apply(console,s(["["+i+"]  "+e.name+":"],n))}}var z={debug:H.DEBUG,verbose:H.VERBOSE,info:H.INFO,warn:H.WARN,error:H.ERROR,silent:H.SILENT},K=H.INFO,Y=((ye={})[H.DEBUG]="log",ye[H.VERBOSE]="log",ye[H.INFO]="info",ye[H.WARN]="warn",ye[H.ERROR]="error",ye),G=(Object.defineProperty($.prototype,"logLevel",{get:function(){return this._logLevel},set:function(e){if(!(e in H))throw new TypeError('Invalid value "'+e+'" assigned to `logLevel`');this._logLevel=e},enumerable:!1,configurable:!0}),$.prototype.setLogLevel=function(e){this._logLevel="string"==typeof e?z[e]:e},Object.defineProperty($.prototype,"logHandler",{get:function(){return this._logHandler},set:function(e){if("function"!=typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e},enumerable:!1,configurable:!0}),Object.defineProperty($.prototype,"userLogHandler",{get:function(){return this._userLogHandler},set:function(e){this._userLogHandler=e},enumerable:!1,configurable:!0}),$.prototype.debug=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];this._userLogHandler&&this._userLogHandler.apply(this,s([this,H.DEBUG],e)),this._logHandler.apply(this,s([this,H.DEBUG],e))},$.prototype.log=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];this._userLogHandler&&this._userLogHandler.apply(this,s([this,H.VERBOSE],e)),this._logHandler.apply(this,s([this,H.VERBOSE],e))},$.prototype.info=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];this._userLogHandler&&this._userLogHandler.apply(this,s([this,H.INFO],e)),this._logHandler.apply(this,s([this,H.INFO],e))},$.prototype.warn=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];this._userLogHandler&&this._userLogHandler.apply(this,s([this,H.WARN],e)),this._logHandler.apply(this,s([this,H.WARN],e))},$.prototype.error=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];this._userLogHandler&&this._userLogHandler.apply(this,s([this,H.ERROR],e)),this._logHandler.apply(this,s([this,H.ERROR],e))},$);function $(e){this.name=e,this._logLevel=K,this._logHandler=V,this._userLogHandler=null}var J=(X.prototype.setInstantiationMode=function(e){return this.instantiationMode=e,this},X.prototype.setMultipleInstances=function(e){return this.multipleInstances=e,this},X.prototype.setServiceProps=function(e){return this.serviceProps=e,this},X);function X(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY"}var Z="[DEFAULT]",ee=(te.prototype.get=function(e){void 0===e&&(e=Z);var t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){var n=new f;this.instancesDeferred.set(t,n);try{var r=this.getOrInitializeService({instanceIdentifier:t});r&&n.resolve(r)}catch(e){}}return this.instancesDeferred.get(t).promise},te.prototype.getImmediate=function(e){var t=l({identifier:Z,optional:!1},e),e=t.identifier,n=t.optional,r=this.normalizeInstanceIdentifier(e);try{var i=this.getOrInitializeService({instanceIdentifier:r});if(i)return i;if(n)return null;throw Error("Service "+this.name+" is not available")}catch(e){if(n)return null;throw e}},te.prototype.getComponent=function(){return this.component},te.prototype.setComponent=function(e){var t,n;if(e.name!==this.name)throw Error("Mismatching Component "+e.name+" for Provider "+this.name+".");if(this.component)throw Error("Component for "+this.name+" has already been provided");if("EAGER"===(this.component=e).instantiationMode)try{this.getOrInitializeService({instanceIdentifier:Z})}catch(e){}try{for(var r=_(this.instancesDeferred.entries()),i=r.next();!i.done;i=r.next()){var o=y(i.value,2),s=o[0],a=o[1],u=this.normalizeInstanceIdentifier(s);try{var l=this.getOrInitializeService({instanceIdentifier:u});a.resolve(l)}catch(e){}}}catch(e){t={error:e}}finally{try{i&&!i.done&&(n=r.return)&&n.call(r)}finally{if(t)throw t.error}}},te.prototype.clearInstance=function(e){void 0===e&&(e=Z),this.instancesDeferred.delete(e),this.instances.delete(e)},te.prototype.delete=function(){return i(this,void 0,void 0,function(){var t;return o(this,function(e){switch(e.label){case 0:return t=Array.from(this.instances.values()),[4,Promise.all(s(s([],y(t.filter(function(e){return"INTERNAL"in e}).map(function(e){return e.INTERNAL.delete()}))),y(t.filter(function(e){return"_delete"in e}).map(function(e){return e._delete()}))))];case 1:return e.sent(),[2]}})})},te.prototype.isComponentSet=function(){return null!=this.component},te.prototype.isInitialized=function(e){return void 0===e&&(e=Z),this.instances.has(e)},te.prototype.initialize=function(e){var t=(e=void 0===e?{}:e).instanceIdentifier,t=void 0===t?Z:t,e=e.options,e=void 0===e?{}:e,t=this.normalizeInstanceIdentifier(t);if(this.isInitialized(t))throw Error(this.name+"("+t+") has already been initialized");if(!this.isComponentSet())throw Error("Component "+this.name+" has not been registered yet");return this.getOrInitializeService({instanceIdentifier:t,options:e})},te.prototype.getOrInitializeService=function(e){var t=e.instanceIdentifier,n=e.options,r=void 0===n?{}:n,e=this.instances.get(t);return!e&&this.component&&(e=this.component.instanceFactory(this.container,{instanceIdentifier:(n=t)===Z?void 0:n,options:r}),this.instances.set(t,e)),e||null},te.prototype.normalizeInstanceIdentifier=function(e){return!this.component||this.component.multipleInstances?e:Z},te);function te(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map}var ne=(re.prototype.addComponent=function(e){var t=this.getProvider(e.name);if(t.isComponentSet())throw new Error("Component "+e.name+" has already been registered with "+this.name);t.setComponent(e)},re.prototype.addOrOverwriteComponent=function(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)},re.prototype.getProvider=function(e){if(this.providers.has(e))return this.providers.get(e);var t=new ee(e,this);return this.providers.set(e,t),t},re.prototype.getProviders=function(){return Array.from(this.providers.values())},re);function re(e){this.name=e,this.providers=new Map}var ie=(oe.prototype.set=function(e,t){null==t?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),x(t))},oe.prototype.get=function(e){e=this.domStorage_.getItem(this.prefixedName_(e));return null==e?null:R(e)},oe.prototype.remove=function(e){this.domStorage_.removeItem(this.prefixedName_(e))},oe.prototype.prefixedName_=function(e){return this.prefix_+e},oe.prototype.toString=function(){return this.domStorage_.toString()},oe);function oe(e){this.domStorage_=e,this.prefix_="firebase:"}var se=(ae.prototype.set=function(e,t){null==t?delete this.cache_[e]:this.cache_[e]=t},ae.prototype.get=function(e){return D(this.cache_,e)?this.cache_[e]:null},ae.prototype.remove=function(e){delete this.cache_[e]},ae);function ae(){this.cache_={},this.isInMemoryStorage=!0}function ue(e){var t=function(e){for(var t=[],n=0,r=0;r<e.length;r++){var i,o=e.charCodeAt(r);55296<=o&&o<=56319&&(i=o-55296,g(++r<e.length,"Surrogate pair missing trail surrogate."),o=65536+(i<<10)+(e.charCodeAt(r)-56320)),o<128?t[n++]=o:(o<2048?t[n++]=o>>6|192:(o<65536?t[n++]=o>>12|224:(t[n++]=o>>18|240,t[n++]=o>>12&63|128),t[n++]=o>>6&63|128),t[n++]=63&o|128)}return t}(e);return(e=new F).update(t),e=e.digest(),c.encodeByteArray(e)}function le(e,t){g(!t||!0===e||!1===e,"Can't turn on custom loggers persistently."),!0===e?(me.logLevel=H.VERBOSE,be=me.log.bind(me),t&&ge.set("logging_enabled",!0)):"function"==typeof e?be=e:(be=null,ge.remove("logging_enabled"))}function he(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n="FIREBASE INTERNAL ERROR: "+Ce.apply(void 0,s([],y(e)));me.error(n)}function ce(e){return"number"==typeof e&&(e!=e||e===Number.POSITIVE_INFINITY||e===Number.NEGATIVE_INFINITY)}function de(e,t){return e===t?0:e<t?-1:1}function pe(e,t){if(t&&e in t)return t[e];throw new Error("Missing required key ("+e+") in object: "+x(t))}function fe(e,t){var n=e.length;if(n<=t)return[e];for(var r=[],i=0;i<n;i+=t)n<i+t?r.push(e.substring(i,n)):r.push(e.substring(i,i+t));return r}var _e,ye=function(e){try{if("undefined"!=typeof window&&void 0!==window[e]){var t=window[e];return t.setItem("firebase:sentinel","cache"),t.removeItem("firebase:sentinel"),new ie(t)}}catch(e){}return new se},ve=ye("localStorage"),ge=ye("sessionStorage"),me=new G("@firebase/database"),we=(_e=1,function(){return _e++}),Ce=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];for(var n="",r=0;r<e.length;r++){var i=e[r];Array.isArray(i)||i&&"object"==typeof i&&"number"==typeof i.length?n+=Ce.apply(null,i):n+="object"==typeof i?x(i):i,n+=" "}return n},be=null,Ee=!0,Se=function(){for(var e,t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];!0===Ee&&(Ee=!1,null===be&&!0===ge.get("logging_enabled")&&le(!0)),be&&(e=Ce.apply(null,t),be(e))},Te=function(n){return function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];Se.apply(void 0,s([n],y(e)))}},Ie=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n="FIREBASE FATAL ERROR: "+Ce.apply(void 0,s([],y(e)));throw me.error(n),new Error(n)},Pe=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n="FIREBASE WARNING: "+Ce.apply(void 0,s([],y(e)));me.warn(n)},Ne="[MIN_NAME]",Re="[MAX_NAME]",xe=function(e,t){if(e===t)return 0;if(e===Ne||t===Re)return-1;if(t===Ne||e===Re)return 1;var n=We(e),r=We(t);return null!==n?null!==r?n-r==0?e.length-t.length:n-r:-1:null===r&&e<t?-1:1},ke=function(e){if("object"!=typeof e||null===e)return x(e);var t,n=[];for(t in e)n.push(t);n.sort();for(var r="{",i=0;i<n.length;i++)0!==i&&(r+=","),r+=x(n[i]),r+=":",r+=ke(e[n[i]]);return r+="}"};function De(e,t){for(var n in e)e.hasOwnProperty(n)&&t(n,e[n])}function Oe(e){var t,n,r,i;g(!ce(e),"Invalid JSON number"),0===e?t=1/e==-1/(r=n=0)?1:0:(t=e<0,r=(e=Math.abs(e))>=Math.pow(2,-1022)?(n=(i=Math.min(Math.floor(Math.log(e)/Math.LN2),1023))+1023,Math.round(e*Math.pow(2,52-i)-Math.pow(2,52))):(n=0,Math.round(e/Math.pow(2,-1074))));for(var o=[],s=52;s;--s)o.push(r%2?1:0),r=Math.floor(r/2);for(s=11;s;--s)o.push(n%2?1:0),n=Math.floor(n/2);o.push(t?1:0),o.reverse();var a=o.join(""),u="";for(s=0;s<64;s+=8){var l=parseInt(a.substr(s,8),2).toString(16);u+=l=1===l.length?"0"+l:l}return u.toLowerCase()}function Ae(e,t){return"object"==typeof(t=setTimeout(e,t))&&t.unref&&t.unref(),t}var Le=function(e,t){var n="Unknown Error";"too_big"===e?n="The data requested exceeds the maximum size that can be accessed with a single request.":"permission_denied"===e?n="Client doesn't have permission to access the desired data.":"unavailable"===e&&(n="The service is unavailable");n=new Error(e+" at "+t.path.toString()+": "+n);return n.code=e.toUpperCase(),n},Me=new RegExp("^-?(0*)\\d{1,10}$"),Fe=-2147483648,qe=2147483647,We=function(e){if(Me.test(e)){e=Number(e);if(Fe<=e&&e<=qe)return e}return null},Qe=function(e){try{e()}catch(t){setTimeout(function(){var e=t.stack||"";throw Pe("Exception was thrown by user callback.",e),t},Math.floor(0))}},je=32,Ue=768,Be=(He.prototype.toString=function(){for(var e="",t=this.pieceNum_;t<this.pieces_.length;t++)""!==this.pieces_[t]&&(e+="/"+this.pieces_[t]);return e||"/"},He);function He(e,t){if(void 0===t){this.pieces_=e.split("/");for(var n=0,r=0;r<this.pieces_.length;r++)0<this.pieces_[r].length&&(this.pieces_[n]=this.pieces_[r],n++);this.pieces_.length=n,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}function Ve(){return new Be("")}function ze(e){return e.pieceNum_>=e.pieces_.length?null:e.pieces_[e.pieceNum_]}function Ke(e){return e.pieces_.length-e.pieceNum_}function Ye(e){var t=e.pieceNum_;return t<e.pieces_.length&&t++,new Be(e.pieces_,t)}function Ge(e){return e.pieceNum_<e.pieces_.length?e.pieces_[e.pieces_.length-1]:null}function $e(e,t){return void 0===t&&(t=0),e.pieces_.slice(e.pieceNum_+t)}function Je(e){if(e.pieceNum_>=e.pieces_.length)return null;for(var t=[],n=e.pieceNum_;n<e.pieces_.length-1;n++)t.push(e.pieces_[n]);return new Be(t,0)}function Xe(e,t){for(var n=[],r=e.pieceNum_;r<e.pieces_.length;r++)n.push(e.pieces_[r]);if(t instanceof Be)for(r=t.pieceNum_;r<t.pieces_.length;r++)n.push(t.pieces_[r]);else for(var i=t.split("/"),r=0;r<i.length;r++)0<i[r].length&&n.push(i[r]);return new Be(n,0)}function Ze(e){return e.pieceNum_>=e.pieces_.length}function et(e,t){var n=ze(e),r=ze(t);if(null===n)return t;if(n===r)return et(Ye(e),Ye(t));throw new Error("INTERNAL ERROR: innerPath ("+t+") is not within outerPath ("+e+")")}function tt(e,t){for(var n=$e(e,0),r=$e(t,0),i=0;i<n.length&&i<r.length;i++){var o=xe(n[i],r[i]);if(0!==o)return o}return n.length===r.length?0:n.length<r.length?-1:1}function nt(e,t){if(Ke(e)!==Ke(t))return!1;for(var n=e.pieceNum_,r=t.pieceNum_;n<=e.pieces_.length;n++,r++)if(e.pieces_[n]!==t.pieces_[r])return!1;return!0}function rt(e,t){var n=e.pieceNum_,r=t.pieceNum_;if(Ke(e)>Ke(t))return!1;for(;n<e.pieces_.length;){if(e.pieces_[n]!==t.pieces_[r])return!1;++n,++r}return!0}var it=function(e,t){this.errorPrefix_=t,this.parts_=$e(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(var n=0;n<this.parts_.length;n++)this.byteLength_+=B(this.parts_[n]);ot(this)};function ot(e){if(e.byteLength_>Ue)throw new Error(e.errorPrefix_+"has a key path longer than "+Ue+" bytes ("+e.byteLength_+").");if(e.parts_.length>je)throw new Error(e.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+je+") or object contains a cycle "+st(e))}function st(e){return 0===e.parts_.length?"":"in property '"+e.parts_.join(".")+"'"}var at=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,ut="websocket",lt="long_polling",ht=(ct.prototype.isCacheableHost=function(){return"s-"===this.internalHost.substr(0,2)},ct.prototype.isCustomHost=function(){return"firebaseio.com"!==this._domain&&"firebaseio-demo.com"!==this._domain},Object.defineProperty(ct.prototype,"host",{get:function(){return this._host},set:function(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&ve.set("host:"+this._host,this.internalHost))},enumerable:!1,configurable:!0}),ct.prototype.toString=function(){var e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e},ct.prototype.toURLString=function(){var e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?"?ns="+this.namespace:"";return e+this.host+"/"+t},ct);function ct(e,t,n,r,i,o,s){void 0===i&&(i=!1),void 0===o&&(o=""),void 0===s&&(s=!1),this.secure=t,this.namespace=n,this.webSocketOnly=r,this.nodeAdmin=i,this.persistenceKey=o,this.includeNamespaceInQueryParams=s,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=ve.get("host:"+e)||this._host}function dt(e,t,n){var r;if(g("string"==typeof t,"typeof type must == string"),g("object"==typeof n,"typeof params must == object"),t===ut)r=(e.secure?"wss://":"ws://")+e.internalHost+"/.ws?";else{if(t!==lt)throw new Error("Unknown connection type: "+t);r=(e.secure?"https://":"http://")+e.internalHost+"/.lp?"}((t=e).host!==t.internalHost||t.isCustomHost()||t.includeNamespaceInQueryParams)&&(n.ns=e.namespace);var i=[];return De(n,function(e,t){i.push(e+"="+t)}),r+i.join("&")}function pt(e){return"string"==typeof e&&0!==e.length&&!It.test(e)}function ft(e){return"string"==typeof e&&0!==e.length&&!Pt.test(e)}function _t(e){return null===e||"string"==typeof e||"number"==typeof e&&!ce(e)||e&&"object"==typeof e&&D(e,".sv")}function yt(e,t,n,r,i){i&&void 0===n||Rt(Q(e,t,i),n,r)}function vt(e,t,n,r,i){if(!i||void 0!==n){var o=Q(e,t,i);if(!n||"object"!=typeof n||Array.isArray(n))throw new Error(o+" must be an object containing the children to replace.");var s=[];De(n,function(e,t){e=new Be(e);if(Rt(o,t,Xe(r,e)),".priority"===Ge(e)&&!_t(t))throw new Error(o+"contains an invalid value for '"+e.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");s.push(e)}),function(e,t){for(var n=0;n<t.length;n++)for(var r,i=$e(r=t[n]),o=0;o<i.length;o++)if((".priority"!==i[o]||o!==i.length-1)&&!pt(i[o]))throw new Error(e+"contains an invalid key ("+i[o]+") in path "+r.toString()+'. Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');t.sort(tt);var s=null;for(n=0;n<t.length;n++){if(r=t[n],null!==s&&rt(s,r))throw new Error(e+"contains a path "+s.toString()+" that is ancestor of another path "+r.toString());s=r}}(o,s)}}function gt(e,t,n,r){if(!r||void 0!==n){if(ce(n))throw new Error(Q(e,t,r)+"is "+n.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!_t(n))throw new Error(Q(e,t,r)+"must be a valid Firebase priority (a string, finite number, server value, or null).")}}function mt(e,t,n,r){if(!r||void 0!==n)switch(n){case"value":case"child_added":case"child_removed":case"child_changed":case"child_moved":break;default:throw new Error(Q(e,t,r)+'must be a valid event type = "value", "child_added", "child_removed", "child_changed", or "child_moved".')}}function wt(e,t,n,r){if(!(r&&void 0===n||pt(n)))throw new Error(Q(e,t,r)+'was an invalid key = "'+n+'".  Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]").')}function Ct(e,t,n,r){if(!(r&&void 0===n||ft(n)))throw new Error(Q(e,t,r)+'was an invalid path = "'+n+'". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"')}function bt(e,t){if(".info"===ze(t))throw new Error(e+" failed = Can't modify data under /.info/")}var Et,St=function(e,t){var n=Tt(e),r=n.namespace;"firebase.com"===n.domain&&Ie(n.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),r&&"undefined"!==r||"localhost"===n.domain||Ie("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),n.secure||"undefined"!=typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf("https:")&&Pe("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");e="ws"===n.scheme||"wss"===n.scheme;return{repoInfo:new ht(n.host,n.secure,r,t,e,"",r!==n.subdomain),path:new Be(n.pathString)}},Tt=function(e){var t,n,r,i="",o="",s="",a="",u="",l=!0,h="https",c=443;return"string"==typeof e&&(0<=(r=e.indexOf("//"))&&(h=e.substring(0,r-1),e=e.substring(r+2)),-1===(t=e.indexOf("/"))&&(t=e.length),-1===(n=e.indexOf("?"))&&(n=e.length),i=e.substring(0,Math.min(t,n)),t<n&&(a=function(e){for(var t="",n=e.split("/"),r=0;r<n.length;r++)if(0<n[r].length){var i=n[r];try{i=decodeURIComponent(i.replace(/\+/g," "))}catch(e){}t+="/"+i}return t}(e.substring(t,n))),n=function(e){var t,n,r={};"?"===e.charAt(0)&&(e=e.substring(1));try{for(var i=_(e.split("&")),o=i.next();!o.done;o=i.next()){var s,a=o.value;0!==a.length&&(2===(s=a.split("=")).length?r[decodeURIComponent(s[0])]=decodeURIComponent(s[1]):Pe("Invalid query segment '"+a+"' in query '"+e+"'"))}}catch(e){t={error:e}}finally{try{o&&!o.done&&(n=i.return)&&n.call(i)}finally{if(t)throw t.error}}return r}(e.substring(Math.min(e.length,n))),0<=(r=i.indexOf(":"))?(l="https"===h||"wss"===h,c=parseInt(i.substring(r+1),10)):r=i.length,"localhost"===(r=i.slice(0,r)).toLowerCase()?o="localhost":r.split(".").length<=2?o=r:(r=i.indexOf("."),s=i.substring(0,r).toLowerCase(),o=i.substring(r+1),u=s),"ns"in n&&(u=n.ns)),{host:i,port:c,domain:o,subdomain:s,secure:l,scheme:h,pathString:a,namespace:u}},It=/[\[\].#$\/\u0000-\u001F\u007F]/,Pt=/[\[\].#$\u0000-\u001F\u007F]/,Nt=10485760,Rt=function(r,e,t){var i=t instanceof Be?new it(t,r):t;if(void 0===e)throw new Error(r+"contains undefined "+st(i));if("function"==typeof e)throw new Error(r+"contains a function "+st(i)+" with contents = "+e.toString());if(ce(e))throw new Error(r+"contains "+e.toString()+" "+st(i));if("string"==typeof e&&e.length>Nt/3&&B(e)>Nt)throw new Error(r+"contains a string greater than "+Nt+" utf8 bytes "+st(i)+" ('"+e.substring(0,50)+"...')");if(e&&"object"==typeof e){var o=!1,s=!1;if(De(e,function(e,t){if(".value"===e)o=!0;else if(".priority"!==e&&".sv"!==e&&(s=!0,!pt(e)))throw new Error(r+" contains an invalid key ("+e+") "+st(i)+'.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');var n;n=e,0<(e=i).parts_.length&&(e.byteLength_+=1),e.parts_.push(n),e.byteLength_+=B(n),ot(e),Rt(r,t,i),t=(e=i).parts_.pop(),e.byteLength_-=B(t),0<e.parts_.length&&--e.byteLength_}),o&&s)throw new Error(r+' contains ".value" child '+st(i)+" in addition to actual children.")}},xt=function(e,t,n){var r=n.path.toString();if("string"!=typeof n.repoInfo.host||0===n.repoInfo.host.length||!pt(n.repoInfo.namespace)&&"localhost"!==n.repoInfo.host.split(":")[0]||0!==r.length&&(r=(r=r)&&r.replace(/^\/*\.info(\/|$)/,"/"),!ft(r)))throw new Error(Q(e,t,!1)+'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".')};function kt(e){return"number"==typeof e?"number:"+Oe(e):"string:"+e}var Dt,Ot=function(e){var t;e.isLeafNode()?(t=e.val(),g("string"==typeof t||"number"==typeof t||"object"==typeof t&&D(t,".sv"),"Priority must be a string or number.")):g(e===Et||e.isEmpty(),"priority of unexpected type."),g(e===Et||e.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")},At=(Object.defineProperty(Lt,"__childrenNodeConstructor",{get:function(){return Dt},set:function(e){Dt=e},enumerable:!1,configurable:!0}),Lt.prototype.isLeafNode=function(){return!0},Lt.prototype.getPriority=function(){return this.priorityNode_},Lt.prototype.updatePriority=function(e){return new Lt(this.value_,e)},Lt.prototype.getImmediateChild=function(e){return".priority"===e?this.priorityNode_:Lt.__childrenNodeConstructor.EMPTY_NODE},Lt.prototype.getChild=function(e){return Ze(e)?this:".priority"===ze(e)?this.priorityNode_:Lt.__childrenNodeConstructor.EMPTY_NODE},Lt.prototype.hasChild=function(){return!1},Lt.prototype.getPredecessorChildName=function(e,t){return null},Lt.prototype.updateImmediateChild=function(e,t){return".priority"===e?this.updatePriority(t):t.isEmpty()&&".priority"!==e?this:Lt.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)},Lt.prototype.updateChild=function(e,t){var n=ze(e);return null===n?t:t.isEmpty()&&".priority"!==n?this:(g(".priority"!==n||1===Ke(e),".priority must be the last token in a path"),this.updateImmediateChild(n,Lt.__childrenNodeConstructor.EMPTY_NODE.updateChild(Ye(e),t)))},Lt.prototype.isEmpty=function(){return!1},Lt.prototype.numChildren=function(){return 0},Lt.prototype.forEachChild=function(e,t){return!1},Lt.prototype.val=function(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()},Lt.prototype.hash=function(){var e,t;return null===this.lazyHash_&&(e="",this.priorityNode_.isEmpty()||(e+="priority:"+kt(this.priorityNode_.val())+":"),e+=(t=typeof this.value_)+":",e+="number"==t?Oe(this.value_):this.value_,this.lazyHash_=ue(e)),this.lazyHash_},Lt.prototype.getValue=function(){return this.value_},Lt.prototype.compareTo=function(e){return e===Lt.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof Lt.__childrenNodeConstructor?-1:(g(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))},Lt.prototype.compareToLeafNode_=function(e){var t=typeof e.value_,n=typeof this.value_,r=Lt.VALUE_TYPE_ORDER.indexOf(t),i=Lt.VALUE_TYPE_ORDER.indexOf(n);return g(0<=r,"Unknown leaf type: "+t),g(0<=i,"Unknown leaf type: "+n),r===i?"object"==n?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:i-r},Lt.prototype.withIndex=function(){return this},Lt.prototype.isIndexed=function(){return!0},Lt.prototype.equals=function(e){return e===this||!!e.isLeafNode()&&(this.value_===e.value_&&this.priorityNode_.equals(e.priorityNode_))},Lt.VALUE_TYPE_ORDER=["object","boolean","number","string"],Lt);function Lt(e,t){void 0===t&&(t=Lt.__childrenNodeConstructor.EMPTY_NODE),this.value_=e,this.priorityNode_=t,this.lazyHash_=null,g(void 0!==this.value_&&null!==this.value_,"LeafNode shouldn't be created with null/undefined value."),Ot(this.priorityNode_)}var Mt=(Ft.prototype.getNext=function(){if(0===this.nodeStack_.length)return null;var e=this.nodeStack_.pop(),t=this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value};if(this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t},Ft.prototype.hasNext=function(){return 0<this.nodeStack_.length},Ft.prototype.peek=function(){if(0===this.nodeStack_.length)return null;var e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}},Ft);function Ft(e,t,n,r,i){void 0===i&&(i=null),this.isReverse_=r,this.resultGenerator_=i,this.nodeStack_=[];for(var o=1;!e.isEmpty();)if(o=t?n(e.key,t):1,r&&(o*=-1),o<0)e=this.isReverse_?e.left:e.right;else{if(0===o){this.nodeStack_.push(e);break}this.nodeStack_.push(e),e=this.isReverse_?e.right:e.left}}var qt=(Wt.prototype.copy=function(e,t,n,r,i){return new Wt(null!=e?e:this.key,null!=t?t:this.value,null!=n?n:this.color,null!=r?r:this.left,null!=i?i:this.right)},Wt.prototype.count=function(){return this.left.count()+1+this.right.count()},Wt.prototype.isEmpty=function(){return!1},Wt.prototype.inorderTraversal=function(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)},Wt.prototype.reverseTraversal=function(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)},Wt.prototype.min_=function(){return this.left.isEmpty()?this:this.left.min_()},Wt.prototype.minKey=function(){return this.min_().key},Wt.prototype.maxKey=function(){return this.right.isEmpty()?this.key:this.right.maxKey()},Wt.prototype.insert=function(e,t,n){var r=this,i=n(e,r.key);return(r=i<0?r.copy(null,null,null,r.left.insert(e,t,n),null):0===i?r.copy(null,t,null,null,null):r.copy(null,null,null,null,r.right.insert(e,t,n))).fixUp_()},Wt.prototype.removeMin_=function(){if(this.left.isEmpty())return jt.EMPTY_NODE;var e=this;return(e=(e=!e.left.isRed_()&&!e.left.left.isRed_()?e.moveRedLeft_():e).copy(null,null,null,e.left.removeMin_(),null)).fixUp_()},Wt.prototype.remove=function(e,t){var n,r=this;if(t(e,r.key)<0)r=(r=!(r.left.isEmpty()||r.left.isRed_()||r.left.left.isRed_())?r.moveRedLeft_():r).copy(null,null,null,r.left.remove(e,t),null);else{if(0===t(e,(r=!((r=r.left.isRed_()?r.rotateRight_():r).right.isEmpty()||r.right.isRed_()||r.right.left.isRed_())?r.moveRedRight_():r).key)){if(r.right.isEmpty())return jt.EMPTY_NODE;n=r.right.min_(),r=r.copy(n.key,n.value,null,null,r.right.removeMin_())}r=r.copy(null,null,null,null,r.right.remove(e,t))}return r.fixUp_()},Wt.prototype.isRed_=function(){return this.color},Wt.prototype.fixUp_=function(){var e=this;return e=(e=(e=e.right.isRed_()&&!e.left.isRed_()?e.rotateLeft_():e).left.isRed_()&&e.left.left.isRed_()?e.rotateRight_():e).left.isRed_()&&e.right.isRed_()?e.colorFlip_():e},Wt.prototype.moveRedLeft_=function(){var e=this.colorFlip_();return e=e.right.left.isRed_()?(e=(e=e.copy(null,null,null,null,e.right.rotateRight_())).rotateLeft_()).colorFlip_():e},Wt.prototype.moveRedRight_=function(){var e=this.colorFlip_();return e=e.left.left.isRed_()?(e=e.rotateRight_()).colorFlip_():e},Wt.prototype.rotateLeft_=function(){var e=this.copy(null,null,Wt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)},Wt.prototype.rotateRight_=function(){var e=this.copy(null,null,Wt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)},Wt.prototype.colorFlip_=function(){var e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)},Wt.prototype.checkMaxDepth_=function(){var e=this.check_();return Math.pow(2,e)<=this.count()+1},Wt.prototype.check_=function(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");var e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)},Wt.RED=!0,Wt.BLACK=!1,Wt);function Wt(e,t,n,r,i){this.key=e,this.value=t,this.color=null!=n?n:Wt.RED,this.left=null!=r?r:jt.EMPTY_NODE,this.right=null!=i?i:jt.EMPTY_NODE}Qt.prototype.copy=function(e,t,n,r,i){return this},Qt.prototype.insert=function(e,t,n){return new qt(e,t,null)},Qt.prototype.remove=function(e,t){return this},Qt.prototype.count=function(){return 0},Qt.prototype.isEmpty=function(){return!0},Qt.prototype.inorderTraversal=function(e){return!1},Qt.prototype.reverseTraversal=function(e){return!1},Qt.prototype.minKey=function(){return null},Qt.prototype.maxKey=function(){return null},Qt.prototype.check_=function(){return 0},Qt.prototype.isRed_=function(){return!1},ye=Qt;function Qt(){}var jt=(Ut.prototype.insert=function(e,t){return new Ut(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,qt.BLACK,null,null))},Ut.prototype.remove=function(e){return new Ut(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,qt.BLACK,null,null))},Ut.prototype.get=function(e){for(var t,n=this.root_;!n.isEmpty();){if(0===(t=this.comparator_(e,n.key)))return n.value;t<0?n=n.left:0<t&&(n=n.right)}return null},Ut.prototype.getPredecessorKey=function(e){for(var t,n=this.root_,r=null;!n.isEmpty();){if(0===(t=this.comparator_(e,n.key))){if(n.left.isEmpty())return r?r.key:null;for(n=n.left;!n.right.isEmpty();)n=n.right;return n.key}t<0?n=n.left:0<t&&(n=(r=n).right)}throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")},Ut.prototype.isEmpty=function(){return this.root_.isEmpty()},Ut.prototype.count=function(){return this.root_.count()},Ut.prototype.minKey=function(){return this.root_.minKey()},Ut.prototype.maxKey=function(){return this.root_.maxKey()},Ut.prototype.inorderTraversal=function(e){return this.root_.inorderTraversal(e)},Ut.prototype.reverseTraversal=function(e){return this.root_.reverseTraversal(e)},Ut.prototype.getIterator=function(e){return new Mt(this.root_,null,this.comparator_,!1,e)},Ut.prototype.getIteratorFrom=function(e,t){return new Mt(this.root_,e,this.comparator_,!1,t)},Ut.prototype.getReverseIteratorFrom=function(e,t){return new Mt(this.root_,e,this.comparator_,!0,t)},Ut.prototype.getReverseIterator=function(e){return new Mt(this.root_,null,this.comparator_,!0,e)},Ut.EMPTY_NODE=new ye,Ut);function Ut(e,t){void 0===t&&(t=Ut.EMPTY_NODE),this.comparator_=e,this.root_=t}var Bt=(Ht.Wrap=function(e,t){return new Ht(e,t)},Ht);function Ht(e,t){this.name=e,this.node=t}var Vt,zt,Kt,G=(Yt.prototype.getCompare=function(){return this.compare.bind(this)},Yt.prototype.indexedValueChanged=function(e,t){e=new Bt(Ne,e),t=new Bt(Ne,t);return 0!==this.compare(e,t)},Yt.prototype.minPost=function(){return Bt.MIN},Yt);function Yt(){}function Gt(){return null!==Kt&&Kt.apply(this,arguments)||this}var $t,Jt,Xt=new(n(Gt,Kt=G),Gt.prototype.compare=function(e,t){var n=e.node.getPriority(),r=t.node.getPriority(),r=n.compareTo(r);return 0===r?xe(e.name,t.name):r},Gt.prototype.isDefinedOn=function(e){return!e.getPriority().isEmpty()},Gt.prototype.indexedValueChanged=function(e,t){return!e.getPriority().equals(t.getPriority())},Gt.prototype.minPost=function(){return Bt.MIN},Gt.prototype.maxPost=function(){return new Bt(Re,new At("[PRIORITY-POST]",zt))},Gt.prototype.makePost=function(e,t){e=Vt(e);return new Bt(t,new At("[PRIORITY-POST]",e))},Gt.prototype.toString=function(){return".priority"},Gt),ye=(n(Zt,Jt=G),Object.defineProperty(Zt,"__EMPTY_NODE",{get:function(){return $t},set:function(e){$t=e},enumerable:!1,configurable:!0}),Zt.prototype.compare=function(e,t){return xe(e.name,t.name)},Zt.prototype.isDefinedOn=function(e){throw m("KeyIndex.isDefinedOn not expected to be called.")},Zt.prototype.indexedValueChanged=function(e,t){return!1},Zt.prototype.minPost=function(){return Bt.MIN},Zt.prototype.maxPost=function(){return new Bt(Re,$t)},Zt.prototype.makePost=function(e,t){return g("string"==typeof e,"KeyIndex indexValue must always be a string."),new Bt(e,$t)},Zt.prototype.toString=function(){return".key"},Zt);function Zt(){return null!==Jt&&Jt.apply(this,arguments)||this}var en=new ye,tn=Math.log(2),nn=(rn.prototype.nextBitIsOne=function(){var e=!(this.bits_&1<<this.current_);return this.current_--,e},rn);function rn(e){var t;this.count=(t=e+1,parseInt(Math.log(t)/tn,10)),this.current_=this.count-1;var n,r=(n=this.count,parseInt(Array(n+1).join("1"),2));this.bits_=e+1&r}var on,sn,an=function(l,e,h,t){l.sort(e);var c=function(e,t){var n=t-e;if(0==n)return null;if(1==n)return r=l[e],i=h?h(r):r,new qt(i,r.node,qt.BLACK,null,null);var n=parseInt(n/2,10)+e,e=c(e,n),t=c(n+1,t),r=l[n],i=h?h(r):r;return new qt(i,r.node,qt.BLACK,e,t)},n=function(e){for(var t=null,n=null,i=l.length,r=function(e,t){var n=i-e,r=i;i-=e;e=c(1+n,r),r=l[n],n=h?h(r):r;o(new qt(n,r.node,t,null,e))},o=function(e){t=t?t.left=e:n=e},s=0;s<e.count;++s){var a=e.nextBitIsOne(),u=Math.pow(2,e.count-(s+1));a?r(u,qt.BLACK):(r(u,qt.BLACK),r(u,qt.RED))}return n}(new nn(l.length));return new jt(t||e,n)},un={},ln=(Object.defineProperty(hn,"Default",{get:function(){return g(Xt,"ChildrenNode.ts has not been loaded"),on=on||new hn({".priority":un},{".priority":Xt})},enumerable:!1,configurable:!0}),hn.prototype.get=function(e){var t=O(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof jt?t:null},hn.prototype.hasIndex=function(e){return D(this.indexSet_,e.toString())},hn.prototype.addIndex=function(e,t){g(e!==en,"KeyIndex always exists and isn't meant to be added to the IndexMap.");for(var n=[],r=!1,i=t.getIterator(Bt.Wrap),o=i.getNext();o;)r=r||e.isDefinedOn(o.node),n.push(o),o=i.getNext();var s=r?an(n,e.getCompare()):un,a=e.toString(),u=l({},this.indexSet_);u[a]=e;t=l({},this.indexes_);return t[a]=s,new hn(t,u)},hn.prototype.addToIndexes=function(s,a){var u=this;return new hn(L(this.indexes_,function(e,t){var n=O(u.indexSet_,t);if(g(n,"Missing index implementation for "+t),e===un){if(n.isDefinedOn(s.node)){for(var r=[],i=a.getIterator(Bt.Wrap),o=i.getNext();o;)o.name!==s.name&&r.push(o),o=i.getNext();return r.push(s),an(r,n.getCompare())}return un}n=a.get(s.name);return(e=n?e.remove(new Bt(s.name,n)):e).insert(s,s.node)}),this.indexSet_)},hn.prototype.removeFromIndexes=function(n,r){return new hn(L(this.indexes_,function(e){if(e===un)return e;var t=r.get(n.name);return t?e.remove(new Bt(n.name,t)):e}),this.indexSet_)},hn);function hn(e,t){this.indexes_=e,this.indexSet_=t}function cn(e,t){return xe(e.name,t.name)}function dn(e,t){return xe(e,t)}var pn,fn=(Object.defineProperty(_n,"EMPTY_NODE",{get:function(){return sn=sn||new _n(new jt(dn),null,ln.Default)},enumerable:!1,configurable:!0}),_n.prototype.isLeafNode=function(){return!1},_n.prototype.getPriority=function(){return this.priorityNode_||sn},_n.prototype.updatePriority=function(e){return this.children_.isEmpty()?this:new _n(this.children_,e,this.indexMap_)},_n.prototype.getImmediateChild=function(e){if(".priority"===e)return this.getPriority();e=this.children_.get(e);return null===e?sn:e},_n.prototype.getChild=function(e){var t=ze(e);return null===t?this:this.getImmediateChild(t).getChild(Ye(e))},_n.prototype.hasChild=function(e){return null!==this.children_.get(e)},_n.prototype.updateImmediateChild=function(e,t){if(g(t,"We should always be passing snapshot nodes"),".priority"===e)return this.updatePriority(t);var n=new Bt(e,t),r=void 0,i=void 0,i=t.isEmpty()?(r=this.children_.remove(e),this.indexMap_.removeFromIndexes(n,this.children_)):(r=this.children_.insert(e,t),this.indexMap_.addToIndexes(n,this.children_)),n=r.isEmpty()?sn:this.priorityNode_;return new _n(r,n,i)},_n.prototype.updateChild=function(e,t){var n=ze(e);if(null===n)return t;g(".priority"!==ze(e)||1===Ke(e),".priority must be the last token in a path");t=this.getImmediateChild(n).updateChild(Ye(e),t);return this.updateImmediateChild(n,t)},_n.prototype.isEmpty=function(){return this.children_.isEmpty()},_n.prototype.numChildren=function(){return this.children_.count()},_n.prototype.val=function(n){if(this.isEmpty())return null;var r={},i=0,o=0,s=!0;if(this.forEachChild(Xt,function(e,t){r[e]=t.val(n),i++,s&&_n.INTEGER_REGEXP_.test(e)?o=Math.max(o,Number(e)):s=!1}),!n&&s&&o<2*i){var e,t=[];for(e in r)t[e]=r[e];return t}return n&&!this.getPriority().isEmpty()&&(r[".priority"]=this.getPriority().val()),r},_n.prototype.hash=function(){var n;return null===this.lazyHash_&&(n="",this.getPriority().isEmpty()||(n+="priority:"+kt(this.getPriority().val())+":"),this.forEachChild(Xt,function(e,t){t=t.hash();""!==t&&(n+=":"+e+":"+t)}),this.lazyHash_=""===n?"":ue(n)),this.lazyHash_},_n.prototype.getPredecessorChildName=function(e,t,n){n=this.resolveIndex_(n);if(n){t=n.getPredecessorKey(new Bt(e,t));return t?t.name:null}return this.children_.getPredecessorKey(e)},_n.prototype.getFirstChildName=function(e){e=this.resolveIndex_(e);if(e){e=e.minKey();return e&&e.name}return this.children_.minKey()},_n.prototype.getFirstChild=function(e){e=this.getFirstChildName(e);return e?new Bt(e,this.children_.get(e)):null},_n.prototype.getLastChildName=function(e){e=this.resolveIndex_(e);if(e){e=e.maxKey();return e&&e.name}return this.children_.maxKey()},_n.prototype.getLastChild=function(e){e=this.getLastChildName(e);return e?new Bt(e,this.children_.get(e)):null},_n.prototype.forEachChild=function(e,t){e=this.resolveIndex_(e);return e?e.inorderTraversal(function(e){return t(e.name,e.node)}):this.children_.inorderTraversal(t)},_n.prototype.getIterator=function(e){return this.getIteratorFrom(e.minPost(),e)},_n.prototype.getIteratorFrom=function(e,t){var n=this.resolveIndex_(t);if(n)return n.getIteratorFrom(e,function(e){return e});for(var r=this.children_.getIteratorFrom(e.name,Bt.Wrap),i=r.peek();null!=i&&t.compare(i,e)<0;)r.getNext(),i=r.peek();return r},_n.prototype.getReverseIterator=function(e){return this.getReverseIteratorFrom(e.maxPost(),e)},_n.prototype.getReverseIteratorFrom=function(e,t){var n=this.resolveIndex_(t);if(n)return n.getReverseIteratorFrom(e,function(e){return e});for(var r=this.children_.getReverseIteratorFrom(e.name,Bt.Wrap),i=r.peek();null!=i&&0<t.compare(i,e);)r.getNext(),i=r.peek();return r},_n.prototype.compareTo=function(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===vn?-1:0},_n.prototype.withIndex=function(e){if(e===en||this.indexMap_.hasIndex(e))return this;e=this.indexMap_.addIndex(e,this.children_);return new _n(this.children_,this.priorityNode_,e)},_n.prototype.isIndexed=function(e){return e===en||this.indexMap_.hasIndex(e)},_n.prototype.equals=function(e){if(e===this)return!0;if(e.isLeafNode())return!1;if(this.getPriority().equals(e.getPriority())){if(this.children_.count()!==e.children_.count())return!1;for(var t=this.getIterator(Xt),n=e.getIterator(Xt),r=t.getNext(),i=n.getNext();r&&i;){if(r.name!==i.name||!r.node.equals(i.node))return!1;r=t.getNext(),i=n.getNext()}return null===r&&null===i}return!1},_n.prototype.resolveIndex_=function(e){return e===en?null:this.indexMap_.get(e.toString())},_n.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/,_n);function _n(e,t,n){this.children_=e,this.priorityNode_=t,this.indexMap_=n,this.lazyHash_=null,this.priorityNode_&&Ot(this.priorityNode_),this.children_.isEmpty()&&g(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}function yn(){return pn.call(this,new jt(dn),fn.EMPTY_NODE,ln.Default)||this}var vn=new(n(yn,pn=fn),yn.prototype.compareTo=function(e){return e===this?0:1},yn.prototype.equals=function(e){return e===this},yn.prototype.getPriority=function(){return this},yn.prototype.getImmediateChild=function(e){return fn.EMPTY_NODE},yn.prototype.isEmpty=function(){return!1},yn);Object.defineProperties(Bt,{MIN:{value:new Bt(Ne,fn.EMPTY_NODE)},MAX:{value:new Bt(Re,vn)}}),ye.__EMPTY_NODE=fn.EMPTY_NODE,At.__childrenNodeConstructor=fn,Et=vn,zt=vn;var gn,mn=!0;function wn(n,e){if(void 0===e&&(e=null),null===n)return fn.EMPTY_NODE;if("object"==typeof n&&".priority"in n&&(e=n[".priority"]),g(null===e||"string"==typeof e||"number"==typeof e||"object"==typeof e&&".sv"in e,"Invalid priority type found: "+typeof e),"object"==typeof n&&".value"in n&&null!==n[".value"]&&(n=n[".value"]),"object"!=typeof n||".sv"in n)return new At(n,wn(e));if(n instanceof Array||!mn){var r=fn.EMPTY_NODE;return De(n,function(e,t){D(n,e)&&"."!==e.substring(0,1)&&(!(t=wn(t)).isLeafNode()&&t.isEmpty()||(r=r.updateImmediateChild(e,t)))}),r.updatePriority(wn(e))}var i=[],o=!1;if(De(n,function(e,t){"."!==e.substring(0,1)&&((t=wn(t)).isEmpty()||(o=o||!t.getPriority().isEmpty(),i.push(new Bt(e,t))))}),0===i.length)return fn.EMPTY_NODE;var t=an(i,cn,function(e){return e.name},dn);if(o){var s=an(i,Xt.getCompare());return new fn(t,wn(e),new ln({".priority":s},{".priority":Xt}))}return new fn(t,wn(e),ln.Default)}function Cn(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function bn(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function En(e){return{fromUser:!1,fromServer:!0,queryId:e,tagged:!0}}Vt=wn,(ye=gn=gn||{})[ye.OVERWRITE=0]="OVERWRITE",ye[ye.MERGE=1]="MERGE",ye[ye.ACK_USER_WRITE=2]="ACK_USER_WRITE",ye[ye.LISTEN_COMPLETE=3]="LISTEN_COMPLETE";var Sn,Tn=(In.prototype.operationForChild=function(e){if(Ze(this.path)){if(null!=this.affectedTree.value)return g(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;var t=this.affectedTree.subtree(new Be(e));return new In(Ve(),t,this.revert)}return g(ze(this.path)===e,"operationForChild called for unrelated child."),new In(Ye(this.path),this.affectedTree,this.revert)},In);function In(e,t,n){this.path=e,this.affectedTree=t,this.revert=n,this.type=gn.ACK_USER_WRITE,this.source=Cn()}var Pn=(Nn.fromObject=function(e){var n=new Nn(null);return De(e,function(e,t){n=n.set(new Be(e),t)}),n},Nn.prototype.isEmpty=function(){return null===this.value&&this.children.isEmpty()},Nn.prototype.findRootMostMatchingPathAndValue=function(e,t){if(null!=this.value&&t(this.value))return{path:Ve(),value:this.value};if(Ze(e))return null;var n=ze(e),r=this.children.get(n);if(null===r)return null;t=r.findRootMostMatchingPathAndValue(Ye(e),t);return null==t?null:{path:Xe(new Be(n),t.path),value:t.value}},Nn.prototype.findRootMostValueAndPath=function(e){return this.findRootMostMatchingPathAndValue(e,function(){return!0})},Nn.prototype.subtree=function(e){if(Ze(e))return this;var t=ze(e),t=this.children.get(t);return null!==t?t.subtree(Ye(e)):new Nn(null)},Nn.prototype.set=function(e,t){if(Ze(e))return new Nn(t,this.children);var n=ze(e),t=(this.children.get(n)||new Nn(null)).set(Ye(e),t),t=this.children.insert(n,t);return new Nn(this.value,t)},Nn.prototype.remove=function(e){if(Ze(e))return this.children.isEmpty()?new Nn(null):new Nn(null,this.children);var t=ze(e),n=this.children.get(t);if(n){n=n.remove(Ye(e)),e=void 0,e=n.isEmpty()?this.children.remove(t):this.children.insert(t,n);return null===this.value&&e.isEmpty()?new Nn(null):new Nn(this.value,e)}return this},Nn.prototype.get=function(e){if(Ze(e))return this.value;var t=ze(e),t=this.children.get(t);return t?t.get(Ye(e)):null},Nn.prototype.setTree=function(e,t){if(Ze(e))return t;var n=ze(e),e=(this.children.get(n)||new Nn(null)).setTree(Ye(e),t),t=void 0,t=e.isEmpty()?this.children.remove(n):this.children.insert(n,e);return new Nn(this.value,t)},Nn.prototype.fold=function(e){return this.fold_(Ve(),e)},Nn.prototype.fold_=function(n,r){var i={};return this.children.inorderTraversal(function(e,t){i[e]=t.fold_(Xe(n,e),r)}),r(n,this.value,i)},Nn.prototype.findOnPath=function(e,t){return this.findOnPath_(e,Ve(),t)},Nn.prototype.findOnPath_=function(e,t,n){var r=!!this.value&&n(t,this.value);if(r)return r;if(Ze(e))return null;var i=ze(e),r=this.children.get(i);return r?r.findOnPath_(Ye(e),Xe(t,i),n):null},Nn.prototype.foreachOnPath=function(e,t){return this.foreachOnPath_(e,Ve(),t)},Nn.prototype.foreachOnPath_=function(e,t,n){if(Ze(e))return this;this.value&&n(t,this.value);var r=ze(e),i=this.children.get(r);return i?i.foreachOnPath_(Ye(e),Xe(t,r),n):new Nn(null)},Nn.prototype.foreach=function(e){this.foreach_(Ve(),e)},Nn.prototype.foreach_=function(n,r){this.children.inorderTraversal(function(e,t){t.foreach_(Xe(n,e),r)}),this.value&&r(n,this.value)},Nn.prototype.foreachChild=function(n){this.children.inorderTraversal(function(e,t){t.value&&n(e,t.value)})},Nn);function Nn(e,t){void 0===t&&(t=Sn=Sn||new jt(de)),this.value=e,this.children=t}var Rn=(xn.prototype.operationForChild=function(e){return Ze(this.path)?new xn(this.source,Ve()):new xn(this.source,Ye(this.path))},xn);function xn(e,t){this.source=e,this.path=t,this.type=gn.LISTEN_COMPLETE}var kn=(Dn.prototype.operationForChild=function(e){return Ze(this.path)?new Dn(this.source,Ve(),this.snap.getImmediateChild(e)):new Dn(this.source,Ye(this.path),this.snap)},Dn);function Dn(e,t,n){this.source=e,this.path=t,this.snap=n,this.type=gn.OVERWRITE}var On=(An.prototype.operationForChild=function(e){if(Ze(this.path)){var t=this.children.subtree(new Be(e));return t.isEmpty()?null:t.value?new kn(this.source,Ve(),t.value):new An(this.source,Ve(),t)}return g(ze(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new An(this.source,Ye(this.path),this.children)},An.prototype.toString=function(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"},An);function An(e,t,n){this.source=e,this.path=t,this.children=n,this.type=gn.MERGE}var Ln=(Mn.prototype.isFullyInitialized=function(){return this.fullyInitialized_},Mn.prototype.isFiltered=function(){return this.filtered_},Mn.prototype.isCompleteForPath=function(e){if(Ze(e))return this.isFullyInitialized()&&!this.filtered_;e=ze(e);return this.isCompleteForChild(e)},Mn.prototype.isCompleteForChild=function(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)},Mn.prototype.getNode=function(){return this.node_},Mn);function Mn(e,t,n){this.node_=e,this.fullyInitialized_=t,this.filtered_=n}function Fn(e,t){return{eventCache:e,serverCache:t}}function qn(e,t,n,r){return Fn(new Ln(t,n,r),e.serverCache)}function Wn(e,t,n,r){return Fn(e.eventCache,new Ln(t,n,r))}function Qn(e){return e.eventCache.isFullyInitialized()?e.eventCache.getNode():null}function jn(e){return e.serverCache.isFullyInitialized()?e.serverCache.getNode():null}function Un(e){return{type:"value",snapshotNode:e}}function Bn(e,t){return{type:"child_added",snapshotNode:t,childName:e}}function Hn(e,t){return{type:"child_removed",snapshotNode:t,childName:e}}function Vn(e,t,n){return{type:"child_changed",snapshotNode:t,childName:e,oldSnap:n}}var zn=(Kn.prototype.updateChild=function(e,t,n,r,i,o){g(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");var s=e.getImmediateChild(t);return s.getChild(r).equals(n.getChild(r))&&s.isEmpty()===n.isEmpty()?e:(null!=o&&(n.isEmpty()?e.hasChild(t)?o.trackChildChange(Hn(t,s)):g(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):s.isEmpty()?o.trackChildChange(Bn(t,n)):o.trackChildChange(Vn(t,n,s))),e.isLeafNode()&&n.isEmpty()?e:e.updateImmediateChild(t,n).withIndex(this.index_))},Kn.prototype.updateFullNode=function(r,n,i){return null!=i&&(r.isLeafNode()||r.forEachChild(Xt,function(e,t){n.hasChild(e)||i.trackChildChange(Hn(e,t))}),n.isLeafNode()||n.forEachChild(Xt,function(e,t){var n;r.hasChild(e)?(n=r.getImmediateChild(e)).equals(t)||i.trackChildChange(Vn(e,t,n)):i.trackChildChange(Bn(e,t))})),n.withIndex(this.index_)},Kn.prototype.updatePriority=function(e,t){return e.isEmpty()?fn.EMPTY_NODE:e.updatePriority(t)},Kn.prototype.filtersNodes=function(){return!1},Kn.prototype.getIndexedFilter=function(){return this},Kn.prototype.getIndex=function(){return this.index_},Kn);function Kn(e){this.index_=e}var Yn=(Gn.prototype.trackChildChange=function(e){var t=e.type,n=e.childName;g("child_added"===t||"child_changed"===t||"child_removed"===t,"Only child changes supported for tracking"),g(".priority"!==n,"Only non-priority child changes can be tracked.");var r=this.changeMap.get(n);if(r){var i=r.type;if("child_added"===t&&"child_removed"===i)this.changeMap.set(n,Vn(n,e.snapshotNode,r.snapshotNode));else if("child_removed"===t&&"child_added"===i)this.changeMap.delete(n);else if("child_removed"===t&&"child_changed"===i)this.changeMap.set(n,Hn(n,r.oldSnap));else if("child_changed"===t&&"child_added"===i)this.changeMap.set(n,Bn(n,e.snapshotNode));else{if("child_changed"!==t||"child_changed"!==i)throw m("Illegal combination of changes: "+e+" occurred after "+r);this.changeMap.set(n,Vn(n,e.snapshotNode,r.oldSnap))}}else this.changeMap.set(n,e)},Gn.prototype.getChanges=function(){return Array.from(this.changeMap.values())},Gn);function Gn(){this.changeMap=new Map}var $n=(Jn.empty=function(){return new Jn(new Pn(null))},Jn);function Jn(e){this.writeTree_=e}function Xn(e,t,n){if(Ze(t))return new $n(new Pn(n));var r=e.writeTree_.findRootMostValueAndPath(t);if(null!=r){var i=r.path,o=r.value,r=et(i,t),o=o.updateChild(r,n);return new $n(e.writeTree_.set(i,o))}n=new Pn(n),n=e.writeTree_.setTree(t,n);return new $n(n)}function Zn(e,n,t){var r=e;return De(t,function(e,t){r=Xn(r,Xe(n,e),t)}),r}function er(e,t){if(Ze(t))return $n.empty();t=e.writeTree_.setTree(t,new Pn(null));return new $n(t)}function tr(e,t){return null!=nr(e,t)}function nr(e,t){var n=e.writeTree_.findRootMostValueAndPath(t);return null!=n?e.writeTree_.get(n.path).getChild(et(n.path,t)):null}function rr(e){var n=[],t=e.writeTree_.value;return null!=t?t.isLeafNode()||t.forEachChild(Xt,function(e,t){n.push(new Bt(e,t))}):e.writeTree_.children.inorderTraversal(function(e,t){null!=t.value&&n.push(new Bt(e,t.value))}),n}function ir(e,t){if(Ze(t))return e;var n=nr(e,t);return new $n(null!=n?new Pn(n):e.writeTree_.subtree(t))}function or(e){return e.writeTree_.isEmpty()}function sr(e,t){return function n(r,e,i){{if(null!=e.value)return i.updateChild(r,e.value);var o=null;return e.children.inorderTraversal(function(e,t){".priority"===e?(g(null!==t.value,"Priority writes must always be leaf nodes"),o=t.value):i=n(Xe(r,e),t,i)}),i=!i.getChild(r).isEmpty()&&null!==o?i.updateChild(Xe(r,".priority"),o):i}}(Ve(),e.writeTree_,t)}function ar(e,t){return mr(t,e)}function ur(t,n){var e=t.allWrites.findIndex(function(e){return e.writeId===n});g(0<=e,"removeWrite called with nonexistent writeId.");var r=t.allWrites[e];t.allWrites.splice(e,1);for(var i,o=r.visible,s=!1,a=t.allWrites.length-1;o&&0<=a;){var u=t.allWrites[a];u.visible&&(e<=a&&function(e,t){{if(e.snap)return rt(e.path,t);for(var n in e.children)if(e.children.hasOwnProperty(n)&&rt(Xe(e.path,n),t))return!0;return!1}}(u,r.path)?o=!1:rt(r.path,u.path)&&(s=!0)),a--}return!!o&&(s?((i=t).visibleWrites=hr(i.allWrites,lr,Ve()),0<i.allWrites.length?i.lastWriteId=i.allWrites[i.allWrites.length-1].writeId:i.lastWriteId=-1):r.snap?t.visibleWrites=er(t.visibleWrites,r.path):De(r.children,function(e){t.visibleWrites=er(t.visibleWrites,Xe(r.path,e))}),!0)}function lr(e){return e.visible}function hr(e,t,n){for(var r=$n.empty(),i=0;i<e.length;++i){var o=e[i];if(t(o)){var s=o.path,a=void 0;if(o.snap)rt(n,s)?r=Xn(r,a=et(n,s),o.snap):rt(s,n)&&(a=et(s,n),r=Xn(r,Ve(),o.snap.getChild(a)));else{if(!o.children)throw m("WriteRecord should have .snap or .children");rt(n,s)?r=Zn(r,a=et(n,s),o.children):rt(s,n)&&(Ze(a=et(s,n))?r=Zn(r,Ve(),o.children):(o=O(o.children,ze(a)))&&(a=o.getChild(Ye(a)),r=Xn(r,Ve(),a)))}}}return r}function cr(e,t,n,r,i){if(r||i){var o=ir(e.visibleWrites,t);if(!i&&or(o))return n;if(i||null!=n||tr(o,Ve()))return sr(hr(e.allWrites,function(e){return(e.visible||i)&&(!r||!~r.indexOf(e.writeId))&&(rt(e.path,t)||rt(t,e.path))},t),n||fn.EMPTY_NODE);return null}o=nr(e.visibleWrites,t);if(null!=o)return o;e=ir(e.visibleWrites,t);return or(e)?n:null!=n||tr(e,Ve())?sr(e,n||fn.EMPTY_NODE):null}function dr(e,t,n,r){return cr(e.writeTree,e.treePath,t,n,r)}function pr(e,t){return function(e,t,n){var r=fn.EMPTY_NODE,i=nr(e.visibleWrites,t);if(i)return i.isLeafNode()||i.forEachChild(Xt,function(e,t){r=r.updateImmediateChild(e,t)}),r;if(n){var o=ir(e.visibleWrites,t);return n.forEachChild(Xt,function(e,t){t=sr(ir(o,new Be(e)),t);r=r.updateImmediateChild(e,t)}),rr(o).forEach(function(e){r=r.updateImmediateChild(e.name,e.node)}),r}return rr(ir(e.visibleWrites,t)).forEach(function(e){r=r.updateImmediateChild(e.name,e.node)}),r}(e.writeTree,e.treePath,t)}function fr(e,t,n,r){return i=e.writeTree,e=e.treePath,t=t,r=r,g(n||r,"Either existingEventSnap or existingServerSnap must exist"),e=Xe(e,t),tr(i.visibleWrites,e)?null:or(e=ir(i.visibleWrites,e))?r.getChild(t):sr(e,r.getChild(t));var i}function _r(e,t){return n=e.writeTree,t=Xe(e.treePath,t),nr(n.visibleWrites,t);var n}function yr(e,t,n,r,i,o){return function(e,t,n,r,i,o,s){var a,e=ir(e.visibleWrites,t);if(null!=(t=nr(e,Ve())))a=t;else{if(null==n)return[];a=sr(e,n)}if((a=a.withIndex(s)).isEmpty()||a.isLeafNode())return[];for(var u=[],l=s.getCompare(),h=o?a.getReverseIteratorFrom(r,s):a.getIteratorFrom(r,s),c=h.getNext();c&&u.length<i;)0!==l(c,r)&&u.push(c),c=h.getNext();return u}(e.writeTree,e.treePath,t,n,r,i,o)}function vr(e,t,n){return r=e.writeTree,i=e.treePath,e=n,t=Xe(i,n=t),null!=(i=nr(r.visibleWrites,t))?i:e.isCompleteForChild(n)?sr(ir(r.visibleWrites,t),e.getNode().getImmediateChild(n)):null;var r,i}function gr(e,t){return mr(Xe(e.treePath,t),e.writeTree)}function mr(e,t){return{treePath:e,writeTree:t}}function wr(){}var Cr=new(wr.prototype.getCompleteChild=function(e){return null},wr.prototype.getChildAfterChild=function(e,t,n){return null},wr),br=(Er.prototype.getCompleteChild=function(e){var t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);t=null!=this.optCompleteServerCache_?new Ln(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return vr(this.writes_,e,t)},Er.prototype.getChildAfterChild=function(e,t,n){var r=null!=this.optCompleteServerCache_?this.optCompleteServerCache_:jn(this.viewCache_),e=yr(this.writes_,r,t,1,n,e);return 0===e.length?null:e[0]},Er);function Er(e,t,n){void 0===n&&(n=null),this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=n}function Sr(e,t,n,r,i){var o,s,a,u,l,h,c,d,p=new Yn;if(n.type===gn.OVERWRITE)var f=n,_=f.source.fromUser?Pr(e,t,f.path,f.snap,r,i,p):(g(f.source.fromServer,"Unknown source."),o=f.source.tagged||t.serverCache.isFiltered()&&!Ze(f.path),Ir(e,t,f.path,f.snap,r,i,o,p));else if(n.type===gn.MERGE){var y=n;_=y.source.fromUser?(s=e,a=t,u=y.path,f=y.children,l=r,h=i,c=p,d=a,f.foreach(function(e,t){e=Xe(u,e);Nr(a,ze(e))&&(d=Pr(s,d,e,t,l,h,c))}),f.foreach(function(e,t){e=Xe(u,e);Nr(a,ze(e))||(d=Pr(s,d,e,t,l,h,c))}),d):(g(y.source.fromServer,"Unknown source."),o=y.source.tagged||t.serverCache.isFiltered(),xr(e,t,y.path,y.children,r,i,o,p))}else if(n.type===gn.ACK_USER_WRITE){var v=n;_=v.revert?function(e,t,n,r,i,o){var s;{if(null!=_r(r,n))return t;var a,u,l=new br(r,t,i),h=t.eventCache.getNode(),i=void 0;return Ze(n)||".priority"===ze(n)?(u=void 0,u=t.serverCache.isFullyInitialized()?dr(r,jn(t)):(a=t.serverCache.getNode(),g(a instanceof fn,"serverChildren would be complete if leaf node"),pr(r,a)),i=e.filter.updateFullNode(h,u,o)):(a=ze(n),null==(u=vr(r,a,t.serverCache))&&t.serverCache.isCompleteForChild(a)&&(u=h.getImmediateChild(a)),(i=null!=u?e.filter.updateChild(h,a,u,Ye(n),l,o):t.eventCache.getNode().hasChild(a)?e.filter.updateChild(h,a,fn.EMPTY_NODE,Ye(n),l,o):h).isEmpty()&&t.serverCache.isFullyInitialized()&&(s=dr(r,jn(t))).isLeafNode()&&(i=e.filter.updateFullNode(i,s,o))),s=t.serverCache.isFullyInitialized()||null!=_r(r,Ve()),qn(t,i,s,e.filter.filtersNodes())}}(e,t,v.path,r,i,p):function(e,t,r,n,i,o,s){if(null!=_r(i,r))return t;var a=t.serverCache.isFiltered(),u=t.serverCache;{if(null!=n.value){if(Ze(r)&&u.isFullyInitialized()||u.isCompleteForPath(r))return Ir(e,t,r,u.getNode().getChild(r),i,o,a,s);if(Ze(r)){var l=new Pn(null);return u.getNode().forEachChild(en,function(e,t){l=l.set(new Be(e),t)}),xr(e,t,r,l,i,o,a,s)}return t}var h=new Pn(null);return n.foreach(function(e,t){var n=Xe(r,e);u.isCompleteForPath(n)&&(h=h.set(e,u.getNode().getChild(n)))}),xr(e,t,r,h,i,o,a,s)}}(e,t,v.path,v.affectedTree,r,i,p)}else{if(n.type!==gn.LISTEN_COMPLETE)throw m("Unknown operation type: "+n.type);o=e,v=t,i=n.path,e=r,n=p,r=v.serverCache,r=Wn(v,r.getNode(),r.isFullyInitialized()||Ze(i),r.isFiltered()),_=Tr(o,r,i,e,Cr,n)}p=p.getChanges();return function(e,t,n){var r=t.eventCache;{var i,o;r.isFullyInitialized()&&(i=r.getNode().isLeafNode()||r.getNode().isEmpty(),o=Qn(e),(0<n.length||!e.eventCache.isFullyInitialized()||i&&!r.getNode().equals(o)||!r.getNode().getPriority().equals(o.getPriority()))&&n.push(Un(Qn(t))))}}(t,_,p),{viewCache:_,changes:p}}function Tr(e,t,n,r,i,o){var s=t.eventCache;if(null!=_r(r,n))return t;var a,u,l,h,c=void 0,d=void 0;return c=Ze(n)?(g(t.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),t.serverCache.isFiltered()?(a=pr(r,(a=jn(t))instanceof fn?a:fn.EMPTY_NODE),e.filter.updateFullNode(t.eventCache.getNode(),a,o)):(u=dr(r,jn(t)),e.filter.updateFullNode(t.eventCache.getNode(),u,o))):".priority"===(u=ze(n))?(g(1===Ke(n),"Can't have a priority with additional path components"),null!=(h=fr(r,n,l=s.getNode(),d=t.serverCache.getNode()))?e.filter.updatePriority(l,h):s.getNode()):(l=Ye(n),h=void 0,null!=(h=s.isCompleteForChild(u)?(d=t.serverCache.getNode(),null!=(d=fr(r,n,s.getNode(),d))?s.getNode().getImmediateChild(u).updateChild(l,d):s.getNode().getImmediateChild(u)):vr(r,u,t.serverCache))?e.filter.updateChild(s.getNode(),u,h,l,i,o):s.getNode()),qn(t,c,s.isFullyInitialized()||Ze(n),e.filter.filtersNodes())}function Ir(e,t,n,r,i,o,s,a){var u=t.serverCache,l=s?e.filter:e.filter.getIndexedFilter();if(Ze(n))c=l.updateFullNode(u.getNode(),r,null);else if(l.filtersNodes()&&!u.isFiltered())var h=u.getNode().updateChild(n,r),c=l.updateFullNode(u.getNode(),h,null);else{s=ze(n);if(!u.isCompleteForPath(n)&&1<Ke(n))return t;h=Ye(n),r=u.getNode().getImmediateChild(s).updateChild(h,r);c=".priority"===s?l.updatePriority(u.getNode(),r):l.updateChild(u.getNode(),s,r,h,Cr,null)}l=Wn(t,c,u.isFullyInitialized()||Ze(n),l.filtersNodes());return Tr(e,l,n,i,new br(i,l,o),a)}function Pr(e,t,n,r,i,o,s){var a,u,l=t.eventCache,h=new br(i,t,o);return Ze(n)?(u=e.filter.updateFullNode(t.eventCache.getNode(),r,s),qn(t,u,!0,e.filter.filtersNodes())):".priority"===(a=ze(n))?(u=e.filter.updatePriority(t.eventCache.getNode(),r),qn(t,u,l.isFullyInitialized(),l.isFiltered())):(i=Ye(n),o=l.getNode().getImmediateChild(a),u=void 0,u=Ze(i)?r:null!=(n=h.getCompleteChild(a))?".priority"===Ge(i)&&n.getChild(Je(i)).isEmpty()?n:n.updateChild(i,r):fn.EMPTY_NODE,o.equals(u)?t:qn(t,e.filter.updateChild(l.getNode(),a,u,i,h,s),l.isFullyInitialized(),e.filter.filtersNodes()))}function Nr(e,t){return e.eventCache.isCompleteForChild(t)}function Rr(e,n,t){return t.foreach(function(e,t){n=n.updateChild(e,t)}),n}function xr(r,i,e,t,o,s,a,u){if(i.serverCache.getNode().isEmpty()&&!i.serverCache.isFullyInitialized())return i;var l=i,t=Ze(e)?t:new Pn(null).setTree(e,t),h=i.serverCache.getNode();return t.children.inorderTraversal(function(e,t){h.hasChild(e)&&(t=Rr(0,i.serverCache.getNode().getImmediateChild(e),t),l=Ir(r,l,new Be(e),t,o,s,a,u))}),t.children.inorderTraversal(function(e,t){var n=!i.serverCache.isCompleteForChild(e)&&void 0===t.value;h.hasChild(e)||n||(t=Rr(0,i.serverCache.getNode().getImmediateChild(e),t),l=Ir(r,l,new Be(e),t,o,s,a,u))}),l}var kr=function(e){this.query_=e,this.index_=this.query_.getQueryParams().getIndex()};function Dr(n,e,t,r){var i=[],o=[];return e.forEach(function(e){var t;"child_changed"===e.type&&n.index_.indexedValueChanged(e.oldSnap,e.snapshotNode)&&o.push((t=e.childName,{type:"child_moved",snapshotNode:e.snapshotNode,childName:t}))}),Or(n,i,"child_removed",e,r,t),Or(n,i,"child_added",e,r,t),Or(n,i,"child_moved",o,r,t),Or(n,i,"child_changed",e,r,t),Or(n,i,"value",e,r,t),i}function Or(o,s,t,e,a,u){e=e.filter(function(e){return e.type===t});e.sort(function(e,t){return function(e,t,n){if(null==t.childName||null==n.childName)throw m("Should only compare child_ events.");t=new Bt(t.childName,t.snapshotNode),n=new Bt(n.childName,n.snapshotNode);return e.index_.compare(t,n)}(o,e,t)}),e.forEach(function(t){var e,n,r,i=(e=o,r=u,"value"===(n=t).type||"child_removed"===n.type||(n.prevName=r.getPredecessorChildName(n.childName,n.snapshotNode,e.index_)),n);a.forEach(function(e){e.respondsTo(t.type)&&s.push(e.createEvent(i,o.query_))})})}function Ar(e){if(e===""+qe)return"-";var t=We(e);if(null!=t)return""+(t+1);for(var n=new Array(e.length),r=0;r<n.length;r++)n[r]=e.charAt(r);if(n.length<786)return n.push("-"),n.join("");for(var i=n.length-1;0<=i&&"z"===n[i];)i--;return-1===i?Re:(t=n[i],t=Wr.charAt(Wr.indexOf(t)+1),n[i]=t,n.slice(0,i+1).join(""))}function Lr(e){if(e===""+Fe)return Ne;var t=We(e);if(null!=t)return""+(t-1);for(var n=new Array(e.length),r=0;r<n.length;r++)n[r]=e.charAt(r);return"-"===n[n.length-1]?1===n.length?""+qe:(delete n[n.length-1],n.join("")):(n[n.length-1]=Wr.charAt(Wr.indexOf(n[n.length-1])-1),n.join("")+"z".repeat(786-n.length))}var Mr,Fr,qr,Wr="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",Qr=(Mr=0,Fr=[],function(e){var t=e===Mr;Mr=e;for(var n=new Array(8),r=7;0<=r;r--)n[r]=Wr.charAt(e%64),e=Math.floor(e/64);g(0===e,"Cannot push at time == 0");var i=n.join("");if(t){for(r=11;0<=r&&63===Fr[r];r--)Fr[r]=0;Fr[r]++}else for(r=0;r<12;r++)Fr[r]=Math.floor(64*Math.random());for(r=0;r<12;r++)i+=Wr.charAt(Fr[r]);return g(20===i.length,"nextPushId: Length should be 20."),i});function jr(){return null!==qr&&qr.apply(this,arguments)||this}var Ur,Br=new(n(jr,qr=G),jr.prototype.compare=function(e,t){var n=e.node.compareTo(t.node);return 0===n?xe(e.name,t.name):n},jr.prototype.isDefinedOn=function(e){return!0},jr.prototype.indexedValueChanged=function(e,t){return!e.equals(t)},jr.prototype.minPost=function(){return Bt.MIN},jr.prototype.maxPost=function(){return Bt.MAX},jr.prototype.makePost=function(e,t){e=wn(e);return new Bt(t,e)},jr.prototype.toString=function(){return".value"},jr),Hr=(n(Vr,Ur=G),Vr.prototype.extractChild=function(e){return e.getChild(this.indexPath_)},Vr.prototype.isDefinedOn=function(e){return!e.getChild(this.indexPath_).isEmpty()},Vr.prototype.compare=function(e,t){var n=this.extractChild(e.node),r=this.extractChild(t.node),r=n.compareTo(r);return 0===r?xe(e.name,t.name):r},Vr.prototype.makePost=function(e,t){e=wn(e),e=fn.EMPTY_NODE.updateChild(this.indexPath_,e);return new Bt(t,e)},Vr.prototype.maxPost=function(){var e=fn.EMPTY_NODE.updateChild(this.indexPath_,vn);return new Bt(Re,e)},Vr.prototype.toString=function(){return $e(this.indexPath_,0).join("/")},Vr);function Vr(e){var t=Ur.call(this)||this;return t.indexPath_=e,g(!Ze(e)&&".priority"!==ze(e),"Can't create PathIndex with empty path or .priority key"),t}var zr=(Kr.prototype.getStartPost=function(){return this.startPost_},Kr.prototype.getEndPost=function(){return this.endPost_},Kr.prototype.matches=function(e){return this.index_.compare(this.getStartPost(),e)<=0&&this.index_.compare(e,this.getEndPost())<=0},Kr.prototype.updateChild=function(e,t,n,r,i,o){return this.matches(new Bt(t,n))||(n=fn.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,n,r,i,o)},Kr.prototype.updateFullNode=function(e,t,n){t.isLeafNode()&&(t=fn.EMPTY_NODE);var r=(r=t.withIndex(this.index_)).updatePriority(fn.EMPTY_NODE),i=this;return t.forEachChild(Xt,function(e,t){i.matches(new Bt(e,t))||(r=r.updateImmediateChild(e,fn.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,r,n)},Kr.prototype.updatePriority=function(e,t){return e},Kr.prototype.filtersNodes=function(){return!0},Kr.prototype.getIndexedFilter=function(){return this.indexedFilter_},Kr.prototype.getIndex=function(){return this.index_},Kr.getStartPost_=function(e){if(e.hasStart()){var t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}return e.getIndex().minPost()},Kr.getEndPost_=function(e){if(e.hasEnd()){var t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}return e.getIndex().maxPost()},Kr);function Kr(e){this.indexedFilter_=new zn(e.getIndex()),this.index_=e.getIndex(),this.startPost_=Kr.getStartPost_(e),this.endPost_=Kr.getEndPost_(e)}var Yr=(Gr.prototype.updateChild=function(e,t,n,r,i,o){return this.rangedFilter_.matches(new Bt(t,n))||(n=fn.EMPTY_NODE),e.getImmediateChild(t).equals(n)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,n,r,i,o):this.fullLimitUpdateChild_(e,t,n,i,o)},Gr.prototype.updateFullNode=function(e,t,n){if(t.isLeafNode()||t.isEmpty())r=fn.EMPTY_NODE.withIndex(this.index_);else if(2*this.limit_<t.numChildren()&&t.isIndexed(this.index_)){var r=fn.EMPTY_NODE.withIndex(this.index_),i=void 0;i=this.reverse_?t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);for(var o=0;i.hasNext()&&o<this.limit_;){var s=i.getNext();if(!(this.reverse_?this.index_.compare(this.rangedFilter_.getStartPost(),s)<=0:this.index_.compare(s,this.rangedFilter_.getEndPost())<=0))break;r=r.updateImmediateChild(s.name,s.node),o++}}else{r=(r=t.withIndex(this.index_)).updatePriority(fn.EMPTY_NODE);var a,u=void 0,l=void 0,h=void 0,i=void 0;h=this.reverse_?(i=r.getReverseIterator(this.index_),u=this.rangedFilter_.getEndPost(),l=this.rangedFilter_.getStartPost(),a=this.index_.getCompare(),function(e,t){return a(t,e)}):(i=r.getIterator(this.index_),u=this.rangedFilter_.getStartPost(),l=this.rangedFilter_.getEndPost(),this.index_.getCompare());for(var o=0,c=!1;i.hasNext();){s=i.getNext();(c=!c&&h(u,s)<=0?!0:c)&&o<this.limit_&&h(s,l)<=0?o++:r=r.updateImmediateChild(s.name,fn.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,r,n)},Gr.prototype.updatePriority=function(e,t){return e},Gr.prototype.filtersNodes=function(){return!0},Gr.prototype.getIndexedFilter=function(){return this.rangedFilter_.getIndexedFilter()},Gr.prototype.getIndex=function(){return this.index_},Gr.prototype.fullLimitUpdateChild_=function(e,t,n,r,i){var o,s;s=this.reverse_?(o=this.index_.getCompare(),function(e,t){return o(t,e)}):this.index_.getCompare();var a=e;g(a.numChildren()===this.limit_,"");var u=new Bt(t,n),l=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),h=this.rangedFilter_.matches(u);if(a.hasChild(t)){for(var c=a.getImmediateChild(t),d=r.getChildAfterChild(this.index_,l,this.reverse_);null!=d&&(d.name===t||a.hasChild(d.name));)d=r.getChildAfterChild(this.index_,d,this.reverse_);var p=null==d?1:s(d,u);if(h&&!n.isEmpty()&&0<=p)return null!=i&&i.trackChildChange(Vn(t,n,c)),a.updateImmediateChild(t,n);null!=i&&i.trackChildChange(Hn(t,c));c=a.updateImmediateChild(t,fn.EMPTY_NODE);return null!=d&&this.rangedFilter_.matches(d)?(null!=i&&i.trackChildChange(Bn(d.name,d.node)),c.updateImmediateChild(d.name,d.node)):c}return!n.isEmpty()&&h&&0<=s(l,u)?(null!=i&&(i.trackChildChange(Hn(l.name,l.node)),i.trackChildChange(Bn(t,n))),a.updateImmediateChild(t,n).updateImmediateChild(l.name,fn.EMPTY_NODE)):e},Gr);function Gr(e){this.rangedFilter_=new zr(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft()}var $r=(Jr.prototype.hasStart=function(){return this.startSet_},Jr.prototype.hasStartAfter=function(){return this.startAfterSet_},Jr.prototype.hasEndBefore=function(){return this.endBeforeSet_},Jr.prototype.isViewFromLeft=function(){return""===this.viewFrom_?this.startSet_:"l"===this.viewFrom_},Jr.prototype.getIndexStartValue=function(){return g(this.startSet_,"Only valid if start has been set"),this.indexStartValue_},Jr.prototype.getIndexStartName=function(){return g(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:Ne},Jr.prototype.hasEnd=function(){return this.endSet_},Jr.prototype.getIndexEndValue=function(){return g(this.endSet_,"Only valid if end has been set"),this.indexEndValue_},Jr.prototype.getIndexEndName=function(){return g(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:Re},Jr.prototype.hasLimit=function(){return this.limitSet_},Jr.prototype.hasAnchoredLimit=function(){return this.limitSet_&&""!==this.viewFrom_},Jr.prototype.getLimit=function(){return g(this.limitSet_,"Only valid if limit has been set"),this.limit_},Jr.prototype.getIndex=function(){return this.index_},Jr.prototype.loadsAllData=function(){return!(this.startSet_||this.endSet_||this.limitSet_)},Jr.prototype.isDefault=function(){return this.loadsAllData()&&this.index_===Xt},Jr.prototype.copy=function(){var e=new Jr;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e},Jr);function Jr(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=Xt}function Xr(e,t,n){e=e.copy();return e.startSet_=!0,void 0===t&&(t=null),e.indexStartValue_=t,null!=n?(e.startNameSet_=!0,e.indexStartName_=n):(e.startNameSet_=!1,e.indexStartName_=""),e}function Zr(e,t,n){e=e.copy();return e.endSet_=!0,void 0===t&&(t=null),e.indexEndValue_=t,void 0!==n?(e.endNameSet_=!0,e.indexEndName_=n):(e.endNameSet_=!1,e.indexEndName_=""),e}function ei(e,t){e=e.copy();return e.index_=t,e}function ti(e){var t,n={};return e.isDefault()||(t=e.index_===Xt?"$priority":e.index_===Br?"$value":e.index_===en?"$key":(g(e.index_ instanceof Hr,"Unrecognized index type!"),e.index_.toString()),n.orderBy=x(t),e.startSet_&&(n.startAt=x(e.indexStartValue_),e.startNameSet_&&(n.startAt+=","+x(e.indexStartName_))),e.endSet_&&(n.endAt=x(e.indexEndValue_),e.endNameSet_&&(n.endAt+=","+x(e.indexEndName_))),e.limitSet_&&(e.isViewFromLeft()?n.limitToFirst=e.limit_:n.limitToLast=e.limit_)),n}var ni,ri=(Object.defineProperty(ii.prototype,"query",{get:function(){return this.query_},enumerable:!1,configurable:!0}),ii);function ii(e,t){this.query_=e,this.eventRegistrations_=[];var n=this.query_.getQueryParams(),r=new zn(n.getIndex()),i=(o=n).loadsAllData()?new zn(o.getIndex()):new(o.hasLimit()?Yr:zr)(o);this.processor_={filter:i};var e=t.serverCache,n=t.eventCache,o=r.updateFullNode(fn.EMPTY_NODE,e.getNode(),null),t=i.updateFullNode(fn.EMPTY_NODE,n.getNode(),null),r=new Ln(o,e.isFullyInitialized(),r.filtersNodes()),i=new Ln(t,n.isFullyInitialized(),i.filtersNodes());this.viewCache_=Fn(i,r),this.eventGenerator_=new kr(this.query_)}function oi(e){return 0===e.eventRegistrations_.length}function si(e,t,n){var r,i=[];if(n&&(g(null==t,"A cancel should cancel all event registrations."),r=e.query.path,e.eventRegistrations_.forEach(function(e){e=e.createCancelEvent(n,r);e&&i.push(e)})),t){for(var o=[],s=0;s<e.eventRegistrations_.length;++s){var a=e.eventRegistrations_[s];if(a.matches(t)){if(t.hasAnyCallback()){o=o.concat(e.eventRegistrations_.slice(s+1));break}}else o.push(a)}e.eventRegistrations_=o}else e.eventRegistrations_=[];return i}function ai(e,t,n,r){t.type===gn.MERGE&&null!==t.source.queryId&&(g(jn(e.viewCache_),"We should always have a full cache before handling merges"),g(Qn(e.viewCache_),"Missing event cache, even though we have a server cache"));var i=e.viewCache_,t=Sr(e.processor_,i,t,n,r);return n=e.processor_,r=t.viewCache,g(r.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),g(r.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed"),g(t.viewCache.serverCache.isFullyInitialized()||!i.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),e.viewCache_=t.viewCache,ui(e,t.changes,t.viewCache.eventCache.getNode(),null)}function ui(e,t,n,r){r=r?[r]:e.eventRegistrations_;return Dr(e.eventGenerator_,t,n,r)}var li=function(){this.views=new Map};function hi(e,t,n,r){var i,o,s=t.source.queryId;if(null!==s){var a=e.views.get(s);return g(null!=a,"SyncTree gave us an op for an invalid query."),ai(a,t,n,r)}var u=[];try{for(var l=_(e.views.values()),h=l.next();!h.done;h=l.next())a=h.value,u=u.concat(ai(a,t,n,r))}catch(e){i={error:e}}finally{try{h&&!h.done&&(o=l.return)&&o.call(l)}finally{if(i)throw i.error}}return u}function ci(e,t,n,r,i){var o=t.queryIdentifier(),e=e.views.get(o);if(e)return e;o=dr(n,i?r:null),e=!1,e=!!o||(o=r instanceof fn?pr(n,r):fn.EMPTY_NODE,!1),i=Fn(new Ln(o,e,!1),new Ln(r,i,!1));return new ri(t,i)}function di(e,t,n,r,i,o){var s,o=ci(e,t,r,i,o);return e.views.has(t.queryIdentifier())||e.views.set(t.queryIdentifier(),o),t=n,o.eventRegistrations_.push(t),t=n,o=(n=o).viewCache_.eventCache,s=[],o.getNode().isLeafNode()||o.getNode().forEachChild(Xt,function(e,t){s.push(Bn(e,t))}),o.isFullyInitialized()&&s.push(Un(o.getNode())),ui(n,s,o.getNode(),t)}function pi(e,t,n,r){var i,o,s=t.queryIdentifier(),a=[],u=[],l=gi(e);if("default"===s)try{for(var h=_(e.views.entries()),c=h.next();!c.done;c=h.next()){var d=y(c.value,2),p=d[0],f=d[1],u=u.concat(si(f,n,r));oi(f)&&(e.views.delete(p),f.query.getQueryParams().loadsAllData()||a.push(f.query))}}catch(e){i={error:e}}finally{try{c&&!c.done&&(o=h.return)&&o.call(h)}finally{if(i)throw i.error}}else(f=e.views.get(s))&&(u=u.concat(si(f,n,r)),oi(f)&&(e.views.delete(s),f.query.getQueryParams().loadsAllData()||a.push(f.query)));return l&&!gi(e)&&a.push((g(ni,"Reference.ts has not been loaded"),new ni(t.repo,t.path))),{removed:a,events:u}}function fi(e){var t,n,r=[];try{for(var i=_(e.views.values()),o=i.next();!o.done;o=i.next()){var s=o.value;s.query.getQueryParams().loadsAllData()||r.push(s)}}catch(e){t={error:e}}finally{try{o&&!o.done&&(n=i.return)&&n.call(i)}finally{if(t)throw t.error}}return r}function _i(e,t){var n,r,i,o,s=null;try{for(var a=_(e.views.values()),u=a.next();!u.done;u=a.next())var l=u.value,s=s||(i=t,o=void 0,(o=jn((l=l).viewCache_))&&(l.query.getQueryParams().loadsAllData()||!Ze(i)&&!o.getImmediateChild(ze(i)).isEmpty())?o.getChild(i):null)}catch(e){n={error:e}}finally{try{u&&!u.done&&(r=a.return)&&r.call(a)}finally{if(n)throw n.error}}return s}function yi(e,t){if(t.getQueryParams().loadsAllData())return mi(e);t=t.queryIdentifier();return e.views.get(t)}function vi(e,t){return null!=yi(e,t)}function gi(e){return null!=mi(e)}function mi(e){var t,n;try{for(var r=_(e.views.values()),i=r.next();!i.done;i=r.next()){var o=i.value;if(o.query.getQueryParams().loadsAllData())return o}}catch(e){t={error:e}}finally{try{i&&!i.done&&(n=r.return)&&n.call(r)}finally{if(t)throw t.error}}return null}var wi=1,Ci=function(e){this.listenProvider_=e,this.syncPointTree_=new Pn(null),this.pendingWriteTree_={visibleWrites:$n.empty(),allWrites:[],lastWriteId:-1},this.tagToQueryMap=new Map,this.queryToTagMap=new Map};function bi(e,t,n,r,i){var o,s,a,u;return o=e.pendingWriteTree_,s=t,a=n,u=i,g((r=r)>o.lastWriteId,"Stacking an older write on top of newer ones"),void 0===u&&(u=!0),o.allWrites.push({path:s,snap:a,writeId:r,visible:u}),u&&(o.visibleWrites=Xn(o.visibleWrites,s,a)),o.lastWriteId=r,i?xi(e,new kn(Cn(),t,n)):[]}function Ei(e,t,n,r){var i,o,s;i=e.pendingWriteTree_,o=t,s=n,g((r=r)>i.lastWriteId,"Stacking an older merge on top of newer ones"),i.allWrites.push({path:o,children:s,writeId:r,visible:!0}),i.visibleWrites=Zn(i.visibleWrites,o,s),i.lastWriteId=r;n=Pn.fromObject(n);return xi(e,new On(Cn(),t,n))}function Si(e,t,n){void 0===n&&(n=!1);var r=function(e,t){for(var n=0;n<e.allWrites.length;n++){var r=e.allWrites[n];if(r.writeId===t)return r}return null}(e.pendingWriteTree_,t);if(ur(e.pendingWriteTree_,t)){var i=new Pn(null);return null!=r.snap?i=i.set(Ve(),!0):De(r.children,function(e){i=i.set(new Be(e),!0)}),xi(e,new Tn(r.path,i,n))}return[]}function Ti(e,t,n){return xi(e,new kn(bn(),t,n))}function Ii(n,e,t,r){var i=e.path,o=n.syncPointTree_.get(i),s=[];if(o&&("default"===e.queryIdentifier()||vi(o,e))){var a=pi(o,e,t,r);0===o.views.size&&(n.syncPointTree_=n.syncPointTree_.remove(i));t=a.removed,s=a.events,o=-1!==t.findIndex(function(e){return e.getQueryParams().loadsAllData()}),a=n.syncPointTree_.findOnPath(i,function(e,t){return gi(t)});if(o&&!a){i=n.syncPointTree_.subtree(i);if(!i.isEmpty())for(var u=i.fold(function(e,t,n){if(t&&gi(t))return[mi(t)];var r=[];return t&&(r=fi(t)),De(n,function(e,t){r=r.concat(t)}),r}),l=0;l<u.length;++l){var h=u[l],c=h.query,h=Di(n,h);n.listenProvider_.startListening(qi(c),Oi(n,c),h.hashFn,h.onComplete)}}!a&&0<t.length&&!r&&(o?n.listenProvider_.stopListening(qi(e),null):t.forEach(function(e){var t=n.queryToTagMap.get(Ai(e));n.listenProvider_.stopListening(qi(e),t)})),function(e,t){for(var n=0;n<t.length;++n){var r,i=t[n];i.getQueryParams().loadsAllData()||(r=Ai(i),i=e.queryToTagMap.get(r),e.queryToTagMap.delete(r),e.tagToQueryMap.delete(i))}}(n,t)}return s}function Pi(e,t,n){var r=t.path,i=null,o=!1;e.syncPointTree_.foreachOnPath(r,function(e,t){e=et(e,r);i=i||_i(t,e),o=o||gi(t)});var s=e.syncPointTree_.get(r);s?(o=o||gi(s),i=i||_i(s,Ve())):(s=new li,e.syncPointTree_=e.syncPointTree_.set(r,s)),null!=i?h=!0:(h=!1,i=fn.EMPTY_NODE,e.syncPointTree_.subtree(r).foreachChild(function(e,t){t=_i(t,Ve());t&&(i=i.updateImmediateChild(e,t))}));var a,u,l=vi(s,t);l||t.getQueryParams().loadsAllData()||(a=Ai(t),g(!e.queryToTagMap.has(a),"View does not exist, but we have a tag"),u=wi++,e.queryToTagMap.set(a,u),e.tagToQueryMap.set(u,a));var h=di(s,t,n,ar(e.pendingWriteTree_,r),i,h);return l||o||(s=yi(s,t),h=h.concat(function(e,t,n){var r=t.path,i=Oi(e,t),n=Di(e,n),n=e.listenProvider_.startListening(qi(t),i,n.hashFn,n.onComplete),r=e.syncPointTree_.subtree(r);if(i)g(!gi(r.value),"If we're adding a query, it shouldn't be shadowed");else for(var o=r.fold(function(e,t,n){if(!Ze(e)&&t&&gi(t))return[mi(t).query];var r=[];return t&&(r=r.concat(fi(t).map(function(e){return e.query}))),De(n,function(e,t){r=r.concat(t)}),r}),s=0;s<o.length;++s){var a=o[s];e.listenProvider_.stopListening(qi(a),Oi(e,a))}return n}(e,t,s))),h}function Ni(e,n,t){var r=e.pendingWriteTree_,e=e.syncPointTree_.findOnPath(n,function(e,t){e=_i(t,et(e,n));if(e)return e});return cr(r,n,e,t,!0)}function Ri(e,t){var n=t.path,r=null;e.syncPointTree_.foreachOnPath(n,function(e,t){e=et(e,n);r=r||_i(t,e)});var i=e.syncPointTree_.get(n);i?r=r||_i(i,Ve()):(i=new li,e.syncPointTree_=e.syncPointTree_.set(n,i));var o=null!=r,s=o?new Ln(r,!0,!1):null,o=ci(i,t,ar(e.pendingWriteTree_,t.path),o?s.getNode():fn.EMPTY_NODE,o);return Qn(o.viewCache_)}function xi(e,t){return function e(t,n,r,i){{if(Ze(t.path))return ki(t,n,r,i);var o=n.get(Ve());null==r&&null!=o&&(r=_i(o,Ve()));var s=[],a=ze(t.path),u=t.operationForChild(a),l=n.children.get(a);return l&&u&&(n=r?r.getImmediateChild(a):null,a=gr(i,a),s=s.concat(e(u,l,n,a))),s=o?s.concat(hi(o,t,i,r)):s}}(t,e.syncPointTree_,null,ar(e.pendingWriteTree_,Ve()))}function ki(i,e,o,s){var t=e.get(Ve());null==o&&null!=t&&(o=_i(t,Ve()));var a=[];return e.children.inorderTraversal(function(e,t){var n=o?o.getImmediateChild(e):null,r=gr(s,e),e=i.operationForChild(e);e&&(a=a.concat(ki(e,t,n,r)))}),a=t?a.concat(hi(t,i,s,o)):a}function Di(r,e){var i=e.query,o=Oi(r,i);return{hashFn:function(){return(e.viewCache_.serverCache.getNode()||fn.EMPTY_NODE).hash()},onComplete:function(e){if("ok"===e)return o?function(e,t,n){var r=Li(e,n);if(r){n=Mi(r),r=n.path,n=n.queryId,t=et(r,t);return Fi(e,r,new Rn(En(n),t))}return[]}(r,i.path,o):(t=r,n=i.path,xi(t,new Rn(bn(),n)));var t,n,e=Le(e,i);return Ii(r,i,null,e)}}}function Oi(e,t){t=Ai(t);return e.queryToTagMap.get(t)}function Ai(e){return e.path.toString()+"$"+e.queryIdentifier()}function Li(e,t){return e.tagToQueryMap.get(t)}function Mi(e){var t=e.indexOf("$");return g(-1!==t&&t<e.length-1,"Bad queryKey."),{queryId:e.substr(t+1),path:new Be(e.substr(0,t))}}function Fi(e,t,n){var r=e.syncPointTree_.get(t);return g(r,"Missing sync point for query tag that we're tracking"),hi(r,n,ar(e.pendingWriteTree_,t),null)}function qi(e){return e.getQueryParams().loadsAllData()&&!e.getQueryParams().isDefault()?e.getRef():e}var Wi=(Qi.prototype.getImmediateChild=function(e){return new Qi(this.node_.getImmediateChild(e))},Qi.prototype.node=function(){return this.node_},Qi);function Qi(e){this.node_=e}var ji=(Ui.prototype.getImmediateChild=function(e){e=Xe(this.path_,e);return new Ui(this.syncTree_,e)},Ui.prototype.node=function(){return Ni(this.syncTree_,this.path_)},Ui);function Ui(e,t){this.syncTree_=e,this.path_=t}var Bi=function(e){return(e=e||{}).timestamp=e.timestamp||(new Date).getTime(),e},Hi=function(e,t,n){return e&&"object"==typeof e?(g(".sv"in e,"Unexpected leaf node or priority contents"),"string"==typeof e[".sv"]?Vi(e[".sv"],t,n):"object"==typeof e[".sv"]?zi(e[".sv"],t):void g(!1,"Unexpected server value: "+JSON.stringify(e,null,2))):e},Vi=function(e,t,n){if("timestamp"===e)return n.timestamp;g(!1,"Unexpected server value: "+e)},zi=function(e,t,n){e.hasOwnProperty("increment")||g(!1,"Unexpected server value: "+JSON.stringify(e,null,2));e=e.increment;"number"!=typeof e&&g(!1,"Unexpected increment value: "+e);t=t.node();if(g(null!=t,"Expected ChildrenNode.EMPTY_NODE for nulls"),!t.isLeafNode())return e;t=t.getValue();return"number"!=typeof t?e:t+e},Ki=function(e,t,n,r){return Gi(t,new ji(n,e),r)},Yi=function(e,t,n){return Gi(e,new Wi(t),n)};function Gi(e,r,i){var t=e.getPriority().val(),n=Hi(t,r.getImmediateChild(".priority"),i);if(e.isLeafNode()){var o=e,t=Hi(o.getValue(),r,i);return t!==o.getValue()||n!==o.getPriority().val()?new At(t,wn(n)):e}var e=e,s=e;return n!==e.getPriority().val()&&(s=s.updatePriority(new At(n))),e.forEachChild(Xt,function(e,t){var n=Gi(t,r.getImmediateChild(e),i);n!==t&&(s=s.updateImmediateChild(e,n))}),s}function $i(){return{value:null,children:new Map}}function Ji(e,t,n){var r;Ze(t)?(e.value=n,e.children.clear()):null!==e.value?e.value=e.value.updateChild(t,n):(r=ze(t),e.children.has(r)||e.children.set(r,$i()),Ji(e.children.get(r),t=Ye(t),n))}function Xi(e,n,r){var i;null!==e.value?r(n,e.value):(i=function(e,t){Xi(t,new Be(n.toString()+"/"+e),r)},e.children.forEach(function(e,t){i(t,e)}))}var Zi=(eo.prototype.getNode=function(e){return this.rootNode_.getChild(e)},eo.prototype.updateSnapshot=function(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)},eo);function eo(){this.rootNode_=fn.EMPTY_NODE}var to=(no.prototype.incrementCounter=function(e,t){void 0===t&&(t=1),D(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t},no.prototype.get=function(){return d(this.counters_)},no);function no(){this.counters_={}}var ro={},io={};function oo(e){e=e.toString();return ro[e]||(ro[e]=new to),ro[e]}var so=(ao.prototype.get=function(){var e=this.collection_.get(),n=l({},e);return this.last_&&De(this.last_,function(e,t){n[e]=n[e]-t}),this.last_=e,n},ao);function ao(e){this.collection_=e,this.last_=null}var uo=(lo.prototype.reportStats_=function(){var n=this,e=this.statsListener_.get(),r={},i=!1;De(e,function(e,t){0<t&&D(n.statsToReport_,e)&&(r[e]=t,i=!0)}),i&&this.server_.reportStats(r),Ae(this.reportStats_.bind(this),Math.floor(2*Math.random()*3e5))},lo);function lo(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new so(e);e=1e4+2e4*Math.random();Ae(this.reportStats_.bind(this),Math.floor(e))}var ho=function(){this.eventLists_=[],this.recursionDepth_=0};function co(e,t){for(var n=null,r=0;r<t.length;r++){var i=t[r],o=i.getPath();null===n||nt(o,n.path)||(e.eventLists_.push(n),n=null),(n=null===n?{events:[],path:o}:n).events.push(i)}n&&e.eventLists_.push(n)}function po(e,t,n){co(e,n),_o(e,function(e){return nt(e,t)})}function fo(e,t,n){co(e,n),_o(e,function(e){return rt(e,t)||rt(t,e)})}function _o(e,t){e.recursionDepth_++;for(var n=!0,r=0;r<e.eventLists_.length;r++){var i=e.eventLists_[r];i&&(t(i.path)?(function(e){for(var t=0;t<e.events.length;t++){var n,r=e.events[t];null!==r&&(e.events[t]=null,n=r.getEventRunner(),be&&Se("event: "+r.toString()),Qe(n))}}(e.eventLists_[r]),e.eventLists_[r]=null):n=!1)}n&&(e.eventLists_=[]),e.recursionDepth_--}yo.prototype.trigger=function(e){for(var t=[],n=1;n<arguments.length;n++)t[n-1]=arguments[n];if(Array.isArray(this.listeners_[e]))for(var r=s([],y(this.listeners_[e])),i=0;i<r.length;i++)r[i].callback.apply(r[i].context,t)},yo.prototype.on=function(e,t,n){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:n});e=this.getInitialEvent(e);e&&t.apply(n,e)},yo.prototype.off=function(e,t,n){this.validateEventType_(e);for(var r=this.listeners_[e]||[],i=0;i<r.length;i++)if(r[i].callback===t&&(!n||n===r[i].context))return void r.splice(i,1)},yo.prototype.validateEventType_=function(t){g(this.allowedEvents_.find(function(e){return e===t}),"Unknown event: "+t)},G=yo;function yo(e){this.allowedEvents_=e,this.listeners_={},g(Array.isArray(e)&&0<e.length,"Requires a non-empty array")}var vo,go=(n(mo,vo=G),mo.getInstance=function(){return new mo},mo.prototype.getInitialEvent=function(e){return g("visible"===e,"Unknown event type: "+e),[this.visible_]},mo);function mo(){var t,e,n=vo.call(this,["visible"])||this;return"undefined"!=typeof document&&void 0!==document.addEventListener&&(void 0!==document.hidden?(e="visibilitychange",t="hidden"):void 0!==document.mozHidden?(e="mozvisibilitychange",t="mozHidden"):void 0!==document.msHidden?(e="msvisibilitychange",t="msHidden"):void 0!==document.webkitHidden&&(e="webkitvisibilitychange",t="webkitHidden")),n.visible_=!0,e&&document.addEventListener(e,function(){var e=!document[t];e!==n.visible_&&(n.visible_=e,n.trigger("visible",e))},!1),n}var wo,Co=(n(bo,wo=G),bo.getInstance=function(){return new bo},bo.prototype.getInitialEvent=function(e){return g("online"===e,"Unknown event type: "+e),[this.online_]},bo.prototype.currentlyOnline=function(){return this.online_},bo);function bo(){var e=wo.call(this,["online"])||this;return e.online_=!0,"undefined"==typeof window||void 0===window.addEventListener||w()||(window.addEventListener("online",function(){e.online_||(e.online_=!0,e.trigger("online",!0))},!1),window.addEventListener("offline",function(){e.online_&&(e.online_=!1,e.trigger("online",!1))},!1)),e}var Eo=(So.prototype.closeAfter=function(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)},So.prototype.handleResponse=function(e,t){var n=this;this.pendingResponses[e]=t;for(var r=this;this.pendingResponses[this.currentResponseNum];)if("break"===function(){var t=r.pendingResponses[r.currentResponseNum];delete r.pendingResponses[r.currentResponseNum];for(var e=0;e<t.length;++e)!function(e){t[e]&&Qe(function(){n.onMessage_(t[e])})}(e);if(r.currentResponseNum===r.closeAfterResponse)return r.onClose&&(r.onClose(),r.onClose=null),"break";r.currentResponseNum++}())break},So);function So(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}var To="pLPCommand",Io="pRTLPCB",Po=(No.prototype.open=function(e,t){var n,r,i,s=this;this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new Eo(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(function(){s.log_("Timed out trying to connect."),s.onClosed_(),s.connectTimeoutTimer_=null},Math.floor(3e4)),n=function(){var e;s.isClosed_||(s.scriptTagHolder=new Ro(function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=y(e,5),r=n[0],i=n[1],o=n[2];n[3],n[4];if(s.incrementIncomingBytes_(e),s.scriptTagHolder)if(s.connectTimeoutTimer_&&(clearTimeout(s.connectTimeoutTimer_),s.connectTimeoutTimer_=null),s.everConnected_=!0,"start"===r)s.id=i,s.password=o;else{if("close"!==r)throw new Error("Unrecognized command received: "+r);i?(s.scriptTagHolder.sendNewPolls=!1,s.myPacketOrderer.closeAfter(i,function(){s.onClosed_()})):s.onClosed_()}},function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=y(e,2),r=n[0],n=n[1];s.incrementIncomingBytes_(e),s.myPacketOrderer.handleResponse(r,n)},function(){s.onClosed_()},s.urlFn),(e={start:"t"}).ser=Math.floor(1e8*Math.random()),s.scriptTagHolder.uniqueCallbackIdentifier&&(e.cb=s.scriptTagHolder.uniqueCallbackIdentifier),e.v="5",s.transportSessionId&&(e.s=s.transportSessionId),s.lastSessionId&&(e.ls=s.lastSessionId),s.applicationId&&(e.p=s.applicationId),"undefined"!=typeof location&&location.hostname&&at.test(location.hostname)&&(e.r="f"),e=s.urlFn(e),s.log_("Connecting via long-poll to "+e),s.scriptTagHolder.addTag(e,function(){}))},"complete"===document.readyState?n():(r=!1,i=function(){document.body?r||(r=!0,n()):setTimeout(i,Math.floor(10))},document.addEventListener?(document.addEventListener("DOMContentLoaded",i,!1),window.addEventListener("load",i,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",function(){"complete"===document.readyState&&i()}),window.attachEvent("onload",i)))},No.prototype.start=function(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)},No.forceAllow=function(){No.forceAllow_=!0},No.forceDisallow=function(){No.forceDisallow_=!0},No.isAvailable=function(){return!!No.forceAllow_||!(No.forceDisallow_||"undefined"==typeof document||null==document.createElement||"object"==typeof window&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href)||"object"==typeof Windows&&"object"==typeof Windows.UI)},No.prototype.markConnectionHealthy=function(){},No.prototype.shutdown_=function(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)},No.prototype.onClosed_=function(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))},No.prototype.close=function(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())},No.prototype.send=function(e){e=x(e);this.bytesSent+=e.length,this.stats_.incrementCounter("bytes_sent",e.length);for(var e=function(e){e=a(e);return c.encodeByteArray(e,!0)}(e),t=fe(e,1840),n=0;n<t.length;n++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,t.length,t[n]),this.curSegmentNum++},No.prototype.addDisconnectPingFrame=function(e,t){this.myDisconnFrame=document.createElement("iframe");var n={dframe:"t"};n.id=e,n.pw=t,this.myDisconnFrame.src=this.urlFn(n),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)},No.prototype.incrementIncomingBytes_=function(e){e=x(e).length;this.bytesReceived+=e,this.stats_.incrementCounter("bytes_received",e)},No);function No(e,t,n,r,i){this.connId=e,this.repoInfo=t,this.applicationId=n,this.transportSessionId=r,this.lastSessionId=i,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=Te(e),this.stats_=oo(t),this.urlFn=function(e){return dt(t,lt,e)}}var Ro=(xo.createIFrame_=function(){var t=document.createElement("iframe");if(t.style.display="none",!document.body)throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";document.body.appendChild(t);try{t.contentWindow.document||Se("No IE domain setting required")}catch(e){var n=document.domain;t.src="javascript:void((function(){document.open();document.domain='"+n+"';document.close();})())"}return t.contentDocument?t.doc=t.contentDocument:t.contentWindow?t.doc=t.contentWindow.document:t.document&&(t.doc=t.document),t},xo.prototype.close=function(){var e=this;this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.innerHTML="",setTimeout(function(){null!==e.myIFrame&&(document.body.removeChild(e.myIFrame),e.myIFrame=null)},Math.floor(0)));var t=this.onDisconnect;t&&(this.onDisconnect=null,t())},xo.prototype.startLongPoll=function(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););},xo.prototype.newRequest_=function(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(0<this.pendingSegs.length?2:1)){this.currentSerial++;var e={};e.id=this.myID,e.pw=this.myPW,e.ser=this.currentSerial;for(var e=this.urlFn(e),t="",n=0;0<this.pendingSegs.length;){if(!(this.pendingSegs[0].d.length+30+t.length<=1870))break;var r=this.pendingSegs.shift(),t=t+"&seg"+n+"="+r.seg+"&ts"+n+"="+r.ts+"&d"+n+"="+r.d;n++}return e+=t,this.addLongPollTag_(e,this.currentSerial),!0}return!1},xo.prototype.enqueueSegment=function(e,t,n){this.pendingSegs.push({seg:e,ts:t,d:n}),this.alive&&this.newRequest_()},xo.prototype.addLongPollTag_=function(e,t){var n=this;this.outstandingRequests.add(t);function r(){n.outstandingRequests.delete(t),n.newRequest_()}var i=setTimeout(r,Math.floor(25e3));this.addTag(e,function(){clearTimeout(i),r()})},xo.prototype.addTag=function(e,n){var r=this;setTimeout(function(){try{if(!r.sendNewPolls)return;var t=r.myIFrame.doc.createElement("script");t.type="text/javascript",t.async=!0,t.src=e,t.onload=t.onreadystatechange=function(){var e=t.readyState;e&&"loaded"!==e&&"complete"!==e||(t.onload=t.onreadystatechange=null,t.parentNode&&t.parentNode.removeChild(t),n())},t.onerror=function(){Se("Long-poll script failed to load: "+e),r.sendNewPolls=!1,r.close()},r.myIFrame.doc.body.appendChild(t)}catch(e){}},Math.floor(1))},xo);function xo(e,t,n,r){this.onDisconnect=n,this.urlFn=r,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(1e8*Math.random()),this.sendNewPolls=!0,this.uniqueCallbackIdentifier=we(),window[To+this.uniqueCallbackIdentifier]=e,window[Io+this.uniqueCallbackIdentifier]=t,this.myIFrame=xo.createIFrame_();var t="",i="<html><body>"+(t=this.myIFrame.src&&"javascript:"===this.myIFrame.src.substr(0,"javascript:".length)?'<script>document.domain="'+document.domain+'";<\/script>':t)+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(i),this.myIFrame.doc.close()}catch(e){Se("frame writing exception"),e.stack&&Se(e.stack),Se(e)}}var ko="";function Do(e){ko=e}var Oo=null;"undefined"!=typeof MozWebSocket?Oo=MozWebSocket:"undefined"!=typeof WebSocket&&(Oo=WebSocket);var Ao=(Lo.connectionURL_=function(e,t,n){var r={v:"5"};return"undefined"!=typeof location&&location.hostname&&at.test(location.hostname)&&(r.r="f"),t&&(r.s=t),n&&(r.ls=n),dt(e,ut,r)},Lo.prototype.open=function(t,e){var n,r=this;this.onDisconnect=e,this.onMessage=t,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,ve.set("previous_websocket_failure",!0);try{C()||(n={headers:{"X-Firebase-GMPID":this.applicationId||""}},this.mySock=new Oo(this.connURL,[],n))}catch(e){this.log_("Error instantiating WebSocket.");t=e.message||e.data;return t&&this.log_(t),void this.onClosed_()}this.mySock.onopen=function(){r.log_("Websocket connected."),r.everConnected_=!0},this.mySock.onclose=function(){r.log_("Websocket connection was disconnected."),r.mySock=null,r.onClosed_()},this.mySock.onmessage=function(e){r.handleIncomingFrame(e)},this.mySock.onerror=function(e){r.log_("WebSocket error.  Closing connection.");e=e.message||e.data;e&&r.log_(e),r.onClosed_()}},Lo.prototype.start=function(){},Lo.forceDisallow=function(){Lo.forceDisallow_=!0},Lo.isAvailable=function(){var e,t=!1;return"undefined"!=typeof navigator&&navigator.userAgent&&((e=navigator.userAgent.match(/Android ([0-9]{0,}\.[0-9]{0,})/))&&1<e.length&&parseFloat(e[1])<4.4&&(t=!0)),!t&&null!==Oo&&!Lo.forceDisallow_},Lo.previouslyFailed=function(){return ve.isInMemoryStorage||!0===ve.get("previous_websocket_failure")},Lo.prototype.markConnectionHealthy=function(){ve.remove("previous_websocket_failure")},Lo.prototype.appendFrame_=function(e){this.frames.push(e),this.frames.length===this.totalFrames&&(e=this.frames.join(""),this.frames=null,e=R(e),this.onMessage(e))},Lo.prototype.handleNewFrameCount_=function(e){this.totalFrames=e,this.frames=[]},Lo.prototype.extractFrameCount_=function(e){if(g(null===this.frames,"We already have a frame buffer"),e.length<=6){var t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e},Lo.prototype.handleIncomingFrame=function(e){null!==this.mySock&&(e=e.data,this.bytesReceived+=e.length,this.stats_.incrementCounter("bytes_received",e.length),this.resetKeepAlive(),null!==this.frames?this.appendFrame_(e):null!==(e=this.extractFrameCount_(e))&&this.appendFrame_(e))},Lo.prototype.send=function(e){this.resetKeepAlive();e=x(e);this.bytesSent+=e.length,this.stats_.incrementCounter("bytes_sent",e.length);var t=fe(e,16384);1<t.length&&this.sendString_(String(t.length));for(var n=0;n<t.length;n++)this.sendString_(t[n])},Lo.prototype.shutdown_=function(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)},Lo.prototype.onClosed_=function(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))},Lo.prototype.close=function(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())},Lo.prototype.resetKeepAlive=function(){var e=this;clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(function(){e.mySock&&e.sendString_("0"),e.resetKeepAlive()},Math.floor(45e3))},Lo.prototype.sendString_=function(e){try{this.mySock.send(e)}catch(e){this.log_("Exception thrown from WebSocket.send():",e.message||e.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}},Lo.responsesRequiredToBeHealthy=2,Lo.healthyTimeout=3e4,Lo);function Lo(e,t,n,r,i){this.connId=e,this.applicationId=n,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=Te(this.connId),this.stats_=oo(t),this.connURL=Lo.connectionURL_(t,r,i),this.nodeAdmin=t.nodeAdmin}var Mo=(Object.defineProperty(Fo,"ALL_TRANSPORTS",{get:function(){return[Po,Ao]},enumerable:!1,configurable:!0}),Fo.prototype.initTransports_=function(e){var t,n,r=Ao&&Ao.isAvailable(),i=r&&!Ao.previouslyFailed();if(e.webSocketOnly&&(r||Pe("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),i=!0),i)this.transports_=[Ao];else{var o=this.transports_=[];try{for(var s=_(Fo.ALL_TRANSPORTS),a=s.next();!a.done;a=s.next()){var u=a.value;u&&u.isAvailable()&&o.push(u)}}catch(e){t={error:e}}finally{try{a&&!a.done&&(n=s.return)&&n.call(s)}finally{if(t)throw t.error}}}},Fo.prototype.initialTransport=function(){if(0<this.transports_.length)return this.transports_[0];throw new Error("No transports available")},Fo.prototype.upgradeTransport=function(){return 1<this.transports_.length?this.transports_[1]:null},Fo);function Fo(e){this.initTransports_(e)}var qo=(Wo.prototype.start_=function(){var e=this,t=this.transportManager_.initialTransport();this.conn_=new t(this.nextTransportId_(),this.repoInfo_,this.applicationId_,void 0,this.lastSessionId),this.primaryResponsesRequired_=t.responsesRequiredToBeHealthy||0;var n=this.connReceiver_(this.conn_),r=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(function(){e.conn_&&e.conn_.open(n,r)},Math.floor(0));t=t.healthyTimeout||0;0<t&&(this.healthyTimeout_=Ae(function(){e.healthyTimeout_=null,e.isHealthy_||(e.conn_&&102400<e.conn_.bytesReceived?(e.log_("Connection exceeded healthy timeout but has received "+e.conn_.bytesReceived+" bytes.  Marking connection healthy."),e.isHealthy_=!0,e.conn_.markConnectionHealthy()):e.conn_&&10240<e.conn_.bytesSent?e.log_("Connection exceeded healthy timeout but has sent "+e.conn_.bytesSent+" bytes.  Leaving connection alive."):(e.log_("Closing unhealthy connection after timeout."),e.close()))},Math.floor(t)))},Wo.prototype.nextTransportId_=function(){return"c:"+this.id+":"+this.connectionCount++},Wo.prototype.disconnReceiver_=function(t){var n=this;return function(e){t===n.conn_?n.onConnectionLost_(e):t===n.secondaryConn_?(n.log_("Secondary connection lost."),n.onSecondaryConnectionLost_()):n.log_("closing an old connection")}},Wo.prototype.connReceiver_=function(t){var n=this;return function(e){2!==n.state_&&(t===n.rx_?n.onPrimaryMessageReceived_(e):t===n.secondaryConn_?n.onSecondaryMessageReceived_(e):n.log_("message on old connection"))}},Wo.prototype.sendRequest=function(e){e={t:"d",d:e};this.sendData_(e)},Wo.prototype.tryCleanupConnection=function(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)},Wo.prototype.onSecondaryControl_=function(e){"t"in e&&("a"===(e=e.t)?this.upgradeIfSecondaryHealthy_():"r"===e?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),this.tx_!==this.secondaryConn_&&this.rx_!==this.secondaryConn_||this.close()):"o"===e&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_()))},Wo.prototype.onSecondaryMessageReceived_=function(e){var t=pe("t",e),e=pe("d",e);if("c"===t)this.onSecondaryControl_(e);else{if("d"!==t)throw new Error("Unknown protocol layer: "+t);this.pendingDataMessages.push(e)}},Wo.prototype.upgradeIfSecondaryHealthy_=function(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:"p",d:{}}}))},Wo.prototype.proceedWithUpgrade_=function(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:"a",d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:"n",d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()},Wo.prototype.onPrimaryMessageReceived_=function(e){var t=pe("t",e),e=pe("d",e);"c"===t?this.onControl_(e):"d"===t&&this.onDataMessage_(e)},Wo.prototype.onDataMessage_=function(e){this.onPrimaryResponse_(),this.onMessage_(e)},Wo.prototype.onPrimaryResponse_=function(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))},Wo.prototype.onControl_=function(e){var t=pe("t",e);if("d"in e){e=e.d;if("h"===t)this.onHandshake_(e);else if("n"===t){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(var n=0;n<this.pendingDataMessages.length;++n)this.onDataMessage_(this.pendingDataMessages[n]);this.pendingDataMessages=[],this.tryCleanupConnection()}else"s"===t?this.onConnectionShutdown_(e):"r"===t?this.onReset_(e):"e"===t?he("Server Error: "+e):"o"===t?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):he("Unknown control packet command: "+t)}},Wo.prototype.onHandshake_=function(e){var t=e.ts,n=e.v,r=e.h;this.sessionId=e.s,this.repoInfo_.host=r,0===this.state_&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),"5"!==n&&Pe("Protocol version mismatch detected"),this.tryStartUpgrade_())},Wo.prototype.tryStartUpgrade_=function(){var e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)},Wo.prototype.startUpgrade_=function(e){var t=this;this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;var n=this.connReceiver_(this.secondaryConn_),e=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(n,e),Ae(function(){t.secondaryConn_&&(t.log_("Timed out trying to upgrade."),t.secondaryConn_.close())},Math.floor(6e4))},Wo.prototype.onReset_=function(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,1===this.state_?this.close():(this.closeConnections_(),this.start_())},Wo.prototype.onConnectionEstablished_=function(e,t){var n=this;this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),0===this.primaryResponsesRequired_?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Ae(function(){n.sendPingOnPrimaryIfNecessary_()},Math.floor(5e3))},Wo.prototype.sendPingOnPrimaryIfNecessary_=function(){this.isHealthy_||1!==this.state_||(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:"p",d:{}}}))},Wo.prototype.onSecondaryConnectionLost_=function(){var e=this.secondaryConn_;this.secondaryConn_=null,this.tx_!==e&&this.rx_!==e||this.close()},Wo.prototype.onConnectionLost_=function(e){this.conn_=null,e||0!==this.state_?1===this.state_&&this.log_("Realtime connection lost."):(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(ve.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)),this.close()},Wo.prototype.onConnectionShutdown_=function(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()},Wo.prototype.sendData_=function(e){if(1!==this.state_)throw"Connection is not connected";this.tx_.send(e)},Wo.prototype.close=function(){2!==this.state_&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))},Wo.prototype.closeConnections_=function(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)},Wo);function Wo(e,t,n,r,i,o,s,a){this.id=e,this.repoInfo_=t,this.applicationId_=n,this.onMessage_=r,this.onReady_=i,this.onDisconnect_=o,this.onKill_=s,this.lastSessionId=a,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=Te("c:"+this.id+":"),this.transportManager_=new Mo(t),this.log_("Connection created"),this.start_()}Qo.prototype.put=function(e,t,n,r){},Qo.prototype.merge=function(e,t,n,r){},Qo.prototype.refreshAuthToken=function(e){},Qo.prototype.onDisconnectPut=function(e,t,n){},Qo.prototype.onDisconnectMerge=function(e,t,n){},Qo.prototype.onDisconnectCancel=function(e,t){},Qo.prototype.reportStats=function(e){},G=Qo;function Qo(){}var jo,Uo=1e3,Bo=3e5,Ho=(n(Vo,jo=G),Vo.prototype.sendRequest=function(e,t,n){var r=++this.requestNumber_,t={r:r,a:e,b:t};this.log_(x(t)),g(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(t),n&&(this.requestCBHash_[r]=n)},Vo.prototype.get=function(e){var n=this,r=new f,i={p:e.path.toString(),q:e.queryObject()},t={action:"g",request:i,onComplete:function(e){var t=e.d;"ok"===e.s?(n.onDataUpdate_(i.p,t,!1,null),r.resolve(t)):r.reject(t)}};this.outstandingGets_.push(t),this.outstandingGetCount_++;var o=this.outstandingGets_.length-1;return this.connected_||setTimeout(function(){var e=n.outstandingGets_[o];void 0!==e&&t===e&&(delete n.outstandingGets_[o],n.outstandingGetCount_--,0===n.outstandingGetCount_&&(n.outstandingGets_=[]),n.log_("get "+o+" timed out on connection"),r.reject(new Error("Client is offline.")))},3e3),this.connected_&&this.sendGet_(o),r.promise},Vo.prototype.listen=function(e,t,n,r){var i=e.queryIdentifier(),o=e.path.toString();this.log_("Listen called for "+o+" "+i),this.listens.has(o)||this.listens.set(o,new Map),g(e.getQueryParams().isDefault()||!e.getQueryParams().loadsAllData(),"listen() called for non-default but complete query"),g(!this.listens.get(o).has(i),"listen() called twice for same path/queryId.");n={onComplete:r,hashFn:t,query:e,tag:n};this.listens.get(o).set(i,n),this.connected_&&this.sendListen_(n)},Vo.prototype.sendGet_=function(t){var n=this,r=this.outstandingGets_[t];this.sendRequest("g",r.request,function(e){delete n.outstandingGets_[t],n.outstandingGetCount_--,0===n.outstandingGetCount_&&(n.outstandingGets_=[]),r.onComplete&&r.onComplete(e)})},Vo.prototype.sendListen_=function(r){var i=this,o=r.query,s=o.path.toString(),a=o.queryIdentifier();this.log_("Listen on "+s+" for "+a);var e={p:s};r.tag&&(e.q=o.queryObject(),e.t=r.tag),e.h=r.hashFn(),this.sendRequest("q",e,function(e){var t=e.d,n=e.s;Vo.warnOnListenWarnings_(t,o),(i.listens.get(s)&&i.listens.get(s).get(a))===r&&(i.log_("listen response",e),"ok"!==n&&i.removeListen_(s,a),r.onComplete&&r.onComplete(n,t))})},Vo.warnOnListenWarnings_=function(e,t){e&&"object"==typeof e&&D(e,"w")&&(e=O(e,"w"),Array.isArray(e)&&~e.indexOf("no_index")&&(e='".indexOn": "'+t.getQueryParams().getIndex().toString()+'"',t=t.path.toString(),Pe("Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding "+e+" at "+t+" to your security rules for better performance.")))},Vo.prototype.refreshAuthToken=function(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},function(){}),this.reduceReconnectDelayIfAdminCredential_(e)},Vo.prototype.reduceReconnectDelayIfAdminCredential_=function(e){(e&&40===e.length||function(e){e=k(e).claims;return"object"==typeof e&&!0===e.admin}(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=3e4)},Vo.prototype.tryAuth=function(){var n,e,t,r=this;this.connected_&&this.authToken_&&(e=function(e){e=k(e).claims;return!!e&&"object"==typeof e&&e.hasOwnProperty("iat")}(n=this.authToken_)?"auth":"gauth",t={cred:n},null===this.authOverride_?t.noauth=!0:"object"==typeof this.authOverride_&&(t.authvar=this.authOverride_),this.sendRequest(e,t,function(e){var t=e.s,e=e.d||"error";r.authToken_===n&&("ok"===t?r.invalidAuthTokenCount_=0:r.onAuthRevoked_(t,e))}))},Vo.prototype.unlisten=function(e,t){var n=e.path.toString(),r=e.queryIdentifier();this.log_("Unlisten called for "+n+" "+r),g(e.getQueryParams().isDefault()||!e.getQueryParams().loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(n,r)&&this.connected_&&this.sendUnlisten_(n,r,e.queryObject(),t)},Vo.prototype.sendUnlisten_=function(e,t,n,r){this.log_("Unlisten on "+e+" for "+t);e={p:e};r&&(e.q=n,e.t=r),this.sendRequest("n",e)},Vo.prototype.onDisconnectPut=function(e,t,n){this.connected_?this.sendOnDisconnect_("o",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:n})},Vo.prototype.onDisconnectMerge=function(e,t,n){this.connected_?this.sendOnDisconnect_("om",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:n})},Vo.prototype.onDisconnectCancel=function(e,t){this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})},Vo.prototype.sendOnDisconnect_=function(e,t,n,r){n={p:t,d:n};this.log_("onDisconnect "+e,n),this.sendRequest(e,n,function(e){r&&setTimeout(function(){r(e.s,e.d)},Math.floor(0))})},Vo.prototype.put=function(e,t,n,r){this.putInternal("p",e,t,n,r)},Vo.prototype.merge=function(e,t,n,r){this.putInternal("m",e,t,n,r)},Vo.prototype.putInternal=function(e,t,n,r,i){n={p:t,d:n};void 0!==i&&(n.h=i),this.outstandingPuts_.push({action:e,request:n,onComplete:r}),this.outstandingPutCount_++;r=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(r):this.log_("Buffering put: "+t)},Vo.prototype.sendPut_=function(t){var n=this,r=this.outstandingPuts_[t].action,e=this.outstandingPuts_[t].request,i=this.outstandingPuts_[t].onComplete;this.outstandingPuts_[t].queued=this.connected_,this.sendRequest(r,e,function(e){n.log_(r+" response",e),delete n.outstandingPuts_[t],n.outstandingPutCount_--,0===n.outstandingPutCount_&&(n.outstandingPuts_=[]),i&&i(e.s,e.d)})},Vo.prototype.reportStats=function(e){var t=this;this.connected_&&(e={c:e},this.log_("reportStats",e),this.sendRequest("s",e,function(e){"ok"!==e.s&&(e=e.d,t.log_("reportStats","Error sending stats: "+e))}))},Vo.prototype.onDataMessage_=function(e){if("r"in e){this.log_("from server: "+x(e));var t=e.r,n=this.requestCBHash_[t];n&&(delete this.requestCBHash_[t],n(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}},Vo.prototype.onDataPush_=function(e,t){this.log_("handleServerMessage",e,t),"d"===e?this.onDataUpdate_(t.p,t.d,!1,t.t):"m"===e?this.onDataUpdate_(t.p,t.d,!0,t.t):"c"===e?this.onListenRevoked_(t.p,t.q):"ac"===e?this.onAuthRevoked_(t.s,t.d):"sd"===e?this.onSecurityDebugPacket_(t):he("Unrecognized action received from server: "+x(e)+"\nAre you using the latest client?")},Vo.prototype.onReady_=function(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=(new Date).getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)},Vo.prototype.scheduleConnect_=function(e){var t=this;g(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(function(){t.establishConnectionTimer_=null,t.establishConnection_()},Math.floor(e))},Vo.prototype.onVisible_=function(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Uo,this.realtime_||this.scheduleConnect_(0)),this.visible_=e},Vo.prototype.onOnline_=function(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Uo,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())},Vo.prototype.onRealtimeDisconnect_=function(){var e;this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()&&(this.visible_?this.lastConnectionEstablishedTime_&&(3e4<(new Date).getTime()-this.lastConnectionEstablishedTime_&&(this.reconnectDelay_=Uo),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=(new Date).getTime()),e=(new Date).getTime()-this.lastConnectionAttemptTime_,e=Math.max(0,this.reconnectDelay_-e),e=Math.random()*e,this.log_("Trying to reconnect in "+e+"ms"),this.scheduleConnect_(e),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,1.3*this.reconnectDelay_)),this.onConnectStatus_(!1)},Vo.prototype.establishConnection_=function(){var t,n,r,i,o,s,a,u,l,e,h=this;this.shouldReconnect_()&&(this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=(new Date).getTime(),this.lastConnectionEstablishedTime_=null,t=this.onDataMessage_.bind(this),n=this.onReady_.bind(this),r=this.onRealtimeDisconnect_.bind(this),i=this.id+":"+Vo.nextConnectionId_++,s=(o=this).lastSessionId,a=!1,u=null,l=function(){u?u.close():(a=!0,r())},this.realtime_={close:l,sendRequest:function(e){g(u,"sendRequest call when we're not connected not allowed."),u.sendRequest(e)}},e=this.forceTokenRefresh_,this.forceTokenRefresh_=!1,this.authTokenProvider_.getToken(e).then(function(e){a?Se("getToken() completed but was canceled"):(Se("getToken() completed. Creating connection."),o.authToken_=e&&e.accessToken,u=new qo(i,o.repoInfo_,o.applicationId_,t,n,r,function(e){Pe(e+" ("+o.repoInfo_.toString()+")"),o.interrupt("server_kill")},s))}).then(null,function(e){o.log_("Failed to get token: "+e),a||(h.repoInfo_.nodeAdmin&&Pe(e),l())}))},Vo.prototype.interrupt=function(e){Se("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())},Vo.prototype.resume=function(e){Se("Resuming connection for reason: "+e),delete this.interruptReasons_[e],A(this.interruptReasons_)&&(this.reconnectDelay_=Uo,this.realtime_||this.scheduleConnect_(0))},Vo.prototype.handleTimestamp_=function(e){e-=(new Date).getTime();this.onServerInfoUpdate_({serverTimeOffset:e})},Vo.prototype.cancelSentTransactions_=function(){for(var e=0;e<this.outstandingPuts_.length;e++){var t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}0===this.outstandingPutCount_&&(this.outstandingPuts_=[])},Vo.prototype.onListenRevoked_=function(e,t){t=t?t.map(function(e){return ke(e)}).join("$"):"default",t=this.removeListen_(e,t);t&&t.onComplete&&t.onComplete("permission_denied")},Vo.prototype.removeListen_=function(e,t){var n,r=new Be(e).toString();return this.listens.has(r)?(n=(e=this.listens.get(r)).get(t),e.delete(t),0===e.size&&this.listens.delete(r)):n=void 0,n},Vo.prototype.onAuthRevoked_=function(e,t){Se("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),"invalid_token"!==e&&"permission_denied"!==e||(this.invalidAuthTokenCount_++,3<=this.invalidAuthTokenCount_&&(this.reconnectDelay_=3e4,this.authTokenProvider_.notifyForInvalidToken()))},Vo.prototype.onSecurityDebugPacket_=function(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace("\n","\nFIREBASE: "))},Vo.prototype.restoreState_=function(){var t,e,n,r;this.tryAuth();try{for(var i=_(this.listens.values()),o=i.next();!o.done;o=i.next()){var s=o.value;try{for(var a=(n=void 0,_(s.values())),u=a.next();!u.done;u=a.next()){var l=u.value;this.sendListen_(l)}}catch(e){n={error:e}}finally{try{u&&!u.done&&(r=a.return)&&r.call(a)}finally{if(n)throw n.error}}}}catch(e){t={error:e}}finally{try{o&&!o.done&&(e=i.return)&&e.call(i)}finally{if(t)throw t.error}}for(var h=0;h<this.outstandingPuts_.length;h++)this.outstandingPuts_[h]&&this.sendPut_(h);for(;this.onDisconnectRequestQueue_.length;){var c=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(c.action,c.pathString,c.data,c.onComplete)}for(h=0;h<this.outstandingGets_.length;h++)this.outstandingGets_[h]&&this.sendGet_(h)},Vo.prototype.sendConnectStats_=function(){var e={};e["sdk.js."+ko.replace(/\./g,"-")]=1,w()?e["framework.cordova"]=1:"object"==typeof navigator&&"ReactNative"===navigator.product&&(e["framework.reactnative"]=1),this.reportStats(e)},Vo.prototype.shouldReconnect_=function(){var e=Co.getInstance().currentlyOnline();return A(this.interruptReasons_)&&e},Vo.nextPersistentConnectionId_=0,Vo.nextConnectionId_=0,Vo);function Vo(e,t,n,r,i,o,s){var a=jo.call(this)||this;if(a.repoInfo_=e,a.applicationId_=t,a.onDataUpdate_=n,a.onConnectStatus_=r,a.onServerInfoUpdate_=i,a.authTokenProvider_=o,a.authOverride_=s,a.id=Vo.nextPersistentConnectionId_++,a.log_=Te("p:"+a.id+":"),a.interruptReasons_={},a.listens=new Map,a.outstandingPuts_=[],a.outstandingGets_=[],a.outstandingPutCount_=0,a.outstandingGetCount_=0,a.onDisconnectRequestQueue_=[],a.connected_=!1,a.reconnectDelay_=Uo,a.maxReconnectDelay_=Bo,a.securityDebugCallback_=null,a.lastSessionId=null,a.establishConnectionTimer_=null,a.visible_=!1,a.requestCBHash_={},a.requestNumber_=0,a.realtime_=null,a.authToken_=null,a.forceTokenRefresh_=!1,a.invalidAuthTokenCount_=0,a.firstConnection_=!0,a.lastConnectionAttemptTime_=null,a.lastConnectionEstablishedTime_=null,s&&!C())throw new Error("Auth override specified in options, but not supported on non Node.js platforms");return a.scheduleConnect_(0),go.getInstance().on("visible",a.onVisible_,a),-1===e.host.indexOf("fblocal")&&Co.getInstance().on("online",a.onOnline_,a),a}var zo,Ko=(n(Yo,zo=G),Yo.prototype.reportStats=function(e){throw new Error("Method not implemented.")},Yo.getListenId_=function(e,t){return void 0!==t?"tag$"+t:(g(e.getQueryParams().isDefault(),"should have a tag if it's not a default query."),e.path.toString())},Yo.prototype.listen=function(e,t,n,r){var i=this,o=e.path.toString();this.log_("Listen called for "+o+" "+e.queryIdentifier());var s=Yo.getListenId_(e,n),a={};this.listens_[s]=a;e=ti(e.getQueryParams());this.restRequest_(o+".json",e,function(e,t){null===(e=404===e?t=null:e)&&i.onDataUpdate_(o,t,!1,n),O(i.listens_,s)===a&&r(e?401===e?"permission_denied":"rest_error:"+e:"ok",null)})},Yo.prototype.unlisten=function(e,t){t=Yo.getListenId_(e,t);delete this.listens_[t]},Yo.prototype.get=function(e){var n=this,t=ti(e.getQueryParams()),r=e.path.toString(),i=new f;return this.restRequest_(r+".json",t,function(e,t){null===(e=404===e?t=null:e)?(n.onDataUpdate_(r,t,!1,null),i.resolve(t)):i.reject(new Error(t))}),i.promise},Yo.prototype.refreshAuthToken=function(e){},Yo.prototype.restRequest_=function(r,i,o){var s=this;(i=void 0===i?{}:i).format="export",this.authTokenProvider_.getToken(!1).then(function(e){e=e&&e.accessToken;e&&(i.auth=e);var t=(s.repoInfo_.secure?"https://":"http://")+s.repoInfo_.host+r+"?ns="+s.repoInfo_.namespace+M(i);s.log_("Sending REST request for "+t);var n=new XMLHttpRequest;n.onreadystatechange=function(){if(o&&4===n.readyState){s.log_("REST Response for "+t+" received. status:",n.status,"response:",n.responseText);var e=null;if(200<=n.status&&n.status<300){try{e=R(n.responseText)}catch(e){Pe("Failed to parse JSON response for "+t+": "+n.responseText)}o(null,e)}else 401!==n.status&&404!==n.status&&Pe("Got unsuccessful REST response for "+t+" Status: "+n.status),o(n.status);o=null}},n.open("GET",t,!0),n.send()})},Yo);function Yo(e,t,n){var r=zo.call(this)||this;return r.repoInfo_=e,r.onDataUpdate_=t,r.authTokenProvider_=n,r.log_=Te("p:rest:"),r.listens_={},r}var Go=($o.prototype.val=function(){return W("DataSnapshot.val",0,0,arguments.length),this.node_.val()},$o.prototype.exportVal=function(){return W("DataSnapshot.exportVal",0,0,arguments.length),this.node_.val(!0)},$o.prototype.toJSON=function(){return W("DataSnapshot.toJSON",0,1,arguments.length),this.exportVal()},$o.prototype.exists=function(){return W("DataSnapshot.exists",0,0,arguments.length),!this.node_.isEmpty()},$o.prototype.child=function(e){W("DataSnapshot.child",0,1,arguments.length),e=String(e),Ct("DataSnapshot.child",1,e,!1);var t=new Be(e),e=this.ref_.child(t);return new $o(this.node_.getChild(t),e,Xt)},$o.prototype.hasChild=function(e){W("DataSnapshot.hasChild",1,1,arguments.length),Ct("DataSnapshot.hasChild",1,e,!1);e=new Be(e);return!this.node_.getChild(e).isEmpty()},$o.prototype.getPriority=function(){return W("DataSnapshot.getPriority",0,0,arguments.length),this.node_.getPriority().val()},$o.prototype.forEach=function(n){var r=this;return W("DataSnapshot.forEach",1,1,arguments.length),j("DataSnapshot.forEach",1,n,!1),!this.node_.isLeafNode()&&!!this.node_.forEachChild(this.index_,function(e,t){return n(new $o(t,r.ref_.child(e),Xt))})},$o.prototype.hasChildren=function(){return W("DataSnapshot.hasChildren",0,0,arguments.length),!this.node_.isLeafNode()&&!this.node_.isEmpty()},Object.defineProperty($o.prototype,"key",{get:function(){return this.ref_.getKey()},enumerable:!1,configurable:!0}),$o.prototype.numChildren=function(){return W("DataSnapshot.numChildren",0,0,arguments.length),this.node_.numChildren()},$o.prototype.getRef=function(){return W("DataSnapshot.ref",0,0,arguments.length),this.ref_},Object.defineProperty($o.prototype,"ref",{get:function(){return this.getRef()},enumerable:!1,configurable:!0}),$o);function $o(e,t,n){this.node_=e,this.ref_=t,this.index_=n}var Jo=function(e,t,n){void 0===e&&(e=""),void 0===t&&(t=null),void 0===n&&(n={children:{},childCount:0}),this.name=e,this.parent=t,this.node=n};function Xo(e,t){for(var n=t instanceof Be?t:new Be(t),r=e,i=ze(n);null!==i;)var o=O(r.node.children,i)||{children:{},childCount:0},r=new Jo(i,r,o),i=ze(n=Ye(n));return r}function Zo(e){return e.node.value}function es(e,t){e.node.value=t,is(e)}function ts(e){return 0<e.node.childCount}function ns(n,r){De(n.node.children,function(e,t){r(new Jo(e,n,t))})}function rs(e){return new Be(null===e.parent?e.name:rs(e.parent)+"/"+e.name)}function is(e){var t,n,r,i;null!==e.parent&&(t=e.parent,n=e.name,i=function(e){return void 0===Zo(e)&&!ts(e)}(r=e),e=D(t.node.children,n),i&&e?(delete t.node.children[n],t.node.childCount--,is(t)):i||e||(t.node.children[n]=r.node,t.node.childCount++,is(t)))}var os="repo_interrupt",ss=25,as=(us.prototype.toString=function(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host},us);function us(e,t,n,r){this.repoInfo_=e,this.forceRestClient_=t,this.app=n,this.authTokenProvider_=r,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new ho,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=$i(),this.transactionQueueTree_=new Jo,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}function ls(s){if(s.stats_=oo(s.repoInfo_),s.forceRestClient_||0<=("object"==typeof window&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i))s.server_=new Ko(s.repoInfo_,function(e,t,n,r){ds(s,e,t,n,r)},s.authTokenProvider_),setTimeout(function(){return ps(s,!0)},0);else{var e=s.app.options.databaseAuthVariableOverride;if(null!=e){if("object"!=typeof e)throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{x(e)}catch(e){throw new Error("Invalid authOverride provided: "+e)}}s.persistentConnection_=new Ho(s.repoInfo_,s.app.options.appId,function(e,t,n,r){ds(s,e,t,n,r)},function(e){ps(s,e)},function(e){var n;n=s,De(e,function(e,t){fs(n,e,t)})},s.authTokenProvider_,e),s.server_=s.persistentConnection_}var t,n;s.authTokenProvider_.addTokenChangeListener(function(e){s.server_.refreshAuthToken(e)}),s.statsReporter_=(t=s.repoInfo_,n=function(){return new uo(s.stats_,s.server_)},t=t.toString(),io[t]||(io[t]=n()),io[t]),s.infoData_=new Zi,s.infoSyncTree_=new Ci({startListening:function(e,t,n,r){var i=[],o=s.infoData_.getNode(e.path);return o.isEmpty()||(i=Ti(s.infoSyncTree_,e.path,o),setTimeout(function(){r("ok")},0)),i},stopListening:function(){}}),fs(s,"connected",!1),s.serverSyncTree_=new Ci({startListening:function(n,e,t,r){return s.server_.listen(n,t,e,function(e,t){t=r(e,t);fo(s.eventQueue_,n.path,t)}),[]},stopListening:function(e,t){s.server_.unlisten(e,t)}})}function hs(e){e=e.infoData_.getNode(new Be(".info/serverTimeOffset")).val()||0;return(new Date).getTime()+e}function cs(e){return Bi({timestamp:hs(e)})}function ds(e,t,n,r,i){e.dataUpdateCount++;var o=new Be(t);n=e.interceptServerDataCallback_?e.interceptServerDataCallback_(t,n):n;var s,a,u,l=[],h=o;0<(l=i?r?(s=L(n,function(e){return wn(e)}),function(e,t,n,r){var i=Li(e,r);if(i){r=Mi(i),i=r.path,r=r.queryId,t=et(i,t),n=Pn.fromObject(n);return Fi(e,i,new On(En(r),t,n))}return[]}(e.serverSyncTree_,o,s,i)):(t=wn(n),s=e.serverSyncTree_,a=o,u=t,null==(i=Li(s,t=i))?[]:(t=Mi(i),i=t.path,t=t.queryId,a=et(i,a),Fi(s,i,new kn(En(t),a,u)))):r?(a=L(n,function(e){return wn(e)}),u=e.serverSyncTree_,r=o,a=a,a=Pn.fromObject(a),xi(u,new On(bn(),r,a))):(n=wn(n),Ti(e.serverSyncTree_,o,n))).length&&(h=Is(e,o)),fo(e.eventQueue_,h,l)}function ps(e,t){fs(e,"connected",t),!1===t&&function(n){Cs(n,"onDisconnectEvents");var r=cs(n),i=$i();Xi(n.onDisconnect_,Ve(),function(e,t){t=Ki(e,t,n.serverSyncTree_,r);Ji(i,e,t)});var o=[];Xi(i,Ve(),function(e,t){o=o.concat(Ti(n.serverSyncTree_,e,t));e=xs(n,e);Is(n,e)}),n.onDisconnect_=$i(),fo(n.eventQueue_,Ve(),o)}(e)}function fs(e,t,n){t=new Be("/.info/"+t),n=wn(n);e.infoData_.updateSnapshot(t,n);n=Ti(e.infoSyncTree_,t,n);fo(e.eventQueue_,t,n)}function _s(e){return e.nextWriteId_++}function ys(r,i,e,t,o){Cs(r,"set",{path:i.toString(),value:e,priority:t});var n=cs(r),e=wn(e,t),t=Ni(r.serverSyncTree_,i),n=Yi(e,t,n),s=_s(r),n=bi(r.serverSyncTree_,i,n,s,!0);co(r.eventQueue_,n),r.server_.put(i.toString(),e.val(!0),function(e,t){var n="ok"===e;n||Pe("set at "+i+" failed: "+e);n=Si(r.serverSyncTree_,s,!n);fo(r.eventQueue_,i,n),bs(0,o,e,t)});e=xs(r,i);Is(r,e),fo(r.eventQueue_,e,[])}function vs(n,r,i){n.server_.onDisconnectCancel(r.toString(),function(e,t){"ok"===e&&!function e(n,t){if(Ze(t))return n.value=null,n.children.clear(),!0;if(null!==n.value){if(n.value.isLeafNode())return!1;var r=n.value;return n.value=null,r.forEachChild(Xt,function(e,t){Ji(n,new Be(e),t)}),e(n,t)}if(0<n.children.size)return r=ze(t),t=Ye(t),n.children.has(r)&&e(n.children.get(r),t)&&n.children.delete(r),0===n.children.size;return!0}(n.onDisconnect_,r),bs(0,i,e,t)})}function gs(n,r,e,i){var o=wn(e);n.server_.onDisconnectPut(r.toString(),o.val(!0),function(e,t){"ok"===e&&Ji(n.onDisconnect_,r,o),bs(0,i,e,t)})}function ms(e,t,n){n=".info"===ze(t.path)?Pi(e.infoSyncTree_,t,n):Pi(e.serverSyncTree_,t,n);po(e.eventQueue_,t.path,n)}function ws(e){e.persistentConnection_&&e.persistentConnection_.interrupt(os)}function Cs(e){for(var t=[],n=1;n<arguments.length;n++)t[n-1]=arguments[n];var r="";e.persistentConnection_&&(r=e.persistentConnection_.id+":"),Se.apply(void 0,s([r],y(t)))}function bs(e,n,r,i){n&&Qe(function(){var e,t;"ok"===r?n(null):(t=e=(r||"error").toUpperCase(),i&&(t+=": "+i),(t=new Error(t)).code=e,n(t))})}function Es(e){return e.__database||(e.__database=new oa(e))}function Ss(e,t,n){return Ni(e.serverSyncTree_,t,n)||fn.EMPTY_NODE}function Ts(t,e){var n;(e=void 0===e?t.transactionQueueTree_:e)||Rs(t,e),Zo(e)?(n=Ns(t,e),g(0<n.length,"Sending zero length transaction queue"),n.every(function(e){return 0===e.status})&&function(s,a,u){for(var e=u.map(function(e){return e.currentWriteId}),t=Ss(s,a,e),n=t,e=t.hash(),r=0;r<u.length;r++){var i=u[r];g(0===i.status,"tryToSendTransactionQueue_: items in queue should all be run."),i.status=1,i.retryCount++;var o=et(a,i.path);n=n.updateChild(o,i.currentOutputSnapshotRaw)}var t=n.val(!0),l=a;s.server_.put(l.toString(),t,function(e){Cs(s,"transaction put response",{path:l.toString(),status:e});var t=[];if("ok"===e){for(var n,r,i=[],o=0;o<u.length;o++)u[o].status=2,t=t.concat(Si(s.serverSyncTree_,u[o].currentWriteId)),u[o].onComplete&&(n=u[o].currentOutputSnapshotResolved,r=new Gs(s,u[o].path),r=new Go(n,r,Xt),i.push(u[o].onComplete.bind(null,null,!0,r))),u[o].unwatcher();Rs(s,Xo(s.transactionQueueTree_,a)),Ts(s,s.transactionQueueTree_),fo(s.eventQueue_,a,t);for(o=0;o<i.length;o++)Qe(i[o])}else{if("datastale"===e)for(o=0;o<u.length;o++)3===u[o].status?u[o].status=4:u[o].status=0;else{Pe("transaction at "+l.toString()+" failed: "+e);for(o=0;o<u.length;o++)u[o].status=4,u[o].abortReason=e}Is(s,a)}},e)}(t,rs(e),n)):ts(e)&&ns(e,function(e){Ts(t,e)})}function Is(e,t){var n=Ps(e,t),t=rs(n);return function(e,t,n){if(0===t.length)return;for(var r=[],i=[],o=t.filter(function(e){return 0===e.status}).map(function(e){return e.currentWriteId}),s=0;s<t.length;s++){var a,u,l,h=t[s],c=et(n,h.path),d=!1,p=void 0;g(null!==c,"rerunTransactionsUnderNode_: relativePath should not be null."),4===h.status?(d=!0,p=h.abortReason,i=i.concat(Si(e.serverSyncTree_,h.currentWriteId,!0))):0===h.status&&(i=h.retryCount>=ss?(d=!0,p="maxretry",i.concat(Si(e.serverSyncTree_,h.currentWriteId,!0))):(a=Ss(e,h.path,o),h.currentInputSnapshot=a,void 0!==(l=t[s].update(a.val()))?(Rt("transaction failed: Data returned ",l,h.path),u=wn(l),"object"==typeof l&&null!=l&&D(l,".priority")||(u=u.updatePriority(a.getPriority())),c=h.currentWriteId,l=cs(e),l=Yi(u,a,l),h.currentOutputSnapshotRaw=u,h.currentOutputSnapshotResolved=l,h.currentWriteId=_s(e),o.splice(o.indexOf(c),1),(i=i.concat(bi(e.serverSyncTree_,h.path,l,h.currentWriteId,h.applyLocally))).concat(Si(e.serverSyncTree_,c,!0))):(d=!0,p="nodata",i.concat(Si(e.serverSyncTree_,h.currentWriteId,!0))))),fo(e.eventQueue_,n,i),i=[],d&&(t[s].status=2,function(e){setTimeout(e,Math.floor(0))}(t[s].unwatcher),t[s].onComplete&&("nodata"===p?(h=new Gs(e,t[s].path),d=t[s].currentInputSnapshot,h=new Go(d,h,Xt),r.push(t[s].onComplete.bind(null,null,!1,h))):r.push(t[s].onComplete.bind(null,new Error(p),!1,null))))}Rs(e,e.transactionQueueTree_);for(s=0;s<r.length;s++)Qe(r[s]);Ts(e,e.transactionQueueTree_)}(e,Ns(e,n),t),t}function Ps(e,t){for(var n=e.transactionQueueTree_,r=ze(t);null!==r&&void 0===Zo(n);)n=Xo(n,r),r=ze(t=Ye(t));return n}function Ns(e,t){var n=[];return function t(n,e,r){var i=Zo(e);if(i)for(var o=0;o<i.length;o++)r.push(i[o]);ns(e,function(e){t(n,e,r)})}(e,t,n),n.sort(function(e,t){return e.order-t.order}),n}function Rs(t,e){var n=Zo(e);if(n){for(var r=0,i=0;i<n.length;i++)2!==n[i].status&&(n[r]=n[i],r++);n.length=r,es(e,0<n.length?n:void 0)}ns(e,function(e){Rs(t,e)})}function xs(t,e){var n=rs(Ps(t,e)),e=Xo(t.transactionQueueTree_,e);return function(e,t,n){for(var r=n?e:e.parent;null!==r;){if(t(r))return;r=r.parent}}(e,function(e){ks(t,e)}),ks(t,e),function t(e,n,r,i){r&&!i&&n(e),ns(e,function(e){t(e,n,!0,i)}),r&&i&&n(e)}(e,function(e){ks(t,e)}),n}function ks(e,t){var n=Zo(t);if(n){for(var r=[],i=[],o=-1,s=0;s<n.length;s++)3===n[s].status||(1===n[s].status?(g(o===s-1,"All SENT items should be at beginning of queue."),n[o=s].status=3,n[s].abortReason="set"):(g(0===n[s].status,"Unexpected transaction status in abort"),n[s].unwatcher(),i=i.concat(Si(e.serverSyncTree_,n[s].currentWriteId,!0)),n[s].onComplete&&r.push(n[s].onComplete.bind(null,new Error("set"),!1,null))));-1===o?es(t,void 0):n.length=o+1,fo(e.eventQueue_,rs(t),i);for(s=0;s<r.length;s++)Qe(r[s])}}var Ds=(Os.prototype.cancel=function(e){W("OnDisconnect.cancel",0,1,arguments.length),j("OnDisconnect.cancel",1,e,!0);var t=new f;return vs(this.repo_,this.path_,t.wrapCallback(e)),t.promise},Os.prototype.remove=function(e){W("OnDisconnect.remove",0,1,arguments.length),bt("OnDisconnect.remove",this.path_),j("OnDisconnect.remove",1,e,!0);var t=new f;return gs(this.repo_,this.path_,null,t.wrapCallback(e)),t.promise},Os.prototype.set=function(e,t){W("OnDisconnect.set",1,2,arguments.length),bt("OnDisconnect.set",this.path_),yt("OnDisconnect.set",1,e,this.path_,!1),j("OnDisconnect.set",2,t,!0);var n=new f;return gs(this.repo_,this.path_,e,n.wrapCallback(t)),n.promise},Os.prototype.setWithPriority=function(e,t,n){W("OnDisconnect.setWithPriority",2,3,arguments.length),bt("OnDisconnect.setWithPriority",this.path_),yt("OnDisconnect.setWithPriority",1,e,this.path_,!1),gt("OnDisconnect.setWithPriority",2,t,!1),j("OnDisconnect.setWithPriority",3,n,!0);var r,i,o,s,a=new f;return r=this.repo_,i=this.path_,e=e,t=t,o=a.wrapCallback(n),s=wn(e,t),r.server_.onDisconnectPut(i.toString(),s.val(!0),function(e,t){"ok"===e&&Ji(r.onDisconnect_,i,s),bs(0,o,e,t)}),a.promise},Os.prototype.update=function(e,t){if(W("OnDisconnect.update",1,2,arguments.length),bt("OnDisconnect.update",this.path_),Array.isArray(e)){for(var n={},r=0;r<e.length;++r)n[""+r]=e[r];e=n,Pe("Passing an Array to firebase.database.onDisconnect().update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}vt("OnDisconnect.update",1,e,this.path_,!1),j("OnDisconnect.update",2,t,!0);var i=new f;return function(n,r,i,o){if(A(i))return Se("onDisconnect().update() called with empty data.  Don't do anything."),bs(0,o,"ok",void 0);n.server_.onDisconnectMerge(r.toString(),i,function(e,t){"ok"===e&&De(i,function(e,t){t=wn(t);Ji(n.onDisconnect_,Xe(r,e),t)}),bs(0,o,e,t)})}(this.repo_,this.path_,e,i.wrapCallback(t)),i.promise},Os);function Os(e,t){this.repo_=e,this.path_=t}var As=(Ls.prototype.toJSON=function(){return W("TransactionResult.toJSON",0,1,arguments.length),{committed:this.committed,snapshot:this.snapshot.toJSON()}},Ls);function Ls(e,t){this.committed=e,this.snapshot=t}var Ms=(Fs.prototype.getPath=function(){var e=this.snapshot.getRef();return("value"===this.eventType?e:e.getParent()).path},Fs.prototype.getEventType=function(){return this.eventType},Fs.prototype.getEventRunner=function(){return this.eventRegistration.getEventRunner(this)},Fs.prototype.toString=function(){return this.getPath().toString()+":"+this.eventType+":"+x(this.snapshot.exportVal())},Fs);function Fs(e,t,n,r){this.eventType=e,this.eventRegistration=t,this.snapshot=n,this.prevName=r}var qs=(Ws.prototype.getPath=function(){return this.path},Ws.prototype.getEventType=function(){return"cancel"},Ws.prototype.getEventRunner=function(){return this.eventRegistration.getEventRunner(this)},Ws.prototype.toString=function(){return this.path.toString()+":cancel"},Ws);function Ws(e,t,n){this.eventRegistration=e,this.error=t,this.path=n}var Qs=(js.prototype.respondsTo=function(e){return"value"===e},js.prototype.createEvent=function(e,t){var n=t.getQueryParams().getIndex();return new Ms("value",this,new Go(e.snapshotNode,t.getRef(),n))},js.prototype.getEventRunner=function(e){var t=this.context_;if("cancel"===e.getEventType()){g(this.cancelCallback_,"Raising a cancel event on a listener with no cancel callback");var n=this.cancelCallback_;return function(){n.call(t,e.error)}}var r=this.callback_;return function(){r.call(t,e.snapshot)}},js.prototype.createCancelEvent=function(e,t){return this.cancelCallback_?new qs(this,e,t):null},js.prototype.matches=function(e){return e instanceof js&&(!e.callback_||!this.callback_||e.callback_===this.callback_&&e.context_===this.context_)},js.prototype.hasAnyCallback=function(){return null!==this.callback_},js);function js(e,t,n){this.callback_=e,this.cancelCallback_=t,this.context_=n}var Us,Bs=(Hs.prototype.respondsTo=function(e){e="children_removed"===(e="children_added"===e?"child_added":e)?"child_removed":e;return D(this.callbacks_,e)},Hs.prototype.createCancelEvent=function(e,t){return this.cancelCallback_?new qs(this,e,t):null},Hs.prototype.createEvent=function(e,t){g(null!=e.childName,"Child events should have a childName.");var n=t.getRef().child(e.childName),t=t.getQueryParams().getIndex();return new Ms(e.type,this,new Go(e.snapshotNode,n,t),e.prevName)},Hs.prototype.getEventRunner=function(e){var t=this.context_;if("cancel"===e.getEventType()){g(this.cancelCallback_,"Raising a cancel event on a listener with no cancel callback");var n=this.cancelCallback_;return function(){n.call(t,e.error)}}var r=this.callbacks_[e.eventType];return function(){r.call(t,e.snapshot,e.prevName)}},Hs.prototype.matches=function(t){var n=this;if(t instanceof Hs){if(!this.callbacks_||!t.callbacks_)return!0;if(this.context_===t.context_){var e=Object.keys(t.callbacks_),r=Object.keys(this.callbacks_),i=e.length;if(i===r.length){if(1!==i)return r.every(function(e){return t.callbacks_[e]===n.callbacks_[e]});e=e[0],r=r[0];return!(r!==e||t.callbacks_[e]&&this.callbacks_[r]&&t.callbacks_[e]!==this.callbacks_[r])}}}return!1},Hs.prototype.hasAnyCallback=function(){return null!==this.callbacks_},Hs);function Hs(e,t,n){this.callbacks_=e,this.cancelCallback_=t,this.context_=n}var Vs=(Object.defineProperty(zs,"__referenceConstructor",{get:function(){return g(Us,"Reference.ts has not been loaded"),Us},set:function(e){Us=e},enumerable:!1,configurable:!0}),zs.validateQueryEndpoints_=function(e){var t=null,n=null;if(e.hasStart()&&(t=e.getIndexStartValue()),e.hasEnd()&&(n=e.getIndexEndValue()),e.getIndex()===en){var r="Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().",i="Query: When ordering by key, the argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() must be a string.";if(e.hasStart()){if(e.getIndexStartName()!==Ne)throw new Error(r);if("string"!=typeof t)throw new Error(i)}if(e.hasEnd()){if(e.getIndexEndName()!==Re)throw new Error(r);if("string"!=typeof n)throw new Error(i)}}else if(e.getIndex()===Xt){if(null!=t&&!_t(t)||null!=n&&!_t(n))throw new Error("Query: When ordering by priority, the first argument passed to startAt(), startAfter() endAt(), endBefore(), or equalTo() must be a valid priority value (null, a number, or a string).")}else if(g(e.getIndex()instanceof Hr||e.getIndex()===Br,"unknown index type."),null!=t&&"object"==typeof t||null!=n&&"object"==typeof n)throw new Error("Query: First argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() cannot be an object.")},zs.validateLimit_=function(e){if(e.hasStart()&&e.hasEnd()&&e.hasLimit()&&!e.hasAnchoredLimit())throw new Error("Query: Can't combine startAt(), startAfter(), endAt(), endBefore(), and limit(). Use limitToFirst() or limitToLast() instead.")},zs.prototype.validateNoPreviousOrderByCall_=function(e){if(!0===this.orderByCalled_)throw new Error(e+": You can't combine multiple orderBy calls.")},zs.prototype.getQueryParams=function(){return this.queryParams_},zs.prototype.getRef=function(){return W("Query.ref",0,0,arguments.length),new zs.__referenceConstructor(this.repo,this.path)},zs.prototype.on=function(e,t,n,r){W("Query.on",2,4,arguments.length),mt("Query.on",1,e,!1),j("Query.on",2,t,!1);n=zs.getCancelAndContextArgs_("Query.on",n,r);return"value"===e?this.onValueEvent(t,n.cancel,n.context):((r={})[e]=t,this.onChildEvent(r,n.cancel,n.context)),t},zs.prototype.onValueEvent=function(e,t,n){n=new Qs(e,t||null,n||null);ms(this.repo,this,n)},zs.prototype.onChildEvent=function(e,t,n){n=new Bs(e,t,n);ms(this.repo,this,n)},zs.prototype.off=function(e,t,n){W("Query.off",0,3,arguments.length),mt("Query.off",1,e,!0),j("Query.off",2,t,!0),U("Query.off",3,n,!0);var r=null,i=null;"value"===e?r=new Qs(t||null,null,n||null):e&&(t&&((i={})[e]=t),r=new Bs(i,null,n||null)),i=this.repo,n=r,n=".info"===ze((r=this).path)?Ii(i.infoSyncTree_,r,n):Ii(i.serverSyncTree_,r,n),po(i.eventQueue_,r.path,n)},zs.prototype.get=function(){return n=this.repo,r=this,null!=(e=Ri(n.serverSyncTree_,r))?Promise.resolve(new Go(e,r.getRef(),r.getQueryParams().getIndex())):n.server_.get(r).then(function(e){var t=wn(e),e=Ti(n.serverSyncTree_,r.path,t);return po(n.eventQueue_,r.path,e),Promise.resolve(new Go(t,r.getRef(),r.getQueryParams().getIndex()))},function(e){return Cs(n,"get for query "+x(r)+" failed: "+e),Promise.reject(new Error(e))});var n,r,e},zs.prototype.once=function(t,n,e,r){var i=this;W("Query.once",1,4,arguments.length),mt("Query.once",1,t,!1),j("Query.once",2,n,!0);var o=zs.getCancelAndContextArgs_("Query.once",e,r),s=!0,a=new f;a.promise.catch(function(){});var u=function(e){s&&(s=!1,i.off(t,u),n&&n.bind(o.context)(e),a.resolve(e))};return this.on(t,u,function(e){i.off(t,u),o.cancel&&o.cancel.bind(o.context)(e),a.reject(e)}),a.promise},zs.prototype.limitToFirst=function(e){if(W("Query.limitToFirst",1,1,arguments.length),"number"!=typeof e||Math.floor(e)!==e||e<=0)throw new Error("Query.limitToFirst: First argument must be a positive integer.");if(this.queryParams_.hasLimit())throw new Error("Query.limitToFirst: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");return new zs(this.repo,this.path,(t=this.queryParams_,e=e,(t=t.copy()).limitSet_=!0,t.limit_=e,t.viewFrom_="l",t),this.orderByCalled_);var t},zs.prototype.limitToLast=function(e){if(W("Query.limitToLast",1,1,arguments.length),"number"!=typeof e||Math.floor(e)!==e||e<=0)throw new Error("Query.limitToLast: First argument must be a positive integer.");if(this.queryParams_.hasLimit())throw new Error("Query.limitToLast: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");return new zs(this.repo,this.path,(t=this.queryParams_,e=e,(t=t.copy()).limitSet_=!0,t.limit_=e,t.viewFrom_="r",t),this.orderByCalled_);var t},zs.prototype.orderByChild=function(e){if(W("Query.orderByChild",1,1,arguments.length),"$key"===e)throw new Error('Query.orderByChild: "$key" is invalid.  Use Query.orderByKey() instead.');if("$priority"===e)throw new Error('Query.orderByChild: "$priority" is invalid.  Use Query.orderByPriority() instead.');if("$value"===e)throw new Error('Query.orderByChild: "$value" is invalid.  Use Query.orderByValue() instead.');Ct("Query.orderByChild",1,e,!1),this.validateNoPreviousOrderByCall_("Query.orderByChild");e=new Be(e);if(Ze(e))throw new Error("Query.orderByChild: cannot pass in empty path.  Use Query.orderByValue() instead.");e=new Hr(e),e=ei(this.queryParams_,e);return zs.validateQueryEndpoints_(e),new zs(this.repo,this.path,e,!0)},zs.prototype.orderByKey=function(){W("Query.orderByKey",0,0,arguments.length),this.validateNoPreviousOrderByCall_("Query.orderByKey");var e=ei(this.queryParams_,en);return zs.validateQueryEndpoints_(e),new zs(this.repo,this.path,e,!0)},zs.prototype.orderByPriority=function(){W("Query.orderByPriority",0,0,arguments.length),this.validateNoPreviousOrderByCall_("Query.orderByPriority");var e=ei(this.queryParams_,Xt);return zs.validateQueryEndpoints_(e),new zs(this.repo,this.path,e,!0)},zs.prototype.orderByValue=function(){W("Query.orderByValue",0,0,arguments.length),this.validateNoPreviousOrderByCall_("Query.orderByValue");var e=ei(this.queryParams_,Br);return zs.validateQueryEndpoints_(e),new zs(this.repo,this.path,e,!0)},zs.prototype.startAt=function(e,t){void 0===e&&(e=null),W("Query.startAt",0,2,arguments.length),yt("Query.startAt",1,e,this.path,!0),wt("Query.startAt",2,t,!0);var n=Xr(this.queryParams_,e,t);if(zs.validateLimit_(n),zs.validateQueryEndpoints_(n),this.queryParams_.hasStart())throw new Error("Query.startAt: Starting point was already set (by another call to startAt or equalTo).");return void 0===e&&(t=e=null),new zs(this.repo,this.path,n,this.orderByCalled_)},zs.prototype.startAfter=function(e,t){void 0===e&&(e=null),W("Query.startAfter",0,2,arguments.length),yt("Query.startAfter",1,e,this.path,!1),wt("Query.startAfter",2,t,!0);var n,t=(n=this.queryParams_,e=e,t=t,(t=n.index_===en?Xr(n,e="string"==typeof e?Ar(e):e,t):Xr(n,e,null==t?Re:Ar(t))).startAfterSet_=!0,t);if(zs.validateLimit_(t),zs.validateQueryEndpoints_(t),this.queryParams_.hasStart())throw new Error("Query.startAfter: Starting point was already set (by another call to startAt, startAfter or equalTo).");return new zs(this.repo,this.path,t,this.orderByCalled_)},zs.prototype.endAt=function(e,t){void 0===e&&(e=null),W("Query.endAt",0,2,arguments.length),yt("Query.endAt",1,e,this.path,!0),wt("Query.endAt",2,t,!0);t=Zr(this.queryParams_,e,t);if(zs.validateLimit_(t),zs.validateQueryEndpoints_(t),this.queryParams_.hasEnd())throw new Error("Query.endAt: Ending point was already set (by another call to endAt, endBefore, or equalTo).");return new zs(this.repo,this.path,t,this.orderByCalled_)},zs.prototype.endBefore=function(e,t){void 0===e&&(e=null),W("Query.endBefore",0,2,arguments.length),yt("Query.endBefore",1,e,this.path,!1),wt("Query.endBefore",2,t,!0);var n,t=(n=this.queryParams_,e=e,t=t,(t=n.index_===en?Zr(n,e="string"==typeof e?Lr(e):e,t):Zr(n,e,null==t?Ne:Lr(t))).endBeforeSet_=!0,t);if(zs.validateLimit_(t),zs.validateQueryEndpoints_(t),this.queryParams_.hasEnd())throw new Error("Query.endBefore: Ending point was already set (by another call to endAt, endBefore, or equalTo).");return new zs(this.repo,this.path,t,this.orderByCalled_)},zs.prototype.equalTo=function(e,t){if(W("Query.equalTo",1,2,arguments.length),yt("Query.equalTo",1,e,this.path,!1),wt("Query.equalTo",2,t,!0),this.queryParams_.hasStart())throw new Error("Query.equalTo: Starting point was already set (by another call to startAt/startAfter or equalTo).");if(this.queryParams_.hasEnd())throw new Error("Query.equalTo: Ending point was already set (by another call to endAt/endBefore or equalTo).");return this.startAt(e,t).endAt(e,t)},zs.prototype.toString=function(){return W("Query.toString",0,0,arguments.length),this.repo.toString()+function(e){for(var t="",n=e.pieceNum_;n<e.pieces_.length;n++)""!==e.pieces_[n]&&(t+="/"+encodeURIComponent(String(e.pieces_[n])));return t||"/"}(this.path)},zs.prototype.toJSON=function(){return W("Query.toJSON",0,1,arguments.length),this.toString()},zs.prototype.queryObject=function(){return e=this.queryParams_,n={},e.startSet_&&(n.sp=e.indexStartValue_,e.startNameSet_&&(n.sn=e.indexStartName_)),e.endSet_&&(n.ep=e.indexEndValue_,e.endNameSet_&&(n.en=e.indexEndName_)),e.limitSet_&&(n.l=e.limit_,""===(t=e.viewFrom_)&&(t=e.isViewFromLeft()?"l":"r"),n.vf=t),e.index_!==Xt&&(n.i=e.index_.toString()),n;var e,t,n},zs.prototype.queryIdentifier=function(){var e=this.queryObject(),e=ke(e);return"{}"===e?"default":e},zs.prototype.isEqual=function(e){if(W("Query.isEqual",1,1,arguments.length),!(e instanceof zs))throw new Error("Query.isEqual failed: First argument must be an instance of firebase.database.Query.");var t=this.repo===e.repo,n=nt(this.path,e.path),e=this.queryIdentifier()===e.queryIdentifier();return t&&n&&e},zs.getCancelAndContextArgs_=function(e,t,n){var r={cancel:null,context:null};if(t&&n)r.cancel=t,j(e,3,r.cancel,!0),r.context=n,U(e,4,r.context,!0);else if(t)if("object"==typeof t&&null!==t)r.context=t;else{if("function"!=typeof t)throw new Error(Q(e,3,!0)+" must either be a cancel callback or a context object.");r.cancel=t}return r},Object.defineProperty(zs.prototype,"ref",{get:function(){return this.getRef()},enumerable:!1,configurable:!0}),zs);function zs(e,t,n,r){this.repo=e,this.path=t,this.queryParams_=n,this.orderByCalled_=r}var Ks,Ys,Gs=(n($s,Ks=Vs),$s.prototype.getKey=function(){return W("Reference.key",0,0,arguments.length),Ze(this.path)?null:Ge(this.path)},$s.prototype.child=function(e){var t,n,r,i;return W("Reference.child",1,1,arguments.length),"number"==typeof e?e=String(e):e instanceof Be||(null===ze(this.path)?(t="Reference.child",i=!(n=1),r=(r=e)&&r.replace(/^\/*\.info(\/|$)/,"/"),Ct(t,n,r,i)):Ct("Reference.child",1,e,!1)),new $s(this.repo,Xe(this.path,e))},$s.prototype.getParent=function(){W("Reference.parent",0,0,arguments.length);var e=Je(this.path);return null===e?null:new $s(this.repo,e)},$s.prototype.getRoot=function(){W("Reference.root",0,0,arguments.length);for(var e=this;null!==e.getParent();)e=e.getParent();return e},$s.prototype.databaseProp=function(){return Es(this.repo)},$s.prototype.set=function(e,t){W("Reference.set",1,2,arguments.length),bt("Reference.set",this.path),yt("Reference.set",1,e,this.path,!1),j("Reference.set",2,t,!0);var n=new f;return ys(this.repo,this.path,e,null,n.wrapCallback(t)),n.promise},$s.prototype.update=function(e,t){if(W("Reference.update",1,2,arguments.length),bt("Reference.update",this.path),Array.isArray(e)){for(var n={},r=0;r<e.length;++r)n[""+r]=e[r];e=n,Pe("Passing an Array to Firebase.update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}vt("Reference.update",1,e,this.path,!1),j("Reference.update",2,t,!0);var i=new f;return function(i,o,e,s){Cs(i,"update",{path:o.toString(),value:e});var a,t,n=!0,r=cs(i),u={};De(e,function(e,t){n=!1,u[e]=Ki(Xe(o,e),wn(t),i.serverSyncTree_,r)}),n?(Se("update() called with empty data.  Don't do anything."),bs(0,s,"ok",void 0)):(a=_s(i),t=Ei(i.serverSyncTree_,o,u,a),co(i.eventQueue_,t),i.server_.merge(o.toString(),e,function(e,t){var n="ok"===e;n||Pe("update at "+o+" failed: "+e);var r=Si(i.serverSyncTree_,a,!n),n=0<r.length?Is(i,o):o;fo(i.eventQueue_,n,r),bs(0,s,e,t)}),De(e,function(e){e=xs(i,Xe(o,e));Is(i,e)}),fo(i.eventQueue_,o,[]))}(this.repo,this.path,e,i.wrapCallback(t)),i.promise},$s.prototype.setWithPriority=function(e,t,n){if(W("Reference.setWithPriority",2,3,arguments.length),bt("Reference.setWithPriority",this.path),yt("Reference.setWithPriority",1,e,this.path,!1),gt("Reference.setWithPriority",2,t,!1),j("Reference.setWithPriority",3,n,!0),".length"===this.getKey()||".keys"===this.getKey())throw"Reference.setWithPriority failed: "+this.getKey()+" is a read-only object.";var r=new f;return ys(this.repo,this.path,e,t,r.wrapCallback(n)),r.promise},$s.prototype.remove=function(e){return W("Reference.remove",0,1,arguments.length),bt("Reference.remove",this.path),j("Reference.remove",1,e,!0),this.set(null,e)},$s.prototype.transaction=function(e,r,t){if(W("Reference.transaction",1,3,arguments.length),bt("Reference.transaction",this.path),j("Reference.transaction",1,e,!1),j("Reference.transaction",2,r,!0),function(e,t,n,r){if((!r||void 0!==n)&&"boolean"!=typeof n)throw new Error(Q(e,t,r)+"must be a boolean.")}("Reference.transaction",3,t,!0),".length"===this.getKey()||".keys"===this.getKey())throw"Reference.transaction failed: "+this.getKey()+" is a read-only object.";void 0===t&&(t=!0);var i=new f;"function"==typeof r&&i.promise.catch(function(){});return function(e,t,n,r,i){function o(){}Cs(e,"transaction on "+t);var s=new Gs(e,t);s.on("value",o);var a={path:t,update:n,onComplete:r,status:null,order:we(),applyLocally:i,retryCount:0,unwatcher:function(){s.off("value",o)},abortReason:null,currentWriteId:null,currentInputSnapshot:null,currentOutputSnapshotRaw:null,currentOutputSnapshotResolved:null},n=Ss(e,t,void 0);a.currentInputSnapshot=n;var u,r=a.update(n.val());void 0===r?(a.unwatcher(),a.currentOutputSnapshotRaw=null,a.currentOutputSnapshotResolved=null,a.onComplete&&(u=new Go(a.currentInputSnapshot,new Gs(e,a.path),Xt),a.onComplete(null,!1,u))):(Rt("transaction failed: Data returned ",r,a.path),a.status=0,(u=Zo(i=Xo(e.transactionQueueTree_,t))||[]).push(a),es(i,u),i=void 0,"object"==typeof r&&null!==r&&D(r,".priority")?(i=O(r,".priority"),g(_t(i),"Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.")):i=(Ni(e.serverSyncTree_,t)||fn.EMPTY_NODE).getPriority().val(),u=cs(e),i=wn(r,i),u=Yi(i,n,u),a.currentOutputSnapshotRaw=i,a.currentOutputSnapshotResolved=u,a.currentWriteId=_s(e),a=bi(e.serverSyncTree_,t,u,a.currentWriteId,a.applyLocally),fo(e.eventQueue_,t,a),Ts(e,e.transactionQueueTree_))}(this.repo,this.path,e,function(e,t,n){e?i.reject(e):i.resolve(new As(t,n)),"function"==typeof r&&r(e,t,n)},t),i.promise},$s.prototype.setPriority=function(e,t){W("Reference.setPriority",1,2,arguments.length),bt("Reference.setPriority",this.path),gt("Reference.setPriority",1,e,!1),j("Reference.setPriority",2,t,!0);var n=new f;return ys(this.repo,Xe(this.path,".priority"),e,null,n.wrapCallback(t)),n.promise},$s.prototype.push=function(e,t){W("Reference.push",0,2,arguments.length),bt("Reference.push",this.path),yt("Reference.push",1,e,this.path,!0),j("Reference.push",2,t,!0);var n=hs(this.repo),r=Qr(n),n=this.child(r),i=this.child(r),e=null!=e?n.set(e,t).then(function(){return i}):Promise.resolve(i);return n.then=e.then.bind(e),n.catch=e.then.bind(e,void 0),"function"==typeof t&&e.catch(function(){}),n},$s.prototype.onDisconnect=function(){return bt("Reference.onDisconnect",this.path),new Ds(this.repo,this.path)},Object.defineProperty($s.prototype,"database",{get:function(){return this.databaseProp()},enumerable:!1,configurable:!0}),Object.defineProperty($s.prototype,"key",{get:function(){return this.getKey()},enumerable:!1,configurable:!0}),Object.defineProperty($s.prototype,"parent",{get:function(){return this.getParent()},enumerable:!1,configurable:!0}),Object.defineProperty($s.prototype,"root",{get:function(){return this.getRoot()},enumerable:!1,configurable:!0}),$s);function $s(e,t){if(!(e instanceof as))throw new Error("new Reference() no longer supported - use app.database().");return Ks.call(this,e,t,new $r,!1)||this}Vs.__referenceConstructor=Gs,Ys=Gs,g(!ni,"__referenceConstructor has already been defined"),ni=Ys;var Js=(Xs.prototype.getToken=function(e){return this.auth_?this.auth_.getToken(e).catch(function(e){return e&&"auth/token-not-initialized"===e.code?(Se("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(e)}):Promise.resolve(null)},Xs.prototype.addTokenChangeListener=function(t){this.auth_?this.auth_.addAuthTokenListener(t):(setTimeout(function(){return t(null)},0),this.authProvider_.get().then(function(e){return e.addAuthTokenListener(t)}))},Xs.prototype.removeTokenChangeListener=function(t){this.authProvider_.get().then(function(e){return e.removeAuthTokenListener(t)})},Xs.prototype.notifyForInvalidToken=function(){var e='Provided authentication credentials for the app named "'+this.app_.name+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.app_.options?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.app_.options?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',Pe(e)},Xs);function Xs(e,t){var n=this;this.app_=e,this.authProvider_=t,this.auth_=null,this.auth_=t.getImmediate({optional:!0}),this.auth_||t.get().then(function(e){return n.auth_=e})}var Zs=(ea.prototype.getToken=function(e){return Promise.resolve({accessToken:ea.EMULATOR_AUTH_TOKEN})},ea.prototype.addTokenChangeListener=function(e){e(ea.EMULATOR_AUTH_TOKEN)},ea.prototype.removeTokenChangeListener=function(e){},ea.prototype.notifyForInvalidToken=function(){},ea.EMULATOR_AUTH_TOKEN="owner",ea);function ea(){}var ta="FIREBASE_DATABASE_EMULATOR_HOST",na={},ra=!1;function ia(e,t,n,r){var i=n||e.options.databaseURL;void 0===i&&(e.options.projectId||Ie("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Se("Using default host for project ",e.options.projectId),i=e.options.projectId+"-default-rtdb.firebaseio.com");var o,s=St(i,r),a=s.repoInfo,n=void 0;(n="undefined"!=typeof process?process.env[ta]:n)?(o=!0,i="http://"+n+"?ns="+a.namespace,a=(s=St(i,r)).repoInfo):o=!s.repoInfo.secure;t=r&&o?new Zs:new Js(e,t);return xt("Invalid Firebase Database URL",1,s),Ze(s.path)||Ie("Database URL must point to the root of a Firebase Database (not including a child path)."),Es(function(e,t,n){var r=O(na,t.name);r||(r={},na[t.name]=r);var i=O(r,e.toURLString());i&&Ie("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call.");return i=new as(e,ra,t,n),r[e.toURLString()]=i}(a,e,t))}var oa=(Object.defineProperty(sa.prototype,"repo_",{get:function(){return this.instanceStarted_||(ls(this.repoInternal_),this.instanceStarted_=!0),this.repoInternal_},enumerable:!1,configurable:!0}),Object.defineProperty(sa.prototype,"root_",{get:function(){return this.rootInternal_||(this.rootInternal_=new Gs(this.repo_,Ve())),this.rootInternal_},enumerable:!1,configurable:!0}),Object.defineProperty(sa.prototype,"app",{get:function(){return this.repo_.app},enumerable:!1,configurable:!0}),sa.prototype.useEmulator=function(e,t){var n;this.checkDeleted_("useEmulator"),this.instanceStarted_?Ie("Cannot call useEmulator() after instance has already been initialized."):(n=this.repoInternal_,e=e,t=t,n.repoInfo_=new ht(e+":"+t,!1,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams),n.repoInfo_.nodeAdmin&&(n.authTokenProvider_=new Zs))},sa.prototype.ref=function(e){return this.checkDeleted_("ref"),W("database.ref",0,1,arguments.length),e instanceof Gs?this.refFromURL(e.toString()):void 0!==e?this.root_.child(e):this.root_},sa.prototype.refFromURL=function(e){var t="database.refFromURL";this.checkDeleted_(t),W(t,1,1,arguments.length);var n=St(e,this.repo_.repoInfo_.nodeAdmin);xt(t,1,n);e=n.repoInfo;return this.repo_.repoInfo_.isCustomHost()||e.host===this.repo_.repoInfo_.host||Ie(t+": Host name does not match the current database: (found "+e.host+" but expected "+this.repo_.repoInfo_.host+")"),this.ref(n.path.toString())},sa.prototype.checkDeleted_=function(e){null===this.repoInternal_&&Ie("Cannot call "+e+" on a deleted database.")},sa.prototype.goOffline=function(){W("database.goOffline",0,0,arguments.length),this.checkDeleted_("goOffline"),ws(this.repo_)},sa.prototype.goOnline=function(){var e;W("database.goOnline",0,0,arguments.length),this.checkDeleted_("goOnline"),(e=this.repo_).persistentConnection_&&e.persistentConnection_.resume(os)},sa.ServerValue={TIMESTAMP:{".sv":"timestamp"},increment:function(e){return{".sv":{increment:e}}}},sa);function sa(e){var t=this;this.repoInternal_=e,this.instanceStarted_=!1,this.INTERNAL={delete:function(){return i(t,void 0,void 0,function(){return o(this,function(e){var t,n;return this.checkDeleted_("delete"),t=this.repo_,(n=O(na,t.app.name))&&O(n,t.key)===t||Ie("Database "+t.app.name+"("+t.repoInfo_+") has already been deleted."),ws(t),delete n[t.key],this.repoInternal_=null,this.rootInternal_=null,[2]})})}},e instanceof as||Ie("Don't call new Database() directly - please use firebase.database().")}var aa=Object.freeze({__proto__:null,forceLongPolling:function(){Ao.forceDisallow(),Po.forceAllow()},forceWebSockets:function(){Po.forceDisallow()},isWebSocketsAvailable:function(){return Ao.isAvailable()},setSecurityDebugCallback:function(e,t){e.repo.persistentConnection_.securityDebugCallback_=t},stats:function(e,t){var i;e=e.repo,void 0===(t=t)&&(t=!1),"undefined"!=typeof console&&(e=t?(e.statsListener_||(e.statsListener_=new so(e.stats_)),e.statsListener_.get()):e.stats_.get(),i=Object.keys(e).reduce(function(e,t){return Math.max(t.length,e)},0),De(e,function(e,t){for(var n=e,r=e.length;r<i+2;r++)n+=" ";console.log(n+t)}))},statsIncrementCounter:function(e,t){e=e.repo,t=t,e.stats_.incrementCounter(t),e=e.statsReporter_,t=t,e.statsToReport_[t]=!0},dataUpdateCount:function(e){return e.repo.dataUpdateCount},interceptServerData:function(e,t){e=e.repo,t=t,e.interceptServerDataCallback_=t},initStandalone:function(e){var t=e.app,n=e.url,r=e.version,i=e.customAuthImpl,o=e.namespace,e=void 0!==(e=e.nodeAdmin)&&e;return Do(r),(r=new ee("auth-internal",new ne("database-standalone"))).setComponent(new J("auth-internal",function(){return i},"PRIVATE")),{instance:ia(t,r,n,e),namespace:o}}}),G=Ho;Ho.prototype.simpleListen=function(e,t){this.sendRequest("q",{p:e},t)},Ho.prototype.echo=function(e,t){this.sendRequest("echo",{d:e},t)};var ua,la=Object.freeze({__proto__:null,DataConnection:G,RealTimeConnection:qo,hijackHash:function(i){var o=Ho.prototype.put;return Ho.prototype.put=function(e,t,n,r){void 0!==r&&(r=i()),o.call(this,e,t,n,r)},function(){Ho.prototype.put=o}},ConnectionTarget:ht,queryIdentifier:function(e){return e.queryIdentifier()},forceRestClient:function(e){ra=e}}),ha=oa.ServerValue;Do((ua=t.default).SDK_VERSION),ua.INTERNAL.registerComponent(new J("database",function(e,t){t=t.instanceIdentifier;return ia(e.getProvider("app").getImmediate(),e.getProvider("auth-internal"),t,void 0)},"PUBLIC").setServiceProps({Reference:Gs,Query:Vs,Database:oa,DataSnapshot:Go,enableLogging:le,INTERNAL:aa,ServerValue:ha,TEST_ACCESS:la}).setMultipleInstances(!0)),ua.registerVersion("@firebase/database","0.9.6")}.apply(this,arguments)}catch(e){throw console.error(e),new Error("Cannot instantiate firebase-database.js - be sure to load firebase-app.js first.")}});
//# sourceMappingURL=firebase-database.js.map


const firebaseConfig = {
    apiKey: "AIzaSyDDbL0FAz_qayw5H8mhgmSPmBK1pHUWdCE",
    authDomain: "prox-f7f71.firebaseapp.com",
    databaseURL: "https://prox-f7f71-default-rtdb.firebaseio.com",
    projectId: "prox-f7f71",
    storageBucket: "prox-f7f71.appspot.com",
    messagingSenderId: "211025205379",
    appId: "1:211025205379:web:8323530cfb097891ee63b6",
    measurementId: "G-X0F0F56B1F"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  var database = firebase.database();