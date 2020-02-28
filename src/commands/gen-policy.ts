#!/usr/bin/env node

import fs from 'fs';

import {PolicyGenerator} from '../policy';

const [, , ...args] = process.argv;

let filepath = '/tmp/aws-sdk-tracer.json' || process.env.AWS_SDK_TRACER_OUTPUT;

if (args.length) {
    filepath = args[0];
}

if (!fs.existsSync(filepath)) {
    throw new Error(`file not found at path: ${filepath}`);
}

const loaded = JSON.parse(fs.readFileSync(filepath).toString());

const policy = PolicyGenerator.fromUtilizationData(loaded);

console.log(JSON.stringify(policy, null, 2));

process.exit(0);
