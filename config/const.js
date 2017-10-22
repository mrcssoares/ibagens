/**
 * Created by marcos on 20/08/17.
 */
function Constants() { }

let method = Constants.prototype;

//FLAGS PARA CONTROLE DO PUSH NOTIFICATION
method.secretKey = "minhaChaveSuperSecreta";

//comandos do IM

method.IM = {
    //redimenciona sem considerar ao aspectos da imagem
    rdf: '\\!',
    //redimenciona considerando os aspectos da imagem, não a deixa ser maior que seu tamanho
    rdi: '\\>',
    //redimenciona cortando as areas delimitadas
    crop: '^',
};

module.exports = Constants;
