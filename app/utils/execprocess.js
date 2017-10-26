let exec = require('child_process').exec;
let result = function (command) {
    return new Promise((resolve, reject) => {
        let child = exec(command, function (err, stdout, stderr) {
            if(err !== null){
                reject(new Error(err));
            }else if(typeof(stderr) !== "string"){
                reject(new Error(stderr));
            }else {
                resolve(stdout);
            }
        })
    });
};

exports.result = result;