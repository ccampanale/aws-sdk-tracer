import AWS from 'aws-sdk';

export import Exporters = require('./exporters');
export import Tracer = require('./tracer');
export import Wrapper = require('./wrapper');

export interface IAWSSDKTracerBundle {
    AWS: typeof AWS;
    wrapper: Wrapper.Wrapper;
}

export function wrapAWSSDK(
    awssdk: typeof AWS,
    opts?: Wrapper.IWrapperOptions
): IAWSSDKTracerBundle {
    const aWrapper = new Wrapper.Wrapper(opts);
    aWrapper.wrap(awssdk);
    return {
        AWS: awssdk,
        wrapper: aWrapper,
    };
}
