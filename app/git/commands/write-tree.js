const path = require("path");
const fs = require("fs");
const zlib = require ("zlib");
const crypto = require("crypto");


function writeFileBolb(currentPath){
    const contents = fs.readFileSync(currentPath);
    const len = contents.length;

    const header = `blob ${len}\0`;
    const blob = Buffer.concat([Buffer.from(header), contents]);

    const hash = crypto .createHash("sha1").update(blob).digest("hex");

    const folder = hash.slice(0,2);
    const file = hash.slice (2);

    const completeFolderPath = path.join(process.cwd(),".git", "objects" ,folder );
    if (!fs.existsSync(completeFolderPath)) fs.mkdirSync(completeFolderPath);

    const compressedData = zlib.deflateSync(blob);
    fs.writeFileSync(path.join(completeFolderPath , file ), compressedData);
    return hash;

}

class WriteTreeCommand{
    constructor() {}

    execute() {
        // 1. recursive read all files and dir
        function recursiveCreateTree(basePath) {
            const dirContents = fs.readdirSync(basePath);
            const result = []; // Move this declaration outside the loop
        
            for (const dirContent of dirContents) {
                if (dirContent.includes(".git")) continue;
        
                const currentPath = path.join(basePath, dirContent);
                const stat = fs.statSync(currentPath);
        
                if (stat.isDirectory()) {
                    const sha = recursiveCreateTree(currentPath);
                    if (sha) {
                        result.push({
                            mode: "40000",
                            basename: path.basename(currentPath),
                            sha,
                        });
                    }
                } else if (stat.isFile()) {
                    const sha = writeFileBolb(currentPath);
                    result.push({
                        mode: "100644",
                        basename: path.basename(currentPath),
                        sha,
                    });
                }
            }
        
            // Now this check will work correctly
            if (dirContents.length === 0 || result.length === 0) {
                return null;
            }
        
            const treeData = result.reduce((acc, current) => {
                const { mode, basename, sha } = current;
                return Buffer.concat([
                    acc,
                    Buffer.from(`${mode} ${basename}\0`),
                    Buffer.from(sha, "hex"),
                ]);
            }, Buffer.alloc(0));
        
            const tree = Buffer.concat([
                Buffer.from(`tree ${treeData.length}\0`),
                treeData,
            ]);
        
            const hash = crypto.createHash('sha1').update(tree).digest('hex');
        
            const folder = hash.slice(0, 2);
            const file = hash.slice(2);
        
            const treeFolderPath = path.join(process.cwd(), ".git", "objects", folder);
        
            if (!fs.existsSync(treeFolderPath)) fs.mkdirSync(treeFolderPath, { recursive: true });
        
            const compressed = zlib.deflateSync(tree);
            fs.writeFileSync(path.join(treeFolderPath, file), compressed);
        
            return hash;
        }

        const sha = recursiveCreateTree(process.cwd());
        process.stdout.write(sha);
        // 2. if items are dir, do it again for inner dir
        // 3. if file , create blob , write hash and file to objects and write entry to tree

    }

}

module.exports = WriteTreeCommand;