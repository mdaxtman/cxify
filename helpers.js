const chalk = require("chalk")
const fse = require("fs-extra");
const path = require("path");
const stringHash = require("string-hash");

const buildAbsolutePath = partialPath => path.resolve(".", partialPath);
const deterimineValidImportLine = line => /^import(?!\()/.test(line.trim());
const customSort = (a, b) => {
    const trimmedA = a.trim().replace("{", "").toLowerCase();
    const trimmedB = b.trim().replace("{", "").toLowerCase();

    return trimmedA < trimmedB ? -1
        : trimmedA > trimmedB ? 1
            : 0;
}
const determineLineWithUnmatchedCurly = line => {
    const openCurlyCount = (line.match(/{/g) || "").length;

    if (!openCurlyCount) {
        return false;
    }

    const closedCurlyCount = (line.match(/}/g) || "").length;

    return !!(openCurlyCount - closedCurlyCount);
};
const extractAndSortSingleLineVariablesBetweenMatchingCurlies = line => {
    const variables = (line.match(/{.*}/) || [""])[0].replace(/{|}/g, "");

    return variables.split(",").map(s => s.trim()).sort(customSort).join(",");
};

const sortVariablesBetweenCurlies = line => {
    const fromClause = line.match(/from.*/g)[0];
    return line.slice(0, line.indexOf("{")) + `{${extractAndSortSingleLineVariablesBetweenMatchingCurlies(line)}} ${fromClause}`;
};

const verifyFiles = (files = []) => {
    const verifiedFiles = files.map(file => {
        return fse.ensureFile(file)
            .then(() => file)
            .catch((err) => {
                if (err) {
                    console.log(chalk.red(`ERROR: file named ${file} does not exist.`));
                    process.exit(1);
                }

                resolve(file);
            });
    });

    return Promise.all(verifiedFiles);
};

const runScriptsOnFiles = (fileList, scripts) => {
    // cluster goes here...

    fileList.forEach(file => {
        new Promise(resolve => {
            resolve(fse.readFile(file, "utf-8"));
        }).catch(err => {
            console.log(chalk.red(`File Read Error: ${err}`))
        }).then(data => {
            const originalHash = stringHash(data);
            const cloneScripts = scripts.slice();
            let transformedData = data;

            while(cloneScripts.length) {
                const script = cloneScripts.pop();
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

module.exports = {
    buildAbsolutePath,
    customSort,
    deterimineValidImportLine,
    determineLineWithUnmatchedCurly,
    extractAndSortSingleLineVariablesBetweenMatchingCurlies,
    runScriptsOnFiles,
    sortVariablesBetweenCurlies,
    verifyFiles
};
