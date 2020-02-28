'use strict';

import Debug from 'debug';
import _ from 'lodash';

import {IServiceUtilization, ServiceUtilizationCatalog} from '../catalog';
import {Exporter, ExporterType} from './base';

const debug = Debug('aws-sdk-tracer:http-exporter');

export interface IHTTPExporterConfig {
    protocol: string;
    hostname: string;
    endpoint: string;
    headers: Map<string, string>;
}

export type IHTTPExporterOptions = Partial<IHTTPExporterConfig>;

export const DefaultExporterConfig: IHTTPExporterConfig = {
    protocol: 'https',
    hostname: '',
    endpoint: '',
    headers: new Map<string, string>(),
};

export class HTTPExporter extends Exporter {
    public static type: ExporterType = 'http';
    private config: IHTTPExporterConfig & IHTTPExporterOptions;
    constructor(opts?: IHTTPExporterOptions) {
        super(HTTPExporter.type);
        this.config = _.defaultsDeep(
            opts,
            DefaultExporterConfig
        );
        debug('created');
    }
    public init(catalog: ServiceUtilizationCatalog) {
        super.init(catalog);
        debug('intialized');
    }
    protected _write(usage: IterableIterator<IServiceUtilization>): void {
        // not implemented
        debug('not implemented!', this.config);
    }
}
