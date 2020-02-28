'use strict';

import Debug from 'debug';
import _ from 'lodash';

import {Logger} from 'aws-sdk/lib/config';
import {ILogger} from './common';
import {Wrapper} from './wrapper';

const debug = Debug('logger');

// tslint:disable-next-line: max-line-length
const regex = /\[AWS (?<serviceName>.{3}) (?<statusCode>\d{3}) (?<responseTime>.+s) (?<retires>\d{1}) retries\] (?<action>.+)\((?<paramsString>.+)\)/;

export interface IAWSLoggerConfig {
    errorOnParseFailure?: boolean;
    logger?: ILogger;
}

export interface IAWSLoggerOptions {
    errorOnParseFailure?: boolean;
    logger?: ILogger;
}

export const DefaultLoggerConfig: IAWSLoggerConfig = {
    errorOnParseFailure: false,
};

export interface IAWSLogMessage {
    serviceName: string;
    responseCode: string;
    responseTime: string;
    retries: string;
    operation: string;
    params: any;
}

export class AWSLogger implements Logger {
    private config: IAWSLoggerConfig & IAWSLoggerOptions;
    private wrapper: Wrapper;
    constructor(
        wrapper: Wrapper,
        opts?: IAWSLoggerOptions
    ) {
        this.config = _.defaultsDeep(
            opts,
            DefaultLoggerConfig
        );
        this.wrapper = wrapper;
        debug('created');
    }
    public log(...args: any[]): void {
        const data = this.anyToLogMessage(args);
        this.wrapper.catalog.digestEvent(data);
        if (this.config.logger && _.isFunction(this.config.logger.log)) {
            this.config.logger.log(...args);
        }
    }
    private anyToLogMessage(...args: any[]): IAWSLogMessage | undefined {
        if (!args[0]) {
            return undefined;
        }
        try {
            const {
                // @ts-ignore
                groups: {
                    serviceName,
                    statusCode,
                    responseTime,
                    retries,
                    action,
                    paramsString,
                },
            } = String(args[0]).match(regex);
            const message: IAWSLogMessage = {
                serviceName,
                responseCode: statusCode,
                responseTime,
                retries,
                operation: action,
                params: this.parseParamsString(paramsString),
            };
            return message;
        } catch (error) {
            if (this.config.errorOnParseFailure) {
                throw new Error(`failed to process log message: ${error.message || error}`);
            }
            debug(`failed to process log message: ${error.message || error}`);
        }
        return;
    }
    private parseParamsString(paramstring: string): any {
        try {
            const parsed = (paramstring.match(/'([^']*)'/g) || [])
                .map((v) => v.replace(/\'/g, ''));
            const params: any = {};
            parsed.forEach((value, i) => {
                params[i] = value;
            });
            return params;
        } catch (error) {
            if (this.config.errorOnParseFailure) {
                throw new Error(`failed to process log message: ${error.message || error}`);
            }
            debug(`failed to process log message: ${error.message || error}`);
        }
    }
}
