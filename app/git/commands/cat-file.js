const path = require("path");
//const { clearScreenDown } = require('readline');
const zlib = require("zlib");
const fs = require("fs");

class CatFileCommand {
    constructor(flag , commitSHA){
        this.flag = flag;
        this.commitSHA = commitSHA;
    }
    execute(){
        //navigate to .git/objects/commitSHA[0..2]
        //read the file .git/objects/commitSHA[0..2]/commitSHA[2..]
        //de-compress
        //output

        const flag = this.flag;
        const commitSHA = this.commitSHA;

        switch(flag){
            case "-p":
                {
                    const folder = commitSHA.slice(0,2);
                    const file = commitSHA.slice(2);
                    const completePath = path.join(process.cwd(),".git","objects",folder,file);

                    if (!fs.existsSync(completePath)){
                        throw new Error(`not a valid object name ${commitSHA}`);
                    }
                    fs.readFile(completePath, (err, fileContents) => {
                        if (err) {
                            throw err;
                        }

                        const outputBuffer = zlib.inflateSync(fileContents);
                        const output = outputBuffer.toString().split("\x00")[1];

                        process.stdout.write(output);
                    });

                break;
        }
    }
}
}
module.exports = CatFileCommand;