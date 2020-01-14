const _ = require("lodash");

const singleLineComments = (fileByLine) => {
    fileByLine.forEach((line, i, arr) => {
        if (/(\/\*\*?).*(\*\/$)/.test(line)) {
            const newLine = line.replace(/\/\*\*?/, "//").replace("*/", "");
            arr[i] = newLine;
        }
    });

    return fileByLine;
};

module.exports = singleLineComments;
