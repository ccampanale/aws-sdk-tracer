'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const catalog_1 = require("../catalog");
class Exporter {
    constructor(type) {
        this.initialized = false;
        this.type = type;
    }
    init(catalog) {
        this.catalog = catalog;
        this.catalog.on(catalog_1.ServiceUtilizationCatalogEvents.Updated, (aCatalog) => {
            this.write(aCatalog.getServiceUsage());
        });
        this.initialized = true;
    }
    write(usage) {
        if (!this.initialized) {
            throw new Error('exporter is unitilized and cannot be written to');
        }
        this._write(usage);
    }
}
exports.Exporter = Exporter;
//# sourceMappingURL=base.js.map