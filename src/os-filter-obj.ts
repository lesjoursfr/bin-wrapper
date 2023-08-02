/**
 * Source : https://github.com/kevva/os-filter-obj
 */
import osArch from "arch";

type OsFilterInput = {
  os?: string;
  arch?: string;
} & { [key: string | number]: unknown };

function check(bool: boolean, key: string | null | undefined, val: string): boolean {
  return !bool || !key || key === val;
}

export function osFilterObj(input: Array<OsFilterInput>): Array<OsFilterInput> {
  const arch = osArch();

  return input.filter((x: OsFilterInput) =>
    [process.platform, arch].every((y, i) => check(i === 0, x.os, y) && check(i === 1, x.arch, y))
  );
}
