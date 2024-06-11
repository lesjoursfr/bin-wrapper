import axios, { AxiosResponse } from "axios";
import { parse as parseContentDisposition } from "content-disposition";
import { fileTypeFromBuffer } from "file-type";
import fs, { promises as fsP } from "fs";
import { basename, dirname, join as joinPath, resolve as resolvePath } from "path";
import { Readable, Transform, TransformCallback } from "stream";
import { x as extract } from "tar";

function getFilename(res: AxiosResponse): string {
  const header = res.headers["content-disposition"];

  if (header) {
    const parsed = parseContentDisposition(header);

    if (parsed.parameters && parsed.parameters.filename) {
      return parsed.parameters.filename;
    }
  }

  return basename(new URL(res.request.res.responseUrl).pathname);
}

async function isTarFile(data: Buffer): Promise<boolean> {
  const ret = await fileTypeFromBuffer(data);
  if (ret === undefined) {
    return false;
  }

  return ["tar", "gz"].includes(ret.ext);
}

class FileDownloader extends Transform {
  private _isTarFile: boolean | null = null;
  private outputFilepath: string;
  private outputDir: string;
  private downloadedFiles: Array<string> = [];

  constructor(
    dest: string,
    private filename: string,
    private extractOpts: { strip: number },
    private callback: (err: Error | null, files: Array<string>) => void
  ) {
    super();
    this.outputFilepath = resolvePath(joinPath(dest, this.filename));
    this.outputDir = dirname(this.outputFilepath);
  }

  public async _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): Promise<void> {
    if (this._isTarFile !== null) {
      callback(null, chunk);
      return;
    }

    await fsP.mkdir(this.outputDir, { recursive: true });

    this._isTarFile = await isTarFile(chunk);
    const outputStream = this._isTarFile
      ? extract({
          cwd: this.outputDir,
          strip: this.extractOpts.strip,
          onentry: (entry) => {
            this.downloadedFiles.push(joinPath(this.outputDir, entry.path));
          },
        })
      : fs.createWriteStream(this.outputFilepath);
    if (!this._isTarFile) {
      this.downloadedFiles.push(this.outputFilepath);
    }
    this.pipe(outputStream);

    outputStream.on("error", (err) => {
      this.callback(err, []);
    });
    outputStream.on("close", () => {
      this.callback(null, this.downloadedFiles);
    });

    callback(null, chunk);
  }
}

export async function downloadFile(url: string, dest: string, options: { strip: number }): Promise<Array<string>> {
  const response = await axios.get<Readable>(url, { responseType: "stream" });
  if (response.status < 200 && 300 <= response.status) {
    throw new Error(`HTTP Error : ${response.status} ${response.statusText} for the file ${url}`);
  }

  const filename = getFilename(response);

  return new Promise<Array<string>>((resolve, reject) => {
    const fileDownloader = new FileDownloader(dest, filename, options, (err, files) => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(files);
      }
    });

    response.data.pipe(fileDownloader);
  });
}
