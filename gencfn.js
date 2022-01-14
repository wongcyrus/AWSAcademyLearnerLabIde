'use strict';
const fs = require('fs');

let jsonData = require('./cdk.out/ide-stack-dev.template.json');
delete jsonData.Parameters;
delete jsonData.Rules;

let data = JSON.stringify(jsonData, null, 2);

const fileName = process.argv[2] === undefined ? 'windowside' : process.argv[2];
console.log(fileName);
fs.writeFile(`./cloudformation/${fileName}.json`, data, (err) => {
    if (err) throw err;
    console.log('Template written to file');
});
