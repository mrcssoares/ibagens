/**
 * Created by marcos on 19/08/17.
 */
let express = require('express');
let load = require('express-load');


let bodyParser = require('body-parser');

// let cors = require('cors'); //after the line var bodyParser = require('body-parser');
let morgan = require('morgan');
let method = require ('method-override');

Consts = require('./const');



module.exports = function(){

    let app = express();

    app.use(express.static('./uploads'));
    app.use(bodyParser.json({limit: '50mb'}));

    app.use(function (error, req, res, next) {
        if (error instanceof SyntaxError) {
            let result = {};
            result.error = 'body invalid, because body must be um JSON';
            res.status(400).send(result);
        } else {
            next();
        }
    });

    app.use(
        bodyParser.urlencoded({
            extended: true,
            parameterLimit: 10000,
            limit: 1024 * 1024 * 10
        })
    );

    app.use(morgan("dev"));

    // app.use(cors()); //after the line app.use(logger('dev'));

    app.all('*',function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT,PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization, client, version");
        res.header('Authorization', "*");
        res.header('Cache-Control', 'no-cache');


        if('OPTIONS' == req.method){
            return next();
        }

        next();

    });


    load('models',{cwd:'app'})
        .then('controller')
        .then('routes')
        .into(app);



    app.use(method());



    return app;
};



