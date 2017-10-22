/**
 * Created by marcos on 20/08/17.
 */
let db = require('../../config/dbConnection');
const media = require('../models/media');
let execProcess = require('../utils/execprocess');
let fs   = require('fs');

Consts = require('../../config/const');
let consts = new Consts();



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

    controller.transformImg = function (request, response) {
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
        let imgCommandsName = commands.replace(/,/g, '_');

        //split converte o elemento para vetor, possuindo ou  não o ','
        let transforms = IdentifyCommands(commands.split(','));
        let outImage = global.imageCuston + name + imgCommandsName + '.' + ext;

        //verifica se a imagem ja foi convertida nos formatos informados
        if (!fs.existsSync(outImage)){
            let command = `convert ${srcImage} -resize ${transforms} ${outImage}`;
            console.log(command);

            execProcess.result(command).then(value=>{
                console.log(value);
                response.sendFile(outImage);
            }).catch(error => {
                result.error = error;
                response.status(500).send(result);
            });
        }else{
            console.log('Imagem já convertida neste formato');
            response.sendFile(outImage);
        }
    };

    return controller;

};

//espera um vetor de comandos
function IdentifyCommands(commands) {
    console.log(commands);
    //[ 'w_150', 'r_150', 'batata', 'arroz', 'mulheres' ]
    if(commands.length === 1) {
        if (commands[0].split('_')[0] === 'w') {
          return resize(commands[0].split('_')[1], null, consts.IM.rdf);
        }
        if(commands[0].split('_')[0] === 'h'){
          return resize(null, commands[0].split('_')[1], consts.IM.rdf);
        }
    }
    if(commands.length === 2){
        if (commands[0].split('_')[0] === 'w' && commands[1].split('_')[0] === 'h') {
            return resize(commands[0].split('_')[1], commands[1].split('_')[1], consts.IM.rdf);
        }
        if (commands[0].split('_')[0] === 'h' && commands[1].split('_')[0] === 'w') {
            return resize(commands[0].split('_')[1], commands[1].split('_')[1], consts.IM.rdf);
        }
    }
    if(commands.length > 2){

    }
    return null;
}

/*
* w: altura
* h: largura
* i: influencia sobre o redimencionamento
* */
function resize(w, h, i) {
    if(w && h)
        return w + 'x' + h + i;
    else if(w)
        return w + 'x' + w + i;
    else if(h)
        return h + 'x' + h + i;
}


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