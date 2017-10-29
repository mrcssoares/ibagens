let execProcess = require('../utils/execprocess.js');

class Image {
    constructor(){

    }

    /****************************************************************
    *http://localhost:9005/imgs/name:marcos/file_1509193455414.jpg**
   ****************************************************************/
    generateImageByName(hashImg, fullName){

        return new Promise((resolve, reject) => {
            let short = fullName.split(' ').map( x => x[0]).join('');
            console.log(fullName);
            console.log(short);
            let str = `---${short}---`;

            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }

            let colour = '#';
            for (let i = 0; i < 3; i++) {
                let value = (hash >> (i * 8)) & 0xFF;
                colour += ('00' + value.toString(16)).substr(-2);
            }
            hashImg = hashImg.split(/ /g, '_');
            let name = `profile_${hashImg}.png`;
            let outImage = `${global.imageCuston}${name}`;
            let command = `convert -background '${colour}' -fill white -size 300x300  -gravity Center  -weight 100 -pointsize 150  label:'${short}' ${outImage}`;
            console.log(command);
            execProcess.result(command).then(_ =>{
                resolve(name);
            }).catch(error => {
                reject(error);
            });
        });
    }
}

module.exports.Image = Image;
