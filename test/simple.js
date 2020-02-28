const AWSSDKTracer = require('../');

const wrapperOpts = {
    logger: console,
    exporters: [
        'filesystem',
        'http'
    ]
};

const {AWS, wrapper} = AWSSDKTracer.wrapAWSSDK(require('aws-sdk'), wrapperOpts); 

const ECS = new AWS.ECS();

ECS.listClusters()
    .promise()
    .then(data => {
        return Promise.all(
            data.clusterArns.map(arn => {
                return ECS.listTasks({
                    cluster: arn
                }).promise();
            })
        );
    }).then(taskArrays => {
        console.log(taskArrays);
        wrapper.printUtilization();
    })
    .catch(err => {
        console.error(err);
    });


exports = wrapper;
