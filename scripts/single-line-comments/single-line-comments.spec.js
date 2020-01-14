const expect = require("chai").expect;
const singleLineComments = require("./single-line-comments");

describe("single line comments", () => {
    it ("should do nothing to a string that doesn't contain a comment", () => {
        const arr = [
            "just a string",
            "/*",
            "within comment",
            "*/"
        ];

        expect(
            singleLineComments(arr)
        ).to.deep.equal(arr);
    });

    it ("should replace any strings with multi line comments in a single line with a single line comment", () => {
        expect(singleLineComments([
            "/** single line */",
            "/* other line */"
        ])).to.deep.equal(["// single line", "// other line"]);
    });
});
