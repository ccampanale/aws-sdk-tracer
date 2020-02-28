'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const events_1 = require("events");
const debug = debug_1.default('aws-sdk-tracer:catalog');
var ServiceUtilizationCatalogEvents;
(function (ServiceUtilizationCatalogEvents) {
    ServiceUtilizationCatalogEvents["Updated"] = "Updated";
})(ServiceUtilizationCatalogEvents = exports.ServiceUtilizationCatalogEvents || (exports.ServiceUtilizationCatalogEvents = {}));
class ServiceUtilizationCatalog extends events_1.EventEmitter {
    constructor() {
        super();
        this.catalog = new Map();
        debug('created');
    }
    digestEvent(event) {
        if (!event) {
            return;
        }
        const entry = this.catalog.get(event.serviceName);
        let updated = false;
        if (entry) {
            if (!entry.actions.includes(event.operation)) {
                entry.actions.push(event.operation);
            }
            this.resourcesFromParams(event.params).forEach((resource) => {
                if (!entry.resources.includes(resource)) {
                    entry.resources.push(resource);
                    updated = true;
                }
            });
        }
        else {
            this.catalog.set(event.serviceName, {
                service: event.serviceName,
                actions: [event.operation],
                resources: this.resourcesFromParams(event.params),
            });
            updated = true;
        }
        if (updated) {
            debug('updated');
            this.emit(ServiceUtilizationCatalogEvents.Updated, this);
        }
    }
    getServiceUsage() {
        return this.catalog.values();
    }
    resourcesFromParams(params) {
        const resources = [];
        for (const prop in params) {
            if (params[prop] && 'string' === typeof params[prop]) {
                if (params[prop].includes('arn')) {
                    resources.push(params[prop]);
                }
            }
        }
        return resources;
    }
}
exports.ServiceUtilizationCatalog = ServiceUtilizationCatalog;
//# sourceMappingURL=catalog.js.map