import binCheck from "@lesjoursfr/bin-check";
import { promises as fs } from "fs";
import path from "path";
import { binVersionCheck } from "./bin-version-check.js";
import { downloadFile } from "./download-file.js";
import { osFilterObj } from "./os-filter-obj.js";

type BinWrapperFile = {
  url: string;
  os: string | undefined;
  arch: string | undefined;
};

type BinWrapperOptions = {
  strip: number;
  skipCheck: boolean;
};

export default class BinWrapper {
  public readonly options: BinWrapperOptions;
  private _src: Array<BinWrapperFile> = [];
  private _dest: string | null = null;
  private _use: string | null = null;
  private _version: string | null = null;

  public constructor(options: Partial<BinWrapperOptions> = {}) {
    this.options = Object.freeze({
      strip: options.strip === undefined ? 1 : Math.max(0, options.strip),
      skipCheck: options.skipCheck === true,
    });
  }

  public addSrc(src: string, os?: string, arch?: string): BinWrapper {
    this._src.push({ url: src, os, arch });
    return this;
  }

  public setDest(dest: string): BinWrapper {
    this._dest = dest;
    return this;
  }

  public setUse(bin: string): BinWrapper {
    this._use = bin;
    return this;
  }

  public setVersion(range: string): BinWrapper {
    this._version = range;
    return this;
  }

  public get src(): Array<BinWrapperFile> {
    return this._src;
  }

  public get dest(): string {
    if (this._dest === null) {
      throw new Error("The dest property must be set before !");
    }
    return this._dest;
  }

  public get use(): string {
    if (this._use === null) {
      throw new Error("The use property must be set before !");
    }
    return this._use;
  }

  public get version(): string | null {
    return this._version;
  }

  public get path(): string {
    return path.join(this.dest, this.use);
  }

  public async run(cmd: Array<string> = ["--version"]): Promise<void> {
    await this.findExisting();
    if (this.options.skipCheck) {
      return;
    }

    return this.runCheck(cmd);
  }

  private async runCheck(cmd: Array<string>): Promise<void> {
    const works = await binCheck(this.path, cmd);
    if (!works) {
      throw new Error(`The "${this.path}" binary doesn't seem to work correctly`);
    }

    if (this.version !== null) {
      return binVersionCheck(this.path, this.version);
    }
  }

  private async findExisting(): Promise<void> {
    try {
      await fs.stat(this.path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
        throw error;
      }

      await this.download();
    }
  }

  private async download(): Promise<void> {
    const files = osFilterObj(this.src);

    if (files.length === 0) {
      throw new Error("No binary found matching your system. It's probably not supported.");
    }

    const urls: Array<string> = [];
    for (const file of files) {
      urls.push(file.url as string);
    }

    const result = await Promise.all(urls.map((url) => downloadFile(url, this.dest, { strip: this.options.strip })));
    const resultFiles = result.flat();

    await Promise.all(resultFiles.map((file) => fs.chmod(file, 0o755)));
  }
}
