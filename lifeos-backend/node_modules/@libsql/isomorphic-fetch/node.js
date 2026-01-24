import { default as nodeFetch, Request, Headers } from "node-fetch";
import http from "node:http";
import https from "node:https";
import stream from "node:stream";

// workaround this bug: https://github.com/node-fetch/node-fetch/issues/1735

const httpAgent = new http.Agent({keepAlive: true});
const httpsAgent = new https.Agent({keepAlive: true});

function agentSelector(parsedUrl) {
    if (parsedUrl.protocol === "https:") {
        return httpsAgent;
    } else {
        return httpAgent;
    }
}

// node-fetch returns a Node stream in the `Response.body` property, but the Fetch API should return a WhatWG
// stream. this is a shim that emulates the WhatWG stream API which is used by `@libsql/hrana-client`

class WebReadableStream {
    #nodeStream;
    #ended;
    #error;
    #readRequests;

    constructor(nodeStream) {
        this.#nodeStream = nodeStream;
        this.#ended = false;
        this.#error = undefined;
        this.#readRequests = [];
    }

    getReader() {
        this.#nodeStream.on("end", () => {
            this.#ended = true;
            while (this.#readRequests.length > 0) {
                this.#readRequests.shift().callback({value: undefined, done: true});
            }
        });
        this.#nodeStream.on("error", (error) => {
            this.#error = error;
            while (this.#readRequests.length > 0) {
                this.#readRequests.shift().errback(error);
            }
        });
        this.#nodeStream.on("readable", () => {
            while (this.#readRequests.length > 0) {
                const chunk = this.#nodeStream.read();
                if (chunk === null) {
                    break;
                }
                this.#readRequests.shift().callback({value: chunk, done: false});
            }
        });
        return this;
    }

    read() {
        return new Promise((callback, errback) => {
            if (this.#error !== undefined) {
                errback(this.#error);
            } else if (this.#ended) {
                callback({value: undefined, done: true});
            } else {
                const chunk = this.#nodeStream.read();
                if (chunk === null) {
                    this.#readRequests.push({callback, errback});
                } else {
                    callback({value: chunk, done: false});
                }
            }
        });
    }

    cancel() {
        this.#nodeStream.destroy();
        return Promise.resolve(undefined);
    }
}

// unfortunately, Node 16.x does not expose `stream.Readable.toWeb`, even though it implements the adapter
// inside `lib/internal/webstreams/adapters.js`
let streamReadableToWeb = stream.Readable.toWeb ??
    ((nodeStream) => new WebReadableStream(nodeStream));

class Response {
    #nodeResponse;

    constructor(nodeResponse) {
        this.#nodeResponse = nodeResponse;
        this.body = streamReadableToWeb(nodeResponse.body);
    }

    arrayBuffer() { return this.#nodeResponse.arrayBuffer(); }
    blob() { return this.#nodeResponse.blob(); }
    json() { return this.#nodeResponse.json(); }
    text() { return this.#nodeResponse.text(); }

    get headers() { return this.#nodeResponse.headers; }
    get ok() { return this.#nodeResponse.ok; }
    get status() { return this.#nodeResponse.status; }
}

function fetch(resource, options = {}) {
    return nodeFetch(resource, {agent: agentSelector, ...options})
        .then((nodeResponse) => new Response(nodeResponse));
}

export { fetch, Request, Headers };
