'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const lodash_1 = __importDefault(require("lodash"));
const catalog_1 = require("./catalog");
const exporters_1 = require("./exporters");
const logger_1 = require("./logger");
const tracer_1 = require("./tracer");
const debug = debug_1.default('aws-sdk-tracer:wrapper');
var AWSTracerType;
(function (AWSTracerType) {
    AWSTracerType["Request"] = "Request";
    AWSTracerType["Logger"] = "Logger";
})(AWSTracerType = exports.AWSTracerType || (exports.AWSTracerType = {}));
exports.DefaultWrapperConfig = {
    tracer: AWSTracerType.Request,
    exporters: [],
};
class Wrapper {
    constructor(opts) {
        this.config = lodash_1.default.defaultsDeep(opts, exports.DefaultWrapperConfig);
        this.catalog = new catalog_1.ServiceUtilizationCatalog();
        this.exporters = [];
        this.config.exporters.forEach((exporterName) => {
            if (exporterName.toLowerCase() === 'filesystem') {
                this.exporters.push(new exporters_1.Exporters.filesystem());
            }
            else if (exporterName.toLowerCase() === 'http') {
                this.exporters.push(new exporters_1.Exporters.http());
            }
            else {
                throw new Error(`unknown/unsupported exporter: ${exporterName}`);
            }
        });
        this.tracer = new tracer_1.Tracer(this, {
            logger: this.config.logger,
        });
        this.setupCatalogEvents();
        debug('created');
    }
    wrap(awssdk) {
        if (this.isAlreadyWrapped(awssdk)) {
            throw new Error('AWS SDK is already wrapped; did you mean to unwrap()?');
        }
        switch (this.config.tracer) {
            case AWSTracerType.Logger:
                this.attachLogger(awssdk);
                break;
            case AWSTracerType.Request:
                this.replaceRequest(awssdk);
                break;
            default:
                throw new Error(`unsupporter tracer type: ${this.config.tracer}`);
        }
    }
    unwrap(awssdk) {
        if (awssdk.config.logger instanceof logger_1.AWSLogger) {
            awssdk.config.logger = undefined;
        }
        if (awssdk.Request instanceof this.tracer.tracerClass) {
            awssdk.Request = this.tracer.originalRequest;
        }
    }
    printUtilization(logger = console, json = false) {
        const usage = this.catalog.getServiceUsage();
        let result = usage.next();
        const allEntries = {};
        while (!result.done) {
            allEntries[result.value.service] = result.value;
            result = usage.next();
        }
        if (json) {
            logger.log(JSON.stringify(allEntries));
        }
        else {
            logger.log(allEntries);
        }
    }
    setupCatalogEvents() {
        this.exporters.forEach((exporter) => {
            exporter.init(this.catalog);
        });
        debug('exporters initialized');
    }
    attachLogger(awssdk) {
        awssdk.config.logger = new logger_1.AWSLogger(this, {
            logger: this.config.logger,
        });
        debug('logger attached');
    }
    replaceRequest(awssdk) {
        awssdk.Request = this.tracer.tracerClass;
        debug('request replaced');
    }
    isAlreadyWrapped(awssdk) {
        return awssdk.config.logger instanceof logger_1.AWSLogger
            || awssdk.Request instanceof this.tracer.tracerClass;
    }
}
exports.Wrapper = Wrapper;
//# sourceMappingURL=wrapper.js.map