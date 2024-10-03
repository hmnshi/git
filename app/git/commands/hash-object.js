const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");
const { clear } = require("console");

// const { error } = require("console");
 class HashObjectCommand {
    constructor (flag, filePath){
        this.flag = flag;
        this.filePath = filePath;
    }
    execute(){
    // 1.make sure file is there
    const filePath  = path.resolve(this.filePath);
    
    if (!fs.existsSync(filePath)){ //make sure filePath is exist or not
        throw new Error(`could not open '${this.filePath}' for reading: No such file or directory`);
    }

    // 2. read the file 
    const  fileContents = fs.readFileSync(filePath);
    const fileLength = fileContents.length;

   // 3. create the blob
    const header = `blob ${fileLength}\0`;
    const blob  = Buffer.concat([Buffer.from(header), fileContents]);
    // 4. calculate the hash
    const hash = crypto.createHash("sha1").update(blob).digest("hex");

    // 5. if -w then file write also (after commpressing it)
    if (this.flag && this.flag == "-w"){
        const folder = hash.slice(0,2);
        const file = hash.slice(2);
        const completeFolderPath = path.join(process.cwd(),".git","objects",folder);

        if (!fs.existsSync(completeFolderPath)) fs.mkdirSync(completeFolderPath);

        const compressedData = zlib.deflateSync(blob);  
        fs.writeFileSync(path.join(completeFolderPath, file),compressedData);
    }

    process.stdout.write(hash);
    }
}

module.exports = HashObjectCommand;
