'use strict';

import Debug from 'debug';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';

import {IServiceUtilization, ServiceUtilizationCatalog} from '../catalog';
import {Exporter, ExporterType} from './base';

const debug = Debug('aws-sdk-tracer:filesystem-exporter');

export interface IFilesystemExporterConfig {
    path: string;
    file: string;
}

export interface IFilesystemExporterOptions {
    path?: string;
    file?: string;
}

export const DefaultExporterConfig: IFilesystemExporterConfig = {
    path: '/tmp',
    file: 'aws-sdk-tracer.json',
};

export interface IServiceUtilizationData {
    [service: string]: IServiceUtilization;
}

export class FilesystemExporter extends Exporter {
    public static type: ExporterType = 'filesystem';
    private config: IFilesystemExporterConfig & IFilesystemExporterOptions;
    private localData: IServiceUtilizationData;
    constructor(opts?: IFilesystemExporterOptions) {
        super(FilesystemExporter.type);
        this.config = _.defaultsDeep(
            opts,
            DefaultExporterConfig
        );
        this.localData = {};
        this.ensurePath();
        this.loadCurrentData();
        debug('created');
    }
    public init(catalog: ServiceUtilizationCatalog) {
        super.init(catalog);
        debug('intialized');
    }
    protected _write(usage: IterableIterator<IServiceUtilization>): void {
        fs.writeFile(
            this.filepath(),
            this.prepareWrite(usage),
            (err) => {
                if (err) {
                    debug(`write error ${err}`);
                }
            }
        );
        debug('updates written');
    }
    private filepath(): string {
        return path.join(this.config.path, this.config.file);
    }
    private ensurePath(): void {
        const filePath = this.filepath();
        if (!fs.existsSync(this.config.path)) {
            fs.mkdirSync(this.config.path, {
                mode: 0o555,
                recursive: true,
            });
            debug(`created path ${this.config.path}`);
        }
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '{}');
            debug(`created file ${filePath}`);
        }
    }
    private loadCurrentData(): void {
        const filePath = this.filepath();
        try {
            const data = fs.readFileSync(filePath).toString();
            this.localData = JSON.parse(data);
        } catch (error) {
            debug(`unable to load [${filePath}]; ${error.message || error}`);
        }
    }
    private prepareWrite(usage: IterableIterator<IServiceUtilization>): string {
        let result = usage.next();
        const allCatalogEntries: IServiceUtilizationData = {};
        while (!result.done) {
            allCatalogEntries[result.value.service] = result.value;
            result = usage.next();
        }
        return JSON.stringify(
            _.defaultsDeep(
                allCatalogEntries,
                this.localData
            )
        );
    }
}
