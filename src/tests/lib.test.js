import { compress } from "../lib/lib";

describe("lib.test.js", () => {
  it("compress", () => {
    const data = "hello world";
    const compressed = compress(data);
    expect(compressed).toEqual("H4sIAAAAAAAAE8tIzcnJVyjPL8pJAQCFEUoNCwAAAA==");
  });
});
