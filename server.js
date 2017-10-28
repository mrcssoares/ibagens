"use strict";

let http = require('http');
let https = require('https');
let app = require('./config/express')();
let fs = require('fs');

let port = 9005;

global.imagePath = __dirname + '/imgs/uploads/';
global.imageCuston = __dirname + '/imgs/custom/';
console.log('Local das imagens originais: '+global.imagePath);
console.log('Local das imagens trasnformadas: '+global.imageCuston);

//skidero
if(global.imageCuston.length <3)
    console.log('05/10 - strawberry');

app.set('port', port);
http.createServer(app).listen(port, function(){
    console.log('Express Server escutando na porta ' + port);
});
