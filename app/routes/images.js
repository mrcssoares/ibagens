/**
 * Created by marcos on 20/08/17.
 */

let auth = require('../../config/middlewares');

module.exports = function(app) {
    const controller = app.controller.images;

    //pega todas as imagens (posteriormente do usuário)
    app.get('/imgs/me', auth.ensureAuthorized, controller.getImgs);

    //upload de uma imagem
    app.post('/imgs/upload', auth.ensureAuthorized, controller.uploadImgs);

    //retorna a imagem original
    app.get('/imgs/:image', controller.defaultImg);

    //gera uma nova imagem a partir dos parametros informados
    app.get('/imgs/generate/:commands', controller.generateImg);

    //retorna a imagem com tratamentos
    app.get('/imgs/:commands/:image', controller.transformImg);


};