[![npm version](https://badge.fury.io/js/@lesjoursfr%2Fbin-wrapper.svg)](https://badge.fury.io/js/@lesjoursfr%2Fbin-wrapper)
[![QC Checks](https://github.com/lesjoursfr/bin-wrapper/actions/workflows/quality-control.yml/badge.svg)](https://github.com/lesjoursfr/bin-wrapper/actions/workflows/quality-control.yml)
[![Tests](https://github.com/lesjoursfr/bin-wrapper/actions/workflows/tests.yml/badge.svg)](https://github.com/lesjoursfr/bin-wrapper/actions/workflows/tests.yml)

# bin-wrapper

Binary wrapper that makes your programs seamlessly available as local dependencies

## Install

```sh
npm install @lesjoursfr/bin-wrapper
```

## Usage

```js
import path from "path";
import BinWrapper from "@lesjoursfr/bin-wrapper";

const base = "https://github.com/imagemin/gifsicle-bin/raw/main/vendor";
const bin = new BinWrapper()
	.addSrc(`${base}/macos/gifsicle`, "darwin")
	.addSrc(`${base}/linux/x64/gifsicle`, "linux", "x64")
	.addSrc(`${base}/win/x64/gifsicle.exe`, "win32", "x64")
	.setDest(path.join("vendor"))
	.setUse(process.platform === "win32" ? "gifsicle.exe" : "gifsicle")
	.setVersion(">=1.71");

(async () => {
	await bin.run(["--version"]);
	console.log("gifsicle is working");
})();
```

Get the path to your binary with `bin.path()`:

```js
console.log(bin.path());
//=> 'path/to/vendor/gifsicle'
```

## API

### `new BinWrapper(options)`

Creates a new `BinWrapper` instance.

#### options

Type: `Object`

##### skipCheck

- Type: `boolean`
- Default: `false`

Whether to skip the binary check or not.

##### strip

- Type: `number`
- Default: `1`

Strip a number of leading paths from file names on extraction.

### .addSrc(url, [os], [arch])

Adds a source to download.

#### url

Type: `string`

Accepts a URL pointing to a file to download.

#### os

Type: `string`

Tie the source to a specific OS.

#### arch

Type: `string`

Tie the source to a specific arch.

### .setDest(destination)

#### destination

Type: `string`

Accepts a path which the files will be downloaded to.

### .setUse(binary)

#### binary

Type: `string`

Define which file to use as the binary.

### .path

Returns the full path to your binary.

### .setVersion(range)

#### range

Type: `string`

Define a [semver range](https://github.com/npm/node-semver#ranges) to check
the binary against.

### .run([arguments])

Runs the search for the binary. If no binary is found it will download the file
using the URL provided in `.addSrc()`.

#### arguments

- Type: `Array`
- Default: `['--version']`

Command to run the binary with. If it exits with code `0` it means that the
binary is working.

## License

MIT © [Kevin Mårtensson](http://kevinmartensson.com)
