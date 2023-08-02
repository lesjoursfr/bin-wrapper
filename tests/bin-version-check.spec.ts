/**
 * Source : https://github.com/sindresorhus/bin-version-check
 */
import assert from "assert";
import { binVersionCheck } from "../src/bin-version-check.js";

it("error when the range does not satisfy the bin version", async () => {
  await assert.rejects(binVersionCheck("curl", "1.29.0"), {
    name: "InvalidBinaryVersion",
  });
});

it("no error when the range satisfies the bin version", async () => {
  await assert.doesNotReject(binVersionCheck("curl", ">=1"));
});
