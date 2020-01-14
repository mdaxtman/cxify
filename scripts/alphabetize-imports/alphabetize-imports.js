const _ = require("lodash");
const helpers = require("../../helpers");

const flattenMultiLineImports = (str) => {
    const fileByLine = str.split("\n");
    let firstImportIndex;
    let lastImportIndex;

    for (let i = 0; i < fileByLine.length; i++) {
        let currentLine = fileByLine[i];

        if (helpers.deterimineValidImportLine(currentLine)) {
            firstImportIndex = typeof firstImportIndex === "number" ? firstImportIndex : i;
            lastImportIndex = i;

            if (helpers.determineLineWithUnmatchedCurly(currentLine)) {
                const multiLineImport = [fileByLine[i].trim()];
                let nextLine = fileByLine[i + 1];
                let unmatchedCurlies = 1;

                while (unmatchedCurlies) {
                    if (/}/.test(nextLine)) {
                        unmatchedCurlies--;
                    }

                    if (/{/.test(nextLine)) {
                        unmatchedCurlies++;
                    }

                    multiLineImport.push(nextLine.trim());
                    fileByLine.splice(i + 1, 1);
                    nextLine = fileByLine[i + 1];
                }

                currentLine = fileByLine[i] = multiLineImport.join("");
            }

            if (/}/.test(currentLine)) {
                const sortedVariables = helpers.sortVariablesBetweenCurlies(currentLine);
                currentLine = fileByLine[i] = sortedVariables;
            }
        }
    }

    return {fileByLine, firstImportIndex, lastImportIndex};
};

const isolateAndSortImports = ({fileByLine, firstImportIndex, lastImportIndex}) => {
    const fileByLineClone = fileByLine.slice();
    const imports = fileByLineClone.splice(firstImportIndex, lastImportIndex + 1 - firstImportIndex);

    if (imports.length) {
        const nonImportsByIndex = {};
        let filteredImports = _.filter(imports, (line, i) => {
            if (helpers.deterimineValidImportLine(line)) {
                return true;
            }
            
            // if something is in the line like a comment, maintain its position above the import
            if (line && i !== 0) {
                if (nonImportsByIndex[i]) {
                    nonImportsByIndex[i + 1] = [...nonImportsByIndex[i], line];
                    delete nonImportsByIndex[i];
                } else {
                    nonImportsByIndex[i + 1] = [line];
                }
            }
        });

        filteredImports.sort(helpers.customSort);

        const lineToCommentMap = _.mapKeys(nonImportsByIndex, (lines, key) => imports[key]);

        return {
            sortedImports: filteredImports,
            restOfFile: fileByLineClone,
            lineToCommentMap
        };
    }

    return {
        sortedImports: imports,
        restOfFile: fileByLineClone
    };
};

const groupImportsByType = (sortedImports) => {
    const [nuiImports, otherImports] = _.partition(sortedImports, line => line.includes("@nui"));
    const [localImports, thirdPartyImports] = _.partition(otherImports, line => line.includes("./"));
    let result = localImports;

    if (nuiImports.length) {
        if (result.length) {
            result.push("");
        }

        result = [...result, ...nuiImports];
    }

    if (thirdPartyImports.length) {
        if (result.length) {
            result.push("");
        }

        result = [...result, ...thirdPartyImports];
    }

    return result;
};

const attachCommentsToImports = (groupedImports, lineToCommentMap) => {
    const importsClone = groupedImports.slice();

    _.forEach(lineToCommentMap, (comment, line) => {
        const currentIndex = importsClone.indexOf(line);

        if (currentIndex > -1) {
            importsClone.splice(currentIndex, 0, ...comment);
        }
    });

    return importsClone;
};

const spreadImportsToMultiLines = (groupedImports) => {
    return _.flatMap(groupedImports, importLine => {
        const openingCurlyIndex = importLine.indexOf("{");

        if (importLine.split(",").length - 1 === 0 && openingCurlyIndex > -1) {
            return importLine;
        }
        
        const newLineAfterOpeningCurly = importLine.replace("{", "{\n    ").replace("}", "\n}")

        return newLineAfterOpeningCurly.split("").map((character, i) => {
            if (openingCurlyIndex > -1 && i > openingCurlyIndex && character === ",") {
                return ",\n    ";
            }
            
            return character;
        }).join("").split("\n");
    });
};

const alphabetizeImports = (file) => {
    const importStats = flattenMultiLineImports(file);

    // no imports found.
    if (typeof importStats.firstImportIndex !== "number") {
        return importStats.fileByLine.join("\n");
    }

    const {sortedImports, restOfFile, lineToCommentMap} = isolateAndSortImports(importStats);
    const groupedImports = groupImportsByType(sortedImports);
    const commentsAndImports = attachCommentsToImports(groupedImports, lineToCommentMap); 
    const multiLineImports = spreadImportsToMultiLines(commentsAndImports);

    restOfFile.splice(importStats.firstImportIndex, 0, ...multiLineImports);

    return restOfFile.join("\n");
};

module.exports = alphabetizeImports;
