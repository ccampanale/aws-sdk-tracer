"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exporters = require("./exporters");
exports.Tracer = require("./tracer");
exports.Wrapper = require("./wrapper");
function wrapAWSSDK(awssdk, opts) {
    const aWrapper = new exports.Wrapper.Wrapper(opts);
    aWrapper.wrap(awssdk);
    return {
        AWS: awssdk,
        wrapper: aWrapper,
    };
}
exports.wrapAWSSDK = wrapAWSSDK;
//# sourceMappingURL=index.js.map