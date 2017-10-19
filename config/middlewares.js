let jwt = require('express-jwt');
let db = require('./dbConnection');

Consts = require('./const');

let consts = new Consts();
let secretKey = consts.secretKey;

let jwtCheck = jwt({
    secret: secretKey
});

function verifyToken(auth,  done) {
    db.query('SELECT * FROM users WHERE token = ? LIMIT 1', [auth], function(err, rows, fields) {
        if (err) throw err;
        done(rows[0]);
    });
}

function _ensureAuthorized(req, res, next) {
    let bearerToken;
    let bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        let bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;

        verifyToken(bearerToken, function (user) {
            if(!user) {
                res.status(403).send({
                    message: 'com esse token ai eu não vou te dar nada não.'
                });
            }else{
                req.iduser = user.id;
                next();
            }
        });

    } else {
        res.status(403).send({
                message: 'Cadê o authorization parsa?'
            }
        );
    }
}


module.exports = {
    ensureAuthorized: _ensureAuthorized
};
