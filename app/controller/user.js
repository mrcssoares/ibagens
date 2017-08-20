/**
 * Created by marcos on 19/08/17.
 */
let db = require('../../config/dbConnection');
let jwt = require('jsonwebtoken');
let _ = require('lodash');

let mysql = require("mysql");

let secretKey = "minhaChaveSuperSecreta";

function createToken(user) {
    return jwt.sign(_.omit(user, 'password'), secretKey, { expiresIn: 60*60*5 });
}

function getUserDB(email, done) {
    db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email], function(err, rows, fields) {
        if (err) throw err;
        done(rows[0]);
    });
}

module.exports = function () {
    let controller = {};

    controller.getUsers = function (request, response) {
        db.query("SELECT * FROM users", function (err, result) {
            if (err) throw err;
            response.status(200).send(result)
        });
    };

    controller.postUser = function (request, response) {
            if (!request.body.email || !request.body.password || !request.body.name) {
                return response.status(400).send("Verifique os campos");
            }
            getUserDB(request.body.email, function(user){

                //se usuário não existe, o cria
                if(!user) {
                    user = {
                        name: request.body.name,
                        password: request.body.password,
                        email: request.body.email
                    };


                    db.query('INSERT INTO users SET ?', [user], function(err, result){
                        if (err) throw err;
                        newUser = {
                            id: result.insertId,
                            name: user.name,
                            password: user.password,
                            email: user.email
                        };
                        response.status(201).send({
                            user: newUser,
                            token: createToken(newUser)
                        });
                    });
                }
                else response.status(400).send("A user with that email already exists");
            });
    };


    controller.loginUser = function (request, response) {

        if (!request.body.email || !request.body.password || !request.body.name) {
            return response.status(400).send("verifique os campos");
        }
        getUserDB(request.body.email, function(user){
            if (!user) {
                return response.status(401).send({
                    status: 1,
                    message: "The name is not existing"
                });
            }
            if (user.password !== request.body.password) {
                return response.status(401).send({
                    status: 2,
                    message: "The name or password don't match"
                });
            }
            response.status(201).send({
                user: user,
                token: createToken(user)
            });
        });

    };

    controller.userCheck = function (request, response) {
        if (!req.params.username) {
            return res.status(400).send("You must send a username");
        }
        getUserDB(req.params.username, function (user) {
            if (!user) res.status(201).send({username: "OK"});
            else res.status(400).send("A user with that username already exists");
        });

    };


    return controller;
};