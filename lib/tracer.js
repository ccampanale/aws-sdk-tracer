'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = __importStar(require("aws-sdk"));
const debug_1 = __importDefault(require("debug"));
const events_1 = require("events");
const lodash_1 = __importDefault(require("lodash"));
const debug = debug_1.default('aws-sdk-tracer:tracer');
exports.DefaultTracerConfig = {};
var TracerEvents;
(function (TracerEvents) {
    TracerEvents["Trace"] = "Trace";
})(TracerEvents = exports.TracerEvents || (exports.TracerEvents = {}));
class Tracer extends events_1.EventEmitter {
    constructor(wrapper, opts) {
        super();
        this.originalRequest = AWS.Request;
        this.tracerConfig = lodash_1.default.defaultsDeep(opts, exports.DefaultTracerConfig);
        this.traces = new Array();
        this.wrapper = wrapper;
        this.on(TracerEvents.Trace, (trace) => {
            this.traces.push(trace);
            if (this.tracerConfig.logger) {
                this.tracerConfig.logger.log(trace);
            }
            this.wrapper.catalog.digestEvent(trace);
        });
        const self = this;
        this.tracerClass = class TracedRequest extends AWS.Request {
            constructor(service, operation, params) {
                super(service, operation, params);
                this.TRACER = self;
                this.tracedOperation = operation;
                this.tracedParams = params;
                this.tracedService = service;
                this.on('success', (response) => {
                    this.TRACER.handleRequestSuccess(this, response);
                });
            }
            getOperation() {
                return this.tracedOperation;
            }
            getParams() {
                return this.tracedParams;
            }
            getRegion() {
                return this.tracedService.config.region;
            }
            getServiceName() {
                return this.tracedService.endpoint.host.split('.')[0];
            }
        };
        debug('created');
    }
    handleRequestSuccess(request, response) {
        const trace = {
            requestId: response.requestId,
            region: request.getRegion(),
            serviceName: request.getServiceName(),
            operation: request.getOperation(),
            params: request.getParams(),
        };
        this.emit(TracerEvents.Trace, trace);
    }
}
exports.Tracer = Tracer;
//# sourceMappingURL=tracer.js.map