'use strict';

import * as AWS from 'aws-sdk';
import Debug from 'debug';
import {EventEmitter} from 'events';
import _ from 'lodash';

import {Wrapper} from './wrapper';

const debug = Debug('aws-sdk-tracer:tracer');

export interface ITracer {
    on(event: TracerEvents.Trace, listener: (trace: ITracerEvent) => void): void;
}

export interface ITracerConfig {
    logger?: { log(...args: any[]): void };
}

export interface ITracerOptions {
    logger?: { log(...args: any[]): void };
}

export const DefaultTracerConfig: ITracerConfig = {
};

export interface ITracedRequest<D, E> extends AWS.Request<D, E> {
    getOperation(): string;
    getParams(): any | undefined;
    getRegion(): string;
    getServiceName(): string;
}

export enum TracerEvents {
    Trace = 'Trace',
}

export class Tracer extends EventEmitter implements ITracer {
    private tracerConfig: ITracerConfig & ITracerOptions;
    private wrapper: Wrapper;
    private traces: ITracerEvent[];
    constructor(
        wrapper: Wrapper,
        opts?: ITracerOptions
    ) {
        super();
        this.tracerConfig = _.defaultsDeep(
            opts,
            DefaultTracerConfig
        );
        this.traces = new Array<ITracerEvent>();
        this.wrapper = wrapper;
        this.on(TracerEvents.Trace, (trace: ITracerEvent) => {
            this.traces.push(trace);
            if (this.tracerConfig.logger) {
                this.tracerConfig.logger.log(trace);
            }
            this.wrapper.catalog.digestEvent(trace);
        });
        debug('created');
    }
    public getTracedRequestClass() {
        const self = this;
        return class TracedRequest<D, E>
            extends AWS.Request<D, E>
            implements ITracedRequest<D, E> {
            private readonly TRACER: Tracer = self;
            private readonly tracedOperation: string;
            private readonly tracedParams?: any;
            private readonly tracedService: AWS.Service;
            constructor(
                service: AWS.Service,
                operation: string,
                params?: any
            ) {
                super(service, operation, params);
                this.tracedOperation = operation;
                this.tracedParams = params;
                this.tracedService = service;
                this.on('success', (response) => {
                    this.TRACER.handleRequestSuccess<D, E>(this, response);
                });
            }
            public getOperation() {
                return this.tracedOperation;
            }
            public getParams() {
                return this.tracedParams;
            }
            public getRegion() {
                return this.tracedService.config.region!;
            }
            public getServiceName() {
                return this.tracedService.endpoint.host.split('.')[0];
            }
        };
    }
    private handleRequestSuccess<D, E>(
        request: ITracedRequest<D, E>,
        response: AWS.Response<D, E>
    ) {
        const trace: ITracerEvent = {
            requestId: response.requestId,
            region: request.getRegion(),
            serviceName: request.getServiceName(),
            operation: request.getOperation(),
            params: request.getParams(),
        };
        this.emit(TracerEvents.Trace, trace);
    }
}

export interface ITracerEvent {
    requestId: string;
    region: string;
    serviceName: string;
    operation: string;
    params: any;
}
