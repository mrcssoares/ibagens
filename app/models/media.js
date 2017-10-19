/**
 * Created by marcos on 13/09/17.
 */
let multer  = require('multer');
let fs   = require('fs');
let path = require('path');
let execProcess = require('../utils/execprocess');

/*
* Gerencia o local que o arquivo será salvo
* */
let _managerStorage = multer.diskStorage({
    destination: 'imgs/uploads/' ,filename: function (request, file, callback) {

        let ext = file.originalname.split('.')[1];
        callback(null, file.fieldname + '_' + Date.now() + '.'+ ext);
    }
});

/**
 * Função responsável por fazer upload de uma arquivo para uma chat.
 */

let _uploadImage = multer({
    storage: _managerStorage,
    fileFilter: function (request, file, callback) {
        let mimetype = file.mimetype;
        console.log(mimetype);
        if(!/image|audio/.test(mimetype)) {
            return callback(new Error("child \"file\" fails because \"type\" must be a image or a audio"));
        }else {
            callback(null, true)
        }
    }

});

module.exports = {
    uploadImage: _uploadImage
};
