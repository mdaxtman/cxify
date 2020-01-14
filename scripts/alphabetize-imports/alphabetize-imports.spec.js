const expect = require("chai").expect;
const badImports = require("../../mocks/bad-imports.json");
const fixedImports = require("../../mocks/fixed-imports.json");

const alphabetizeImports = require("./alphabetize-imports.js");

describe("alphabetizeImports", () => {
    it("should take in a string, and if the imports are not changed or don't exist, it should return the same value", () => {
        expect(alphabetizeImports("hello")).to.equal("hello");
        expect(alphabetizeImports(`import something from "nothing"`)).to.equal(`import something from "nothing"`);
    });

    it("separates imports with an extra line based upon how they're resolved. Relative first, @nui second, third-party last, each name should be alphabetized within each group", () => {
        expect(alphabetizeImports(badImports)).to.equal(fixedImports);
    });
});
