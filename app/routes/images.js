/**
 * Created by marcos on 20/08/17.
 */


module.exports = function(app) {
    const controller = app.controller.images;

    //pega todos os usuários
    app.get('/imgs/me', controller.getImages);

    app.post('imgs/upload')

};