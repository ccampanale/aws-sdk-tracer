'use strict';

import _ from 'lodash';
import {IServiceUtilization, ServiceUtilizationCatalog, ServiceUtilizationCatalogEvents} from '../catalog';

export type ExporterType = string;

export interface IExport {
    readonly type: ExporterType;
}

export type ExporterClass<T extends Exporter> = new(...args: any[]) => T;

export abstract class Exporter implements IExport {
    public readonly type: ExporterType;
    private catalog?: ServiceUtilizationCatalog;
    private initialized: boolean = false;
    constructor(type: ExporterType) {
        this.type = type;
    }
    public init(catalog: ServiceUtilizationCatalog) {
        this.catalog = catalog;
        this.catalog.on(
            ServiceUtilizationCatalogEvents.Updated,
            (aCatalog: ServiceUtilizationCatalog) => {
                this.write(aCatalog.getServiceUsage());
            }
        );
        this.initialized = true;
    }
    public write(usage: IterableIterator<IServiceUtilization>): void {
        if (!this.initialized) {
            throw new Error('exporter is unitilized and cannot be written to');
        }
        this._write(usage);
    }
    protected abstract _write(usage: IterableIterator<IServiceUtilization>): void;
}
