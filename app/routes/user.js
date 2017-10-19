/**
 * Created by marcos on 19/08/17.
 */
module.exports = function(app) {
    const controller = app.controller.user;


    //pega todos os usuários
    app.get('/users', controller.getUsers);

    //cria um novo usuário
    app.post('/users', controller.postUser);

    //login do usuário
    app.post('/users/login', controller.loginUser);

    //verifica se o email ja existe, para quando o usuário tenta cadastrar o email
    app.get('/user/check/:email', controller.userCheck);

};