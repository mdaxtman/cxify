#!/usr/bin/env node

const argv = require("argv");
const shell = require("shelljs");
const helpers = require("./helpers");
const alphabetizeImports = require("./scripts/alphabetize-imports/alphabetize-imports");

argv.option({
    name: "file",
    short: "f",
    type: "list,path",
    description: "Defines a specific file to cxify, otherwise git modified or untracked files will be cxified",
    example: "'script --file=value' or 'script -f value'"
});

const {options} = argv.run();

const scripts = [
    alphabetizeImports
];

if (options.file) {
    const useOptions = async (files) => {
        const verifiedFiles = await helpers.verifyFiles(files);
        helpers.runScriptsOnFiles(verifiedFiles, scripts);
    };

    useOptions(options.file);

    return;
}

shell.exec("git status --porcelain", {silent: true}, (code, stdout, stderr) => {
    if (stderr) {
        shell.echo(stderr);
        process.exit(1);
    }

    const cleanedFileList = stdout.split("\n").filter(s => s && !/^D/.test(s) && /js(x)?$/.test(s)).map(s => s.replace(/.*\s/, ""));
    const absolutePathList = cleanedFileList.map((l) => helpers.buildAbsolutePath(l));
    helpers.runScriptsOnFiles(absolutePathList, scripts);
});

// fix git errors with modified files and different types.
// ensure that js and jsx files are the only types we work on for now.
// encorporate prettier
// abc defined object with nesting.
// convert single line comments from /* to //
// multi line defined object.
// abc destructured object with nesting.
// multi line destructured object
// sort grouped variables
// sort jsx props

