'use strict';

import Debug from 'debug';
import {EventEmitter} from 'events';
import {ITracerEvent} from './tracer';

const debug = Debug('aws-sdk-tracer:catalog');

export enum ServiceUtilizationCatalogEvents {
    Updated = 'Updated',
}

export interface IServiceUtilization {
    service: string;
    actions: string[];
    resources: string[];
}

export class ServiceUtilizationCatalog extends EventEmitter {
    private catalog: Map<string, IServiceUtilization>;
    constructor() {
        super();
        this.catalog = new Map<string, IServiceUtilization>();
        debug('created');
    }
    public digestTrace(event: ITracerEvent) {
        const entry = this.catalog.get(event.serviceName);
        let updated = false;
        if (entry) {
            if (!entry.actions.includes(event.operation)) {
                entry.actions.push(event.operation);
            }
            this.resourcesFromParams(event.params).forEach((resource) => {
                if (!entry.resources.includes(resource)) {
                    entry.resources.push(resource);
                    updated = true;
                }
            });
        } else {
            this.catalog.set(
                event.serviceName,
                {
                    service: event.serviceName,
                    actions: [event.operation],
                    resources: this.resourcesFromParams(event.params),
                }
            );
            updated = true;
        }
        if (updated) {
            debug('updated');
            this.emit(ServiceUtilizationCatalogEvents.Updated, this);
        }
    }
    public getServiceUsage() {
        return this.catalog.values();
    }
    private resourcesFromParams(params: any) {
        const resources: string[] = [];
        for (const prop in params) {
            if (params[prop] && 'string' === typeof params[prop]) {
                if (params[prop].includes('arn')) {
                    resources.push(params[prop]);
                }
            }
        }
        return resources;
    }
}
