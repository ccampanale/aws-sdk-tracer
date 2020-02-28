'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const debug = debug_1.default('aws-sdk-tracer:filesystem-exporter');
exports.DefaultExporterConfig = {
    path: '/tmp',
    file: 'aws-sdk-tracer.json',
};
class FilesystemExporter extends base_1.Exporter {
    constructor(opts) {
        super(FilesystemExporter.type);
        this.config = lodash_1.default.defaultsDeep(opts, exports.DefaultExporterConfig);
        this.localData = {};
        this.ensurePath();
        this.loadCurrentData();
        debug('created');
    }
    init(catalog) {
        super.init(catalog);
        debug('intialized');
    }
    _write(usage) {
        fs_1.default.writeFile(this.filepath(), this.prepareWrite(usage), (err) => {
            if (err) {
                debug(`write error ${err}`);
            }
        });
        debug('updates written');
    }
    filepath() {
        return path_1.default.join(this.config.path, this.config.file);
    }
    ensurePath() {
        const filePath = this.filepath();
        if (!fs_1.default.existsSync(this.config.path)) {
            fs_1.default.mkdirSync(this.config.path, {
                mode: 0o555,
                recursive: true,
            });
            debug(`created path ${this.config.path}`);
        }
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, '{}');
            debug(`created file ${filePath}`);
        }
    }
    loadCurrentData() {
        const filePath = this.filepath();
        try {
            const data = fs_1.default.readFileSync(filePath).toString();
            this.localData = JSON.parse(data);
        }
        catch (error) {
            debug(`unable to load [${filePath}]; ${error.message || error}`);
        }
    }
    prepareWrite(usage) {
        let result = usage.next();
        const allCatalogEntries = {};
        while (!result.done) {
            allCatalogEntries[result.value.service] = result.value;
            result = usage.next();
        }
        return JSON.stringify(lodash_1.default.defaultsDeep(allCatalogEntries, this.localData));
    }
}
FilesystemExporter.type = 'filesystem';
exports.FilesystemExporter = FilesystemExporter;
//# sourceMappingURL=filesystem.js.map