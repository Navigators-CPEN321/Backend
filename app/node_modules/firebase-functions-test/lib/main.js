"use strict";
// The MIT License (MIT)
//
// Copyright (c) 2018 Firebase
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const firebase_functions_1 = require("firebase-functions");
/** Takes a cloud function to be tested, and returns a WrappedFunction which can be called in test code. */
function wrap(cloudFunction) {
    if (!lodash_1.has(cloudFunction, '__trigger')) {
        throw new Error('Wrap can only be called on functions written with the firebase-functions SDK.');
    }
    if (!lodash_1.has(cloudFunction, '__trigger.eventTrigger')) {
        throw new Error('Wrap function is only available for non-HTTP functions.');
    }
    if (!lodash_1.has(cloudFunction, 'run')) {
        throw new Error('This library can only be used with functions written with firebase-functions v1.0.0 and above');
    }
    let wrapped = (data, options) => {
        const defaultContext = {
            eventId: _makeEventId(),
            resource: {
                service: cloudFunction.__trigger.eventTrigger.service,
                name: _makeResourceName(cloudFunction.__trigger.eventTrigger.resource, options ? options.params : null),
            },
            eventType: cloudFunction.__trigger.eventTrigger.eventType,
            timestamp: (new Date()).toISOString(),
            params: {},
        };
        if (defaultContext.eventType.match(/firebase.database/)) {
            defaultContext.authType = 'UNAUTHENTICATED';
            defaultContext.auth = null;
        }
        let context = lodash_1.merge({}, defaultContext, options);
        return cloudFunction.run(data, context);
    };
    return wrapped;
}
exports.wrap = wrap;
/** @internal */
function _makeResourceName(triggerResource, params = {}) {
    const wildcardRegex = new RegExp('{[^/{}]*}', 'g');
    let resourceName = triggerResource.replace(wildcardRegex, (wildcard) => {
        let wildcardNoBraces = wildcard.slice(1, -1); // .slice removes '{' and '}' from wildcard
        let sub = lodash_1.get(params, wildcardNoBraces);
        return sub || wildcardNoBraces + lodash_1.random(1, 9);
    });
    return resourceName;
}
exports._makeResourceName = _makeResourceName;
function _makeEventId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
/** Make a Change object to be used as test data for Firestore and real time database onWrite and onUpdate functions. */
function makeChange(before, after) {
    return firebase_functions_1.Change.fromObjects(before, after);
}
exports.makeChange = makeChange;
/** Mock values returned by `functions.config()`. */
function mockConfig(config) {
    process.env.CLOUD_RUNTIME_CONFIG = JSON.stringify(config);
}
exports.mockConfig = mockConfig;
