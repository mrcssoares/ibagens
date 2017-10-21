/**
 * Created by marcos on 20/08/17.
 */
let db = require('../../config/dbConnection');
const media = require('../models/media');
let execProcess = require('../utils/execprocess');
let fs   = require('fs');


module.exports = function () {
    let controller = {};

    controller.getImgs = function (request, response) {
        console.log(request.iduser);

        db.query('SELECT * FROM images WHERE idUser = ?', [request.iduser], function(err, rows) {
            if (err) throw err;
            response.status(200).send(rows);
        });

    };

    controller.uploadImgs = function (request, response) {
        //id do usuário extraido do token
        console.log(request.iduser);
        let idUser = request.iduser;

        let result = {};
        let upload = media.uploadImage.single('file');

        upload(request, response, function (error) {
            let json = request.body;

            //verificação de erro
            if(error) {
                result.error = error.message;
                return response.status(422).send(result);
            }

            //segunda verificação em caso da primeira falhar
            if(request.file === undefined){
                result.error = "child \"file\" fails because [\"file\" is required]";
                return response.status(422).send(result);
            }

            let image = {
                idUser: idUser,
                img : request.file.filename
            };


            db.query('INSERT INTO images SET ?',[image], function (err, result) {
                if (err) throw err;

                image.id = result.insertId;

                return response.status(200).send({
                    message: 'image upload successfully',
                    image: image
                });
            });

        });
    };

    controller.defaultImg = function (request, response) {
        let image = decodeURIComponent(request.params.image);


        let srcImage = global.imagePath+image;

        //Verifica se a imagem passada existe.
        if (!fs.existsSync(srcImage)){
            response.status(404).json({"error":"Image passada não existe."});
            return;
        }

        response.sendFile(srcImage);
    };

    controller.resizeImg = function (request, response) {
        let image = decodeURIComponent(request.params.image);
        //separa nome e formato da imagem
        let name = decodeURIComponent(request.params.image).split('.')[0];
        let ext  = decodeURIComponent(request.params.image).split('.')[1];

        let srcImage = global.imagePath+image;

        //Verifica se a imagem passada existe.
        if (!fs.existsSync(srcImage)){
            response.status(404).json({"error":"Image passada não existe."});
            return;
        }

        let commands = decodeURIComponent(request.params.commands);
        let outImage = global.imageCuston + name+'_resize_'+ commands.split(',')[0] +'.'+ ext;

        //verifica se a imagem ja foi convertida nos formatos informados
        if (!fs.existsSync(outImage)){
            let command = `convert ${srcImage} -resize ${sizeIntelligent(commands.split(',')[0])} ${outImage}`;
            console.log(command);

            execProcess.result(command).then(value=>{
                console.log(value);
                response.sendfile(outImage);
            }).catch(error => {
                result.error = error;
                response.status(500).send(result);
            });
        }else{
            console.log('imagem já convertida neste formato');
            response.sendFile(outImage);
        }


    };

    return controller;

};


/**
 * Função interna para garantir que a imagem não fará um resize desnecessário.
 */
let sizeIntelligent = (size) =>  size + '\\>';

/**
 * Para o blur o site inteligente não funcionou, então foi necessário fazer uma calculo manual.
 */
function sizeManual(size, file) {
    let newWidth = size.split('x')[0];
    let newheight = size.split('x')[1];

    let newArea = newWidth * newheight;
    let oldArea = file.width * file.height;

    if (newArea < oldArea){
        return size;
    }else{
        return file.width+'x'+file.height;
    }
}