'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const lodash_1 = __importDefault(require("lodash"));
const catalog_1 = require("./catalog");
const exporters_1 = require("./exporters");
const tracer_1 = require("./tracer");
const debug = debug_1.default('aws-sdk-tracer:wrapper');
exports.DefaultWrapperConfig = {
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
        awssdk.Request = this.tracer.getTracedRequestClass();
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
}
exports.Wrapper = Wrapper;
//# sourceMappingURL=wrapper.js.map