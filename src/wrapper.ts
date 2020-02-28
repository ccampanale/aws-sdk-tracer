'use strict';

import * as AWS from 'aws-sdk';
import Debug from 'debug';
import _ from 'lodash';

import {ServiceUtilizationCatalog} from './catalog';
import {Base, Exporters} from './exporters';
import {Tracer} from './tracer';

const debug = Debug('aws-sdk-tracer:wrapper');

export interface IWrapper {
    wrap(awssdk: typeof AWS): void;
}

export interface IWrapperConfig {
    exporters: string[];
    logger?: { log(...args: any[]): void };
}

export interface IWrapperOptions {
    logger?: { log(...args: any[]): void };
}

export const DefaultWrapperConfig: IWrapperConfig = {
    exporters: [],
};

export class Wrapper implements IWrapper {
    public catalog: ServiceUtilizationCatalog;
    private config: IWrapperConfig & IWrapperOptions;
    private exporters: Base.Exporter[];
    private tracer: Tracer;
    constructor(opts?: IWrapperOptions) {
        this.config = _.defaultsDeep(
            opts,
            DefaultWrapperConfig
        );
        this.catalog = new ServiceUtilizationCatalog();
        this.exporters = [];
        this.config.exporters.forEach((exporterName) => {
            if (exporterName.toLowerCase() === 'filesystem') {
                this.exporters.push(
                    new Exporters.filesystem()
                );
            } else if (exporterName.toLowerCase() === 'http') {
                this.exporters.push(
                    new Exporters.http()
                );
            } else {
                throw new Error(`unknown/unsupported exporter: ${exporterName}`);
            }
        });
        this.tracer = new Tracer(this, {
            logger: this.config.logger,
        });
        this.setupCatalogEvents();
        debug('created');
    }
    public wrap(awssdk: typeof AWS): void {
        awssdk.Request = this.tracer.getTracedRequestClass();
    }
    public printUtilization(logger = console, json = false) {
        const usage = this.catalog.getServiceUsage();
        let result = usage.next();
        const allEntries: any = {};
        while (!result.done) {
            allEntries[result.value.service] = result.value;
            result = usage.next();
        }
        if (json) {
            logger.log(JSON.stringify(allEntries));
        } else {
            logger.log(allEntries);
        }
    }
    private setupCatalogEvents() {
        this.exporters.forEach((exporter) => {
            exporter.init(this.catalog);
        });
        debug('exporters initialized');
    }
}
