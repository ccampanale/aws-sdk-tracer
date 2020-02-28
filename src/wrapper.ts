'use strict';

import * as AWS from 'aws-sdk';
import Debug from 'debug';
import _ from 'lodash';

import {ServiceUtilizationCatalog} from './catalog';
import {ILogger} from './common';
import {Base, Exporters} from './exporters';
import {AWSLogger} from './logger';
import {Tracer} from './tracer';

const debug = Debug('aws-sdk-tracer:wrapper');

export interface IWrapper {
    wrap(awssdk: typeof AWS): void;
}

export enum AWSTracerType {
    Request = 'Request',
    Logger = 'Logger',
}

export interface IWrapperConfig {
    tracer: AWSTracerType;
    exporters: string[];
    logger?: ILogger;
}

export interface IWrapperOptions {
    tracer?: AWSTracerType;
    logger?: ILogger;
}

export const DefaultWrapperConfig: IWrapperConfig = {
    tracer: AWSTracerType.Request,
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
    public setTracer(type: AWSTracerType) {
        this.config.tracer = type;
    }
    public wrap(awssdk: typeof AWS): void {
        if (this.isAlreadyWrapped(awssdk)) {
            throw new Error(
                'AWS SDK is already wrapped; did you mean to unwrap()?'
            );
        }
        switch (this.config.tracer) {
            case AWSTracerType.Logger:
                this.attachLogger(awssdk);
                break;
            case AWSTracerType.Request:
                this.replaceRequest(awssdk);
                break;
            default:
                throw new Error(`unsupporter tracer type: ${this.config.tracer}`);
        }
    }
    public unwrap(awssdk: typeof AWS): void {
        if (awssdk.config.logger instanceof AWSLogger) {
            awssdk.config.logger = undefined;
        }
        if (awssdk.Request instanceof this.tracer.tracerClass) {
            awssdk.Request = this.tracer.originalRequest;
        }
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
    private attachLogger(awssdk: typeof AWS): void {
        awssdk.config.logger = new AWSLogger(
            this,
            {
                logger: this.config.logger,
            }
        );
        debug('logger attached');
    }
    private replaceRequest(awssdk: typeof AWS): void {
        awssdk.Request = this.tracer.tracerClass;
        debug('request replaced');
    }
    private isAlreadyWrapped(awssdk: typeof AWS): boolean {
        return awssdk.config.logger instanceof AWSLogger
            || awssdk.Request instanceof this.tracer.tracerClass;
    }
}
