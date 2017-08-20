/**
 * Created by marcos on 20/08/17.
 */
let db = require('../../config/dbConnection');

module.exports = function () {
    let controller = {};

    controller.getImages = function (request, response) {

        db.query('SELECT * FROM images', function(err, rows) {
            if (err) throw err;
            response.status(200).send(rows);
        });

    };

    return controller;

};