const chalk = require("chalk");
const fse = require("fs-extra");
const stringHash = require("string-hash");
const alphabetizeImports = require("./alphabetize-imports/alphabetize-imports");
const singleLineComments = require("./single-line-comments/single-line-comments");

const splitFileByNewLine = file => file.split("\n");
const joinFileByLine = arr => arr.join("\n");

const scripts = [
    splitFileByNewLine,
    alphabetizeImports,
    singleLineComments,
    joinFileByLine
];

module.exports = (fileList) => {
    fileList.forEach(file => {
        new Promise(resolve => {
            resolve(fse.readFile(file, "utf-8"));
        }).catch(err => {
            console.log(chalk.red(`File Read Error: ${err}`))
        }).then(data => {
            const originalHash = stringHash(data);
            const cloneScripts = scripts.slice();
            let transformedData = data;

            while (cloneScripts.length) {
                const script = cloneScripts.shift();
                transformedData = script(transformedData);
            }

            if (originalHash !== stringHash(transformedData)) {
                console.log(chalk.yellow(`${file}\n - has been fixed`));

                return fse.writeFile(file, transformedData);
            } else {
                console.log(chalk.green(`${file}\n - had no formatting errors`));
            }

            return transformedData;
        });
    });
};
