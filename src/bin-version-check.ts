/**
 * Source : https://github.com/sindresorhus/bin-version-check
 */
import binaryVersion, { Options as BinaryVersionCheckOptions } from "bin-version";
import semver from "semver";
import semverTruncate from "semver-truncate";

export async function binVersionCheck(
  binary: string,
  semverRange: string,
  options?: BinaryVersionCheckOptions
): Promise<void> {
  if (typeof binary !== "string" || typeof semverRange !== "string") {
    throw new TypeError("`binary` and `semverRange` arguments required");
  }

  if (!semver.validRange(semverRange)) {
    throw new Error("Invalid version range");
  }

  const version = await binaryVersion(binary, options);

  if (semver.satisfies(semverTruncate(version, "patch"), semverRange)) {
    return;
  }

  const error = new Error(`${binary} ${version} doesn't satisfy the version requirement of ${semverRange}`);
  error.name = "InvalidBinaryVersion";
  throw error;
}
