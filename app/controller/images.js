/**
 * Created by marcos on 20/08/17.
 */
let db = require('../../config/dbConnection');
const media = require('../models/media');

module.exports = function () {
    let controller = {};

    controller.getImages = function (request, response) {

        db.query('SELECT * FROM images', function(err, rows) {
            if (err) throw err;
            response.status(200).send(rows);
        });

    };

    controller.uploadImgs = function (request, response) {

        let result = {};
        let upload = media.uploadImage.single('file');

        upload(request, response, function (error) {
            let json = request.body;

            if(error) {
                result.error = error.message;
                return response.status(422).send(result);
            }

            if(request.file === undefined){
                result.error = "child \"file\" fails because [\"file\" is required]";
                return response.status(422).send(result);
            }

            result.file = request.file.filename;
            return response.status(200).send(result);
        });
    };


    return controller;

};
