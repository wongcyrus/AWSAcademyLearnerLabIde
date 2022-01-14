const {awscdk} = require("projen");

const amiId = 'ami-065024219ebe5213e';
// const devTools = ['pycharm','webstorm','intellijidea','php','phpstorm'];
const devTools = ['pycharm'];

const fileName = devTools.map(c => c.replace(/\W/g, '')).join('_');

const project = new awscdk.AwsCdkTypeScriptApp({
    cdkVersion: "2.8.0",
    defaultReleaseBranch: "main",
    name: "aws-academy-learner-lab-ide",
    keywords: [
        'cdk',
        'aws academy learner lab',
    ],
    context: {
        'amiId': amiId,
        'devTools': devTools
    }
    // deps: [],                /* Runtime dependencies of this module. */
    // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
    // devDeps: [],             /* Build dependencies for this module. */
    // packageName: undefined,  /* The "name" in package.json. */
});
project.addTask('gencfn', {
    exec: `cdk synth -q && node gencfn.js ${fileName}`
})
project.synth();