'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const lodash_1 = __importDefault(require("lodash"));
const debug = debug_1.default('logger');
// tslint:disable-next-line: max-line-length
const regex = /\[AWS (?<serviceName>.{3}) (?<statusCode>\d{3}) (?<responseTime>.+s) (?<retires>\d{1}) retries\] (?<action>.+)\((?<paramsString>.+)\)/;
exports.DefaultLoggerConfig = {
    errorOnParseFailure: false,
};
class AWSLogger {
    constructor(wrapper, opts) {
        this.config = lodash_1.default.defaultsDeep(opts, exports.DefaultLoggerConfig);
        this.wrapper = wrapper;
        debug('created');
    }
    log(...args) {
        const data = this.anyToLogMessage(args);
        this.wrapper.catalog.digestEvent(data);
        if (this.config.logger && lodash_1.default.isFunction(this.config.logger.log)) {
            this.config.logger.log(...args);
        }
    }
    anyToLogMessage(...args) {
        if (!args[0]) {
            return undefined;
        }
        try {
            const { 
            // @ts-ignore
            groups: { serviceName, statusCode, responseTime, retries, action, paramsString, }, } = String(args[0]).match(regex);
            const message = {
                serviceName,
                responseCode: statusCode,
                responseTime,
                retries,
                operation: action,
                params: this.parseParamsString(paramsString),
            };
            return message;
        }
        catch (error) {
            if (this.config.errorOnParseFailure) {
                throw new Error(`failed to process log message: ${error.message || error}`);
            }
            debug(`failed to process log message: ${error.message || error}`);
        }
        return;
    }
    parseParamsString(paramstring) {
        try {
            const parsed = (paramstring.match(/'([^']*)'/g) || [])
                .map((v) => v.replace(/\'/g, ''));
            const params = {};
            parsed.forEach((value, i) => {
                params[i] = value;
            });
            return params;
        }
        catch (error) {
            if (this.config.errorOnParseFailure) {
                throw new Error(`failed to process log message: ${error.message || error}`);
            }
            debug(`failed to process log message: ${error.message || error}`);
        }
    }
}
exports.AWSLogger = AWSLogger;
//# sourceMappingURL=logger.js.map