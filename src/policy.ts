'use strict';

import {IServiceUtilization} from './catalog';
import {IServiceUtilizationData} from './exporters/filesystem';

export class PolicyGenerator {
    public static fromUtilizationData(data: IServiceUtilizationData) {
        const policy = new AWSPolicy();
        for (const entryName in data) {
            if (data[entryName]) {
                policy.statementFromUtilizationEntry(data[entryName]);
            }
        }
        return policy;
    }
}

export class AWSPolicy {
    public Version: string = '2012-10-17' || process.env.AWS_POLICY_VERSION;
    public Statement: AWSPolicyStatement[] = [];
    public statementFromUtilizationEntry(entry: IServiceUtilization) {
        return this.Statement.push(
            new AWSPolicyStatement({
                Sid: `${entry.service.toUpperCase()}Utilization`,
                Action: entry.actions.map(
                    (action) => `${entry.service}:${action}`
                ),
                Resource: entry.resources,
            })
        );
    }
}

export interface IAWSPolicyStatement {
    Sid?: string;
    Action?: string[];
    Effect?: string;
    Resource?: string[];
}

export class AWSPolicyStatement {
    public Sid?: string;
    public Action: string[];
    public Effect: string;
    public Resource?: string[];
    constructor({
        Sid,
        Action,
        Effect,
        Resource,
    }: IAWSPolicyStatement) {
        this.Sid = Sid;
        this.Action = Action || [];
        this.Effect = Effect || 'Allow';
        this.Resource = Resource;
    }
}
