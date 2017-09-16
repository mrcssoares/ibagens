/**
 * Created by marcos on 20/08/17.
 */

let auth = require('../../config/middlewares');

module.exports = function(app) {
    const controller = app.controller.images;

    //pega todas as imagens (posteriormente do usuário)
    app.get('/imgs/me', auth.ensureAuthorized, controller.getImages);

    //upload de uma imagem
    app.post('/imgs/upload', auth.ensureAuthorized, controller.uploadImgs)

};