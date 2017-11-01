/**
 * Created by marcos on 20/08/17.
 */
let db = require('../../config/dbConnection');
const media = require('../models/media');
let execProcess = require('../utils/execprocess');
let fs   = require('fs');
let im = require('imagemagick');


let {Image} = require('../models/image.js');

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
        let outImage = global.imageCuston + name + '_' + imgCommandsName + '.png';

        //verifica se a imagem ja foi convertida nos formatos informados
        if (!fs.existsSync(outImage)){
            try {
                if (transforms.length > 2) {
                    im.identify(srcImage, function (err, features) {
                        let command = `convert ${srcImage} -filter Gaussian -resize 95x95 -define filter:sigma=5.0 ${sizeManual(transforms[2], features)}  ${outImage}`;
                        if (transforms.length > 3) {
                            command = command + ` && convert ${outImage} ${transforms[3]} ${outImage}`;
                        }
                        console.log(command);
                        execProcess.result(command).then(value => {
                            console.log(value);
                            response.sendFile(outImage);
                        }).catch(error => {
                            result.error = error;
                            response.status(500).send(result);
                        });
                    });
                } else {
                    let command = `convert ${srcImage} ${transforms[0]} ${outImage}`;
                    if (transforms.length > 1) {
                        command = command + ` && convert ${outImage} ${transforms[1]} ${outImage}`;
                    }
                    console.log(command);
                    execProcess.result(command).then(value => {
                        console.log(value);
                        response.sendFile(outImage);
                    }).catch(error => {
                        result.error = error;
                        response.status(500).send(result);
                    });
                }
            }catch (e){
                console.log(e);
                response.end();
            }
        }else{
            console.log('Aproveitando imagem já convertida.');
            response.sendFile(outImage);
        }
    };



    controller.generateImg = function (request, response) {
        let commands = decodeURIComponent(request.params.commands);
        console.log(commands);
        let imgCommandsName = commands.replace(/:/g, '_').replace(/ /g, '_');
        if(commands.split(':')[0] === 'name') {
            let fullName = commands.split(':')[1];
            console.log(fullName);
            let name = new Image().generateImageByName(imgCommandsName, fullName).then(name => {
                let path = `${global.imageCuston}${name}`;
                console.log(path);
                response.status(200).sendFile(path);
            }).catch(error => {
                response.status(500).send({error: 'error to generate image.'});
            });
        }else if(commands.split(':')[0] === 'text'){

        }
    }

    return controller;

};

let cflags = {
    fill: 'fill',
    crop: 'crop',
    adcrop: 'adcrop',
    gray: 'gray',
    circle: 'circle',
    porcentage: 'p',
    blur: 'blur',
    width: 'w',
    height: 'h'
};


let flags = [];
flags[cflags.fill] = '^';
flags[cflags.crop] = '^ \ -gravity center -extent :wx:h';
flags[cflags.adcrop] = ' -crop :wx:h+:LW+:LH';
flags[cflags.gray] = ' -colorspace Gray -gamma 2.2';
flags[cflags.circle] = ' -resize x800 -resize \'800x<\' -resize 50% -gravity center -crop 400x400+0+0 +repage  \\( +clone -threshold -1 -negate -fill white -draw "circle 200,200 200,0" \\) -alpha off -compose copy_opacity -composite \\-auto-orient';
flags[''] = '\\!';



/*
*
*  let command = `convert ${srcImage} -resize x800 -resize '800x<' -resize 50% -gravity center -crop 400x400+0+0 +repage  \\( +clone -threshold -1 -negate -fill white -draw "circle 200,200 200,0" \\) -alpha off -compose copy_opacity -composite \\-auto-orient ${outImage}`;
*  command += ` && convert ${outImage} -resize ${sizeIntelligent(size)} ${outImage}`;
* */

/**
 * commands: vetor de comandos [command, command, command, (...), command]
 * @return {[string]}
 */
function IdentifyCommands(commands) {
    console.log(commands);

    /*
    * VAI SER UM switch case bonitão!!
    * */
    switch (commands.length) {
        //para apenas um parametro, esse conjunto de funções
        case 1:
            //porcentagem passada
            if (commands[0].split('_')[0] === cflags.porcentage) {
                return ['-resize '+ commands[0].split('_')[1] * 100 + '%'];
            }

            //escala de cinza
            if (commands[0] === cflags.gray) {
                return [flags[commands[0]]];
            }

            //aparentemente não faz nada so evita uma trava na requisição
            if (commands[0] === cflags.fill) {
                return [''];
            }

            //circulo: com nenhum parametro de tamanho, circulo da imagem original
            if (commands[0] === cflags.circle) {
                return [flags[commands[0]]];
            }

            if(commands[0] === cflags.blur){
                return [null,null,'']
            }

            //outros casos, acho que um com _ e letras após quebra, quebra mais não, coloquei um parse int.
            return [resize(commands[0].split('_')[1], null, flags[''])];

            break;

        case 2:
            //redimencionamento basico
            if (commands[0].split('_')[0] === cflags.width && commands[1].split('_')[0] === cflags.height) {
                return [resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[''])];
            }
            if (commands[0].split('_')[0] === cflags.height && commands[1].split('_')[0] === cflags.width) {
                return [resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[''])];
            }

            //provisorio: caso um valor + o gray_scale
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.gray || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.gray) {
                return [resize(commands[0].split('_')[1], null, flags['']) + flags[commands[1]]];
            }

            //mantendo o aspecto
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.fill || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.fill) {
                return [resize(commands[0].split('_')[1], null, flags[commands[1]])];
            }

            //corte malicioso
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.crop || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.crop) {
                return [resize(commands[0].split('_')[1], null, flags[commands[1]])];
            }

            //circulo malicioso: com um parametro de tamanho
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.circle || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.circle) {
                return [flags[commands[1]], resize(commands[0].split('_')[1], null, flags[''])];
            }

            //circulo malicioso: com um parametro de tamanho
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.blur || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.blur) {
                return [null, null, [commands[0].split('_')[1]]];
            }


            return [resize(commands[0].split('_')[1], null, flags[''])];

            break;
        case 3:
            //verificando aos dois parametros de redimencionamento
            if (commands[0].split('_')[0] === cflags.width && commands[1].split('_')[0] === cflags.height) {
                //circulo malicioso: com os dois parametros de tamanho
                if(commands[2] === cflags.circle){
                    return [flags[commands[2]], resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[''])];
                //aplicando o blur
                }else if(commands[2] == cflags.blur) {
                    return [null, null, [commands[0].split('_')[1], commands[1].split('_')[1]]];
                //por exemplo, duas dimenções mais crop ou gray
                }else{
                    return [resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[commands[2]])];
                }
            }
            //tratando w e h invertidos
            if (commands[0].split('_')[0] === cflags.height && commands[1].split('_')[0] === cflags.width) {
                if(commands[2] === cflags.circle){
                    return [flags[commands[2]], resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[''])];
                //aplicando o blur
                }else if(commands[2] == cflags.blur) {
                    return [null, null, [commands[1].split('_')[1]], commands[0].split('_')[1]];
                //por exemplo, duas dimenções mais crop ou gray
                }else {
                    return [resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[commands[2]])];
                }
            }

            //verificando apenas um parametro de redimencionamento
            //provisorio: caso um valor + o gray_scale
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.gray || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.gray) {
                return [resize(commands[0].split('_')[1], null, flags[''] + flags[commands[1]] + flags[commands[2]])];
            }

            //mantendo o aspecto
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.fill || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.fill) {
                return [resize(commands[0].split('_')[1], null, flags[commands[1]] + flags[commands[2]])];
            }

            //corte malicioso com suporte a gray
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.crop || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.crop) {
                return [resize(commands[0].split('_')[1], null, flags[commands[1]] + flags[commands[2]])];
            }

            //blur's
            if (commands[0].split('_')[0] === cflags.width && commands[1] === cflags.blur || commands[0].split('_')[0] === cflags.height && commands[1] === cflags.blur) {
                return [null, null,[commands[0].split('_')[1], commands[0].split('_')[1]], flags[commands[2]]];
            }

            //blur's
            if (commands[0].split('_')[0] === cflags.width && commands[2] === cflags.blur || commands[0].split('_')[0] === cflags.height && commands[2] === cflags.blur) {
                return [null, null,[commands[0].split('_')[1], commands[0].split('_')[1]], flags[commands[1]]];
            }

            break;
        case 4:
            //redimencionamento normal mais dois parametros gray ou crop, ou gray ou fill
            if (commands[0].split('_')[0] === cflags.width && commands[1].split('_')[0] === cflags.height) {
                if(commands[2] == cflags.circle && commands[3] != cflags.blur){
                    return [flags[commands[2]], resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[commands[3]])];
                //gray + blur
                }else if(commands[2] == cflags.blur && commands[3] == cflags.gray || commands[3] == cflags.blur && commands[2] == cflags.gray) {
                    return [null, null, [commands[0].split('_')[1], commands[1].split('_')[1], flags[cflags.gray]]];
                //circler + blur
                }else if(commands[2] == cflags.blur && commands[3] == cflags.circle || commands[3] == cflags.blur && commands[2] == cflags.circle) {
                    return [null, null, [commands[0].split('_')[1], commands[1].split('_')[1], '' ], flags[cflags.circle]];
                //w,h + crop ou gray
                }else {
                    return [resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[commands[2]] + flags[commands[3]])];
                }
            }
            if (commands[0].split('_')[0] === cflags.height && commands[1].split('_')[0] === cflags.width) {
                if(commands[2] == cflags.circle && commands[3] != cflags.blur) {
                    return [flags[commands[2]], resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[commands[3]])];
                //gray ou blur
                }else if(commands[2] == cflags.blur && commands[3] == cflags.gray || commands[3] == cflags.blur && commands[2] == cflags.gray) {
                    return [null, null, [commands[1].split('_')[1], commands[0].split('_')[1], flags[cflags.gray]]];
                }
                //circle + blur
                else if(commands[2] == cflags.blur && commands[3] == cflags.circle || commands[3] == cflags.blur && commands[2] == cflags.circle) {
                    return [null, null, [commands[1].split('_')[1], commands[0].split('_')[1], ''], flags[cflags.circle]];
                //w,h + crop ou gray
                }else {
                    return [resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[commands[2]] + flags[commands[3]])];
                }
            }

            if(commands[0].split('_')[0] === cflags.height && commands[1] == cflags.circle){}

            break;

            // #TODO advanced crop by resize.
        case 5:
            if (commands[0].split('_')[0] === cflags.width && commands[1].split('_')[0] === cflags.height && commands[2] === cflags.adcrop) {
                return [resize(commands[0].split('_')[1], commands[1].split('_')[1], flags[commands[2]], commands[3], commands[4])];
            }
            if (commands[0].split('_')[0] === cflags.height && commands[1].split('_')[0] === cflags.width && commands[2] === cflags.adcrop) {
                return [resize(commands[1].split('_')[1], commands[0].split('_')[1], flags[commands[2]], commands[3], commands[4])];
            }
            break;

            //convert ThinkstockPhotos-487769015.jpg -crop 500x500+1000+100 teste.png

        default:
            return '';
    }
}

/*
* w: altura
* h: largura
* i: influencia sobre o redimencionamento
* */
function resize(w, h, i, lw, lh) {
    //removendo o que não for digito
    if(w)
        w = w.replace(/[^\d]+/g,'');
    if(h)
        h = h.replace(/[^\d]+/g,'');

    //fazendo verificações para cortes
    if(i) {
        if (w && h)
            i = i.replace(':w', w).replace(':h', h);
        if (w)
            i = i.replace(':w', w).replace(':h', w);
        console.log('i: '+i);

    }

    //verificaçõoes para montar o resize + combinações
    if(w && h) {

        //resize avançado
        if (lw && lh) {
            i = i.replace(':LW', lw).replace(':LH', lh);
            console.log('advanced: '+ i);
            return i;
        } else {
            return i;
        }

        console.log('-resize ' + w + 'x' + h + i);

    }else if(w) {
        return '-resize ' + w + 'x' + w + i;
    }
    if(w === undefined || w === null)
        return '';
}

/*
* app
* --controllers
*   --images.js
* --models
*   --media.js
* --routes
*   --images.js
* --utils
*   --execprocess.js
* config
* --dbConnection.js
* --express.js
* --middlewares.js
*       im.identify(srcImage, function(err, features) {
                let command = `convert ${srcImage} -filter Gaussian -resize 95x95 -define filter:sigma=5.0 -resize ${sizeManual(size, features)}  ${outImage}`;
                execProcess.result(command).then(value => {
                    console.log(value);
                    response.sendfile(outImage);
                }).catch( error => {
                    result.error = error;
                    response.status(500).send(result);
                });
            });
*
*
*
*
* */


/**
 * Para o blur o site inteligente não funcionou, então foi necessário fazer uma calculo manual.
 */
function sizeManual(commands, file) {
    let extra = '';
    let newWidth, newheight;
    if(commands.length == 0) {
        return '-resize ' + file.width+'x'+file.height;
    }else if(commands.length === 1){
        newWidth = commands[0];
        newheight = commands[0];
    }else if(commands.length === 2){
        newWidth = commands[0];
        newheight = commands[1];
    }else if(commands.length === 3){
        newWidth = commands[0];
        newheight = commands[1];
        extra = commands[2];
    }
    console.log(commands);
    let newArea = newWidth * newheight;
    let oldArea = file.width * file.height;

    if (newArea < oldArea){
        return '-resize ' + newWidth+'x'+newheight + extra;
    }else{
        return '-resize ' + file.width+'x'+file.height + extra;
    }
}