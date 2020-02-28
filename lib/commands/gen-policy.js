#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const policy_1 = require("../policy");
const [, , ...args] = process.argv;
let filepath = '/tmp/aws-sdk-tracer.json' || process.env.AWS_SDK_TRACER_OUTPUT;
if (args.length) {
    filepath = args[0];
}
if (!fs_1.default.existsSync(filepath)) {
    throw new Error(`file not found at path: ${filepath}`);
}
const loaded = JSON.parse(fs_1.default.readFileSync(filepath).toString());
const policy = policy_1.PolicyGenerator.fromUtilizationData(loaded);
console.log(JSON.stringify(policy, null, 2));
process.exit(0);
//# sourceMappingURL=gen-policy.js.map