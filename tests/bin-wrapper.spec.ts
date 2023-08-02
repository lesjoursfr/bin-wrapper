import assert from "assert";
import { promises as fsP, readdirSync } from "fs";
import { sync as isexeSync } from "isexe";
import nock from "nock";
import path from "path";
import process from "process";
import { temporaryDirectory } from "tempy";
import { fileURLToPath } from "url";
import BinWrapper from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixture = path.join.bind(path, __dirname, "fixtures");
const binary = process.platform === "win32" ? "gifsicle.exe" : "gifsicle";

async function pathExists(path: string): Promise<boolean> {
  try {
    await fsP.access(path);
    return true;
  } catch {
    return false;
  }
}

async function cleanTempDir(dir: string): Promise<boolean> {
  try {
    await fsP.rm(dir, { force: true, recursive: true });
    return true;
  } catch {
    return false;
  }
}

beforeEach(function () {
  nock("http://foo.com")
    .get("/gifsicle.tar.gz")
    .replyWithFile(200, fixture(`gifsicle-${process.platform}.tar.gz`))
    .get("/gifsicle-darwin.tar.gz")
    .replyWithFile(200, fixture("gifsicle-darwin.tar.gz"))
    .get("/gifsicle-win32.tar.gz")
    .replyWithFile(200, fixture("gifsicle-win32.tar.gz"))
    .get("/bin-wrapper.spec.ts")
    .replyWithFile(200, __filename);
});

it("expose a constructor", () => {
  assert.strictEqual(typeof BinWrapper, "function");
});

it("add a source", () => {
  const bin = new BinWrapper().addSrc("http://foo.com/bar.tar.gz");
  assert.strictEqual(bin.src[0].url, "http://foo.com/bar.tar.gz");
});

it("add a source to a specific os", () => {
  const bin = new BinWrapper().addSrc("http://foo.com", process.platform);
  assert.strictEqual(bin.src[0].os, process.platform);
});

it("set destination directory", () => {
  const bin = new BinWrapper().setDest(path.join(__dirname, "foo"));
  assert.strictEqual(bin.dest, path.join(__dirname, "foo"));
});

it("set which file to use as the binary", () => {
  const bin = new BinWrapper().setUse("foo");
  assert.strictEqual(bin.use, "foo");
});

it("set a version range to test against", () => {
  const bin = new BinWrapper().setVersion("1.0.0");
  assert.strictEqual(bin.version, "1.0.0");
});

it("get the binary path", () => {
  const bin = new BinWrapper().setDest("tmp").setUse("foo");

  assert.strictEqual(bin.path, path.join("tmp", "foo"));
});

it("verify that a binary is working", async () => {
  const temporaryDir = temporaryDirectory();
  const bin = new BinWrapper({ strip: 0 })
    .addSrc("http://foo.com/gifsicle.tar.gz")
    .setDest(temporaryDir)
    .setUse(binary);

  await bin.run();
  assert.strictEqual(await pathExists(bin.path), true);
  await cleanTempDir(bin.dest);
});

it("meet the desired version", async () => {
  const temporaryDir = temporaryDirectory();
  const bin = new BinWrapper({ strip: 0 })
    .addSrc("http://foo.com/gifsicle.tar.gz")
    .setDest(temporaryDir)
    .setUse(binary)
    .setVersion(">=1.71");

  await bin.run();
  assert.strictEqual(await pathExists(bin.path), true);
  await cleanTempDir(bin.dest);
});

it("download files even if they are not used", async () => {
  const temporaryDir = temporaryDirectory();
  const bin = new BinWrapper({ strip: 0, skipCheck: true })
    .addSrc("http://foo.com/gifsicle-darwin.tar.gz")
    .addSrc("http://foo.com/gifsicle-win32.tar.gz")
    .addSrc("http://foo.com/bin-wrapper.spec.ts")
    .setDest(temporaryDir)
    .setUse(binary);

  await bin.run();
  const files = readdirSync(bin.dest);

  assert.strictEqual(files.length, 3);
  assert.strictEqual(files[0], "bin-wrapper.spec.ts");
  assert.strictEqual(files[1], "gifsicle");
  assert.strictEqual(files[2], "gifsicle.exe");

  await cleanTempDir(bin.dest);
});

it("skip running binary check", async () => {
  const temporaryDir = temporaryDirectory();
  const bin = new BinWrapper({ strip: 0, skipCheck: true })
    .addSrc("http://foo.com/gifsicle.tar.gz")
    .setDest(temporaryDir)
    .setUse(binary);

  await bin.run(["--shouldNotFailAnyway"]);
  assert.strictEqual(await pathExists(bin.path), true);
  await cleanTempDir(bin.dest);
});

it("error if no binary is found and no source is provided", async () => {
  const temporaryDir = temporaryDirectory();
  const bin = new BinWrapper().setDest(temporaryDir).setUse(binary);

  await assert.rejects(bin.run(), { message: "No binary found matching your system. It's probably not supported." });
  await cleanTempDir(bin.dest);
});

it("downloaded files are set to be executable", async () => {
  const temporaryDir = temporaryDirectory();
  const bin = new BinWrapper({ strip: 0, skipCheck: true })
    .addSrc("http://foo.com/gifsicle-darwin.tar.gz")
    .addSrc("http://foo.com/gifsicle-win32.tar.gz")
    .addSrc("http://foo.com/bin-wrapper.spec.ts")
    .setDest(temporaryDir)
    .setUse(binary);

  await bin.run();

  const files = readdirSync(bin.dest);

  await assert.strictEqual(
    files.every((file) => isexeSync(path.join(bin.dest, file), { pathExt: "" })),
    true
  );
  await cleanTempDir(bin.dest);
});
