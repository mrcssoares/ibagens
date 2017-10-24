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
            let command = `convert ${srcImage} ${transforms} ${outImage}`;
            console.log(command);

            execProcess.result(command).then(value=>{
                console.log(value);
                response.sendFile(outImage);
            }).catch(error => {
                result.error = error;
                response.status(500).send(result);
            });
        }else{
            console.log('Imagem aproveitada da base ja convertida');
            response.sendFile(outImage);
        }
    };

    return controller;

};


let flags = [];
flags['fill'] = '^';
flags['crop'] = '^ \ -gravity center -extent :wx:h';
flags['gray'] = ' -colorspace Gray -gamma 2.2';
flags[''] = '\\!';

/**
 * commands: vetor de comandos [command, command, command, (...), command]
 * @return {string}
 */
function IdentifyCommands(commands) {
    console.log(commands);

    //para apenas um parametro, esse conjunto de funções
    if(commands.length === 1) {
        //porcentagem passada
        if(commands[0].split('_')[0] === 'p'){
            return commands[0].split('_')[1]*100 + '%';
        }

        //escala de cinza
        if(commands[0] === 'gray') {
            return flags[commands[0]];
        }

        //aparentemente não faz nada so evita uma trava na requisição
        if(commands[0] === 'fill'){
            return '';
        }

        //outros casos, acho que um com _ e letras apoós quebra, quebra mais não, coloquei um parse int.
        return resize(commands[0].split('_')[1] , null, flags['']);

    }

    //se dois parametros
    if(commands.length === 2){
        if (commands[0].split('_')[0] === 'w' && commands[1].split('_')[0] === 'h') {
            return resize(commands[0].split('_')[1], commands[1].split('_')[1], flags['']);
        }
        if (commands[0].split('_')[0] === 'h' && commands[1].split('_')[0] === 'w') {
            return resize(commands[1].split('_')[1], commands[0].split('_')[1], flags['']);
        }

        //provisorio: caso um valor + o gray_scale
        if (commands[0].split('_')[0] === 'w' && commands[1] === 'gray' || commands[0].split('_')[0] === 'h' && commands[1] === 'gray') {
            return resize(commands[0].split('_')[1], null, flags['']) + flags[commands[1]];
        }

        //mantendo o aspecto
        if (commands[0].split('_')[0] === 'w' && commands[1] === 'fill' || commands[0].split('_')[0] === 'h' && commands[1] === 'fill') {
            return resize(commands[0].split('_')[1], null, flags[commands[1]]);
        }

        //corte malicioso
        if(commands[0].split('_')[0] === 'w' && commands[1] === 'crop' || commands[0].split('_')[0] === 'h' && commands[1] === 'crop'){
            return resize(commands[0].split('_')[1], null, flags[commands[1]]);
        }

        return resize(commands[0].split('_')[1] , null, flags['']);
    }

    //se mais de dois parametros
    if(commands.length === 3){
        //por exemplo, duas dimenções mais crop ou gray
        if (commands[0].split('_')[0] === 'w' && commands[1].split('_')[0] === 'h') {
            return resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[commands[2]]);
        }
        if (commands[0].split('_')[0] === 'h' && commands[1].split('_')[0] === 'w') {
            return resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[commands[2]]);
        }

        //corte malicioso com suporte a gray
        if(commands[0].split('_')[0] === 'w' && commands[1] === 'crop' || commands[0].split('_')[0] === 'h' && commands[1] === 'crop'){
            return resize(commands[0].split('_')[1], null, flags[commands[1]]) + flags[commands[2]];
        }
    }

    //se mais de dois parametros
    if(commands.length === 4) {
        if (commands[0].split('_')[0] === 'w' && commands[1].split('_')[0] === 'h') {
            return resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[commands[2]]) + flags[commands[3]];
        }
        if (commands[0].split('_')[0] === 'h' && commands[1].split('_')[0] === 'w') {
            return resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[commands[2]]) + flags[commands[3]];
        }
    }

    return '';
}

/*
* w: altura
* h: largura
* i: influencia sobre o redimencionamento
* */
function resize(w, h, i) {
    //removendo o que não for digito
    if(w)
        w = w.replace(/[^\d]+/g,'');
    if(h)
        h = h.replace(/[^\d]+/g,'');

    //fazendo verificações para cortes
    if(i) {
        console.log('i: '+i);
        if (w && h)
            i = i.replace(':w', w).replace(':h', h);
        if (w)
            i = i.replace(':w', w).replace(':h', w);
    }

    //verificaçõoes para montar o resize + combinações
    if(w && h)
        return '-resize ' + w + 'x' + h + i;
    else if(w)
        return '-resize ' + w + 'x' + w + i;
    if(w === undefined || w === null)
        return '';
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