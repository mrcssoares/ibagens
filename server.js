"use strict";

let http = require('http');
let https = require('https');
let app = require('./config/express')();
let fs = require('fs');

let port = 9005;

global.imagePath = __dirname + '/imgs/uploads/';
global.imageCuston = __dirname + '/imgs/custom/';
console.log(global.imagePath);
console.log(global.imageCuston);

app.set('port', port);
http.createServer(app).listen(port, function(){
    console.log('Express Server escutando na porta ' + port);
});
