const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");

const HASH_ALGORITHM = "sha1";
const OBJECT_FOLDER = ".git/objects";

class HashObjectCommand {
    constructor(flag, filePath) {
        this.flag = flag;
        this.filePath = filePath;
    }

    execute() {
        try {
            // 1.make sure file is there
            const filePath = path.resolve(this.filePath);
            this.validateFileExists(filePath);
            // 2. read the file
            const fileContents = this.readFile(filePath);
            // 3. create the blob
            const blob = this.createBlob(fileContents);
            // 4. calculate the hash
            const hash = this.calculateHash(blob);
            // 5. if -w then file write also (after commpressing it)
            if (this.flag && this.flag === "-w") {
                this.writeObject(hash, blob);
            }

            process.stdout.write(hash + "\n");
        } catch (error) {
            console.error(error.message);
        }
    }

    validateFileExists(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Could not open '${this.filePath}' for reading: No such file or directory`);
        }
    }


    readFile(filePath) {
        const bufferContents = fs.readFileSync(filePath);
        return bufferContents.toString("utf8"); // Convert Buffer to string
    }

    createBlob(fileContents) {
        // Normalize line endings to LF
        const normalizedContents = fileContents.replace(/\r\n/g, '\n'); // Convert CRLF to LF
        // Calculate the byte length of the normalized contents
        const fileLength = Buffer.byteLength(normalizedContents);
        // Create the blob header in the format 'blob <size>\0'
        const header = `blob ${fileLength}\0`;
        // Concatenate the header and the contents into a single Buffer
        return Buffer.concat([
            Buffer.from(header, "utf8"), // Convert header to Buffer
            Buffer.from(normalizedContents, "utf8") // Convert normalized contents to Buffer
        ]);
    }

    calculateHash(blob) {
        return crypto.createHash(HASH_ALGORITHM).update(blob).digest("hex");
    }

    writeObject(hash, blob) {
        const folder = hash.slice(0, 2);
        const file = hash.slice(2);
        const completeFolderPath = path.join(process.cwd(), OBJECT_FOLDER, folder);

        if (!fs.existsSync(completeFolderPath)) {
            fs.mkdirSync(completeFolderPath, { recursive: true });
        }

        const compressedData = zlib.deflateSync(blob);
        try {
            fs.writeFileSync(path.join(completeFolderPath, file), compressedData);
        } catch (error) {
            throw new Error(`Error writing object to '${completeFolderPath}': ${error.message}`);
        }
    }
}

module.exports = HashObjectCommand;