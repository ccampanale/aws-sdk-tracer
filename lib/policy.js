'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class PolicyGenerator {
    static fromUtilizationData(data) {
        const policy = new AWSPolicy();
        for (const entryName in data) {
            if (data[entryName]) {
                policy.statementFromUtilizationEntry(data[entryName]);
            }
        }
        return policy;
    }
}
exports.PolicyGenerator = PolicyGenerator;
class AWSPolicy {
    constructor() {
        this.Version = '2012-10-17' || process.env.AWS_POLICY_VERSION;
        this.Statement = [];
    }
    statementFromUtilizationEntry(entry) {
        return this.Statement.push(new AWSPolicyStatement({
            Sid: `${entry.service.toUpperCase()}Utilization`,
            Action: entry.actions.map((action) => `${entry.service}:${action}`),
            Resource: entry.resources,
        }));
    }
}
exports.AWSPolicy = AWSPolicy;
class AWSPolicyStatement {
    constructor({ Sid, Action, Effect, Resource, }) {
        this.Sid = Sid;
        this.Action = Action || [];
        this.Effect = Effect || 'Allow';
        this.Resource = Resource;
    }
}
exports.AWSPolicyStatement = AWSPolicyStatement;
//# sourceMappingURL=policy.js.map