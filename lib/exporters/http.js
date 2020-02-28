'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const lodash_1 = __importDefault(require("lodash"));
const base_1 = require("./base");
const debug = debug_1.default('aws-sdk-tracer:http-exporter');
exports.DefaultExporterConfig = {
    protocol: 'https',
    hostname: '',
    endpoint: '',
    headers: new Map(),
};
class HTTPExporter extends base_1.Exporter {
    constructor(opts) {
        super(HTTPExporter.type);
        this.config = lodash_1.default.defaultsDeep(opts, exports.DefaultExporterConfig);
        debug('created');
    }
    init(catalog) {
        super.init(catalog);
        debug('intialized');
    }
    _write(usage) {
        // not implemented
        debug('not implemented!', this.config);
    }
}
HTTPExporter.type = 'http';
exports.HTTPExporter = HTTPExporter;
//# sourceMappingURL=http.js.map