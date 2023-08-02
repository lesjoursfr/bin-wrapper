/**
 * Source : https://github.com/kevva/os-filter-obj
 */
import assert from "assert";
import { osFilterObj } from "../src/os-filter-obj.js";

it("filter an array of objects to a specific OS", () => {
  const arr = [
    {
      foo: "all",
    },
    {
      foo: "linux",
      os: "linux",
    },
    {
      foo: "darwin",
      os: "darwin",
    },
    {
      foo: "win32",
      os: "win32",
    },
    {
      foo: "arm",
      os: "arm",
    },
  ];

  assert.strictEqual(osFilterObj(arr).length, 2);
  assert.strictEqual(osFilterObj(arr)[0].os, undefined);
  assert.strictEqual(osFilterObj(arr)[1].os, process.platform);
});
