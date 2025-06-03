[![NPM version](https://badge.fury.io/js/resedit-cli.svg)](https://www.npmjs.com/package/resedit-cli)
[![Build Status](https://github.com/jet2jet/resedit-js-cli/actions/workflows/main-ci.yml/badge.svg)](https://github.com/jet2jet/resedit-js-cli)

# resedit-js-cli

resedit-js-cli is a command line (CLI) tool for manipulating resources in Windows Executable files, as well as signing executables. This tool runs on Node.js environment.

Starting from v0.3.0, resedit-js-cli also supports creating empty (data-only) executable binaries.

## Table of contents

- [Install](#install)
- [Usage](#usage)
  - [Main options](#main-options)
  - [Icon resource options](#icon-resource-options)
  - [Version resource options](#version-resource-options)
  - [Raw resource options](#raw-resource-options)
  - [Delete options](#delete-options)
  - [Signing options](#signing-options)
  - [Other options](#other-options)
- [Examples](#examples)
- [The definition object](#the-definition-object)
- [APIs](#apis)
- [Notes](#notes)
- [License](#license)

## Install

```
npm install resedit-cli
```

## Usage

```
Usage:
resedit [[--in] <in> | --new] [--out] <out> [<options...>]

Positionals:
  in, i   Input executable file name.
          Cannot specify --new if an input file is specified.           [string]
  out, o  Output executable file name                                   [string]

Options:
  -h, -?, --help             Show help                                 [boolean]
      --allow-shrink         Allow shrinking resource section size (if the data
                             size is less than original)               [boolean]
      --as-32bit             Creates the executable binary as a 32-bit version
                             (default: as 64-bit).
                             Requires --new option.                    [boolean]
      --as-exe-file          Creates the executable binary as an EXE file
                             (default: as a DLL).
                             Requires --new option.                    [boolean]
      --certificate, --cert  Certificate file for signing.
                             (DER format file (.cer) or PEM format file (.pem)
                             is supported)
                             Requires --sign option.                    [string]
      --company-name         Company name for version resource          [string]
      --debug                Output more logs than verbose mode while
                             processing.                               [boolean]
      --delete               One or more resources to delete from executable.
                             The value must be one of following format:
                             * <type>,<ID>
                             * <type>                                    [array]
      --delete-xxxxx         One or more resources to delete from executable
                             (xxxxx is one of the predefined type names
                             described below).
                             The value must be <ID> or no value.         [array]
      --definition           Resource definition file which contains resource
                             data to write (see document for details)   [string]
      --digest               Digest algorithm for signing. (default: 'sha256')
                             Requires --sign option.
              [string] [choices: "sha1", "sha256", "sha512", "sha224", "sha384",
     "sha512-224", "sha512-256", "sha3-224", "sha3-256", "sha3-384", "sha3-512",
                                                         "shake128", "shake256"]
      --fail-if-no-delete    If specified and the resource to be deleted does
                             not exist, the operation will fail.
                             If no delete options are specified, this flag is
                             ignored.                                  [boolean]
      --file-description     File description for version resource      [string]
      --file-version         File version for version resource.
                             Must be 'n.n.n.n' format (n is an integer) [string]
      --icon                 One or more icon files to add to executable.
                             Icon ID can be specified with following format:
                             <ID>,<file-name>                            [array]
      --ignore-signed        Force read input file even if it is a signed
                             executable                                [boolean]
      --internal-name        Internal name for version resource         [string]
      --lang                 Resource language id (default: 1033)       [number]
  -n, --new                  Create an empty (data-only) executable binary.
                             Cannot specify an input file if this option is
                             used.                                     [boolean]
  -N, --no-grow              Disallow growing resource section size (throw
                             errors if data exceeds)                   [boolean]
      --original-filename    Original file name for version resource    [string]
      --p12, --pfx           PKCS 12 file (.p12 or .pfx file), which contains
                             private key and certificates, for signing.
                             Requires --sign option.                    [string]
      --password             Password/passphrase for private key. If an empty
                             string password is required, specify '' (sh) or ""
                             (cmd.exe).
                             Requires --sign option.                    [string]
      --private-key, --key   Private key file for signing. (only PEM format file
                             (.pem) is supported)
                             Requires --sign option.                    [string]
      --product-name         Product name for version resource          [string]
      --product-version      Product version for version resource.
                             Must be 'n.n.n.n' format (n is an integer) [string]
      --raw                  One or more resources to add to executable.
                             The value must be one of following format:
                             * <type>,<ID>,<string-value>
                             * <type>,<ID>,@<file-name>
                             (<string-value> will be stored as UTF-8 string)
                                                                         [array]
      --raw2                 One or more resources to add to executable.
                             The value must be one of following format:
                             * <type-name>,<ID>,<string-value>
                             * <type-name>,<ID>,@<file-name>
                             (<string-value> will be stored as UTF-8 string)
                             Type names must be the predefined names described
                             below.                                      [array]
      --select               Certificate selection mode whether to pick
                             certificates from the specified file (default:
                             leaf)
                             * leaf    : only pick 'leaf' certificate
                             * no-root : pick certificates except for root
                             certificate (i.e. issuer is equal to subject)
                             * all     : no filter certificates (includes all
                             certificates)
                                    [string] [choices: "leaf", "no-root", "all"]
  -s, --sign                 Sign output executables                   [boolean]
      --timestamp            Timestamp server to set timestamp for signed data.
                             Requires --sign option.                    [string]
  -v, --verbose              Output logs while processing.             [boolean]
  -V, --version              Show version number of this tool          [boolean]

The predefined type names are: accelerator, anicursor, aniCursor, aniicon,
aniIcon, bitmap, cursor, dialog, dlginclude, dlgInclude, font, fontdir, fontDir,
groupcursor, groupCursor, groupicon, groupIcon, html, icon, manifest, menu,
messagetable, messageTable, plugplay, plugPlay, rcdata, rcData, string, version,
vxd
In addition, 'allicon'/'allIcon' and 'allcursor'/'allCursor' can also be used
for --delete-xxxxx (e.g. --delete-allicon).
```

### Main options

#### `[--in] <in>`

- `string`
- Required if `--new` is not specified
- Cannot use with `--new`
- Alias: `-i`

Specifies input executable file name. You can omit `--in`; the first parameter without option will be treated as 'input'.

#### `[--out] <out>`

- `string`
- Required
- Alias: `-o`

Specifies output executable file name. You can omit `--out`; the second parameter without option or, if `--in` or `--new` is used, the first parameter without option will be treated as 'output'.

> Note: This tool does not check whether the output file exists, so the output may be overwritten without any prompts.

#### `--new`

- Flag (boolean)
- Required if an input file (or `--in`) is not specified
- Cannot use with an input file
- Alias: `-n`

Generates an empty (data-only) executable binary. The generated binary will not contain `.code` section, so the binary cannot execute or load as a regular DLL. For example the binary can be used as a data file by calling `LoadLibraryEx` with `LOAD_LIBRARY_AS_DATAFILE`.

#### `--as-32bit`

- Flag (boolean)
- Ignored if `--new` is not specified
- Default: false

When generating an empty binary, the binary will be as an 32-bit executable. If this option is not specified, the 64-bit executable will be generated.

#### `--as-exe`

- Flag (boolean)
- Ignored if `--new` is not specified
- Default: false

When generating an empty binary, the binary will be as an EXE binary. If this option is not specified, the DLL binary will be generated.

Note that this option does not affect the output file name (specified in `--out`)

#### `--allow-shrink`

- Flag (boolean)
- Default: false

If set, when replacing resource data into the executable, the resource section size will be the minimum (may be less than the original size).

On default (if not set or set `false`), the resource section size is kept for the original size, even if actual resource data size is less than or equal to the original.

#### `--no-grow`

- Flag (boolean)
- Default: false
- Alias: `-N`

If set, when replacing resource data size is larger than the original one in the executable, an error will be thrown.

Some executable generation tools (such as `pkg`) rely on data locations, and if the locations changed, the executable will not run correctly. This option is usable for avoiding changing those locations unexpectedly.

#### `--lang <lang-id>`

- `number` (integer)
- Default: `1033`

Specifies the resource language ID (LANGID) for the language value of new resources. If the resources with the same type, resource ID, and the language ID already exist, they will be replaced. (Regardless of this value, _all_ version resources will be dropped when adding the new version resources.)

#### `--definition <definition-file>`

- `string`

Specifies the definition file containing resource information to be added ([see below](#the-definition-object)). If another options are also specified, the options will take precedence over definitions.

#### `--ignore-signed`

- Flag (`boolean`)

By default signed executable file is not allowed to be specified as an input. This option will ignore this behavior and force parsing signed executable binary.

Note that the output binary will not be signed by default. You need to re-sign it with `--sign` option or other signing tools such as 'signtool'.

### Icon resource options

Note: The value from `--lang` will be used as the language for all icons. To specify different languages for each icons, please use the definition file.

#### `--icon [<id>,]<file-name>`

- `string`

Adds or replaces icons from specified icon file(s). `<id>` must be an integer or string for icon resource ID, and `<file-name>` must be an icon file; these must be concatenated with `,` (colon) character, without any spaces. (e.g. `--icon 1,icon1.ico` and `--icon "ICON,myapp.ico"` are valid, whereas `--icon 2, icon2.ico` is not valid)  
You can skip specifying `<id>,` to set icon IDs automatically. (e.g. `--icon icon1.ico`) In this case the first available integer IDs will be used.

This option can be specified one or more. (e.g. `--icon 1,icon1.ico --icon ICON2,icon2.ico --icon icon3.ico`)

### Version resource options

Note:

- If any of version resource options are specified, _all_ existing version resources in the base executable will be dropped.
- To specify values not in below options, or to specify multi-language version data, please use the definition file.

#### `--product-name <product-name>`

- `string`

Specifies `ProductName` field.

#### `--product-version <product-version>`

- `string`
- Must be `x.x.x.x` format (four unsigned integer values concatenated with `.` (dot) character)

Specifies `ProductVersion` field. This value will also be used as `dwProductVersionMS` and `dwProductVersionLS` in `VS_FIXEDFILEINFO` (For `a.b.c.d` value, `dwProductVersionMS = (a << 16) | b` and `dwProductVersionLS = (c << 16) | d` are performed).

#### `--file-description <file-description>`

- `string`

Specifies `FileDescription` field.

#### `--file-version <file-version>`

- `string`
- Must be `x.x.x.x` format (four unsigned integer values concatenated with `.` (dot) character)

Specifies `FileVersion` field. This value will also be used as `dwFileVersionMS` and `dwFileVersionLS` in `VS_FIXEDFILEINFO` (For `a.b.c.d` value, `dwFileVersionMS = (a << 16) | b` and `dwFileVersionLS = (c << 16) | d` are performed).

#### `--company-name <company-name>`

- `string`

Specifies `CompanyName` field.

#### `--original-filename <original-filename>`

- `string`

Specifies `OriginalFilename` field.

#### `--internal-name <internal-name>`

- `string`

Specifies `InternalName` field.

### Raw resource options

Note: The value from `--lang` will be used as the language for all resources. To specify different languages, please use the definition file.

#### `--raw <data>`

- `string`

Specifies any resource data to contain. `<data>` must be either `<type>,<ID>,<string-value>` or `<type>,<ID>,@<file-name>`, whose values are as followings:

- `<type>` : Resource type value which must be integer or string. This tool does not convert the type value to commonly-used type identifier (e.g. specify `24` value for `RT_MANIFEST`, not specify `"RT_MANIFEST"`). To use commonly name, use `--raw2` instead.
- `<ID>` : Resource ID value which must be integer or string.
- `<string-value>` : Actual resource data. The value will be stored as UTF-8 string data.
- `@<file-name>` : File name containing data for the resource. `@` character must be followed by the file name.

This option can be specified one or more.

#### `--raw2 <data>`

- `string`

Specifies any resource data to contain. Similar to `--raw`, but `<type>` will be `<typeName>`, which must be the predefined type name, instead.

`<data>` must be either `<typeName>,<ID>,<string-value>` or `<typeName>,<ID>,@<file-name>`, whose values are as followings:

- `<typeName>` : Predefine resource type name. Valid names are: `accelerator`, `anicursor`, `aniCursor`, `aniicon`, `aniIcon`, `bitmap`, `cursor`, `dialog`, `dlginclude`, `dlgInclude`, `font`, `fontdir`, `fontDir`, `groupcursor`, `groupCursor`, `groupicon`, `groupIcon`, `html`, `icon`, `manifest`, `menu`, `messagetable`, `messageTable`, `plugplay`, `plugPlay`, `rcdata`, `rcData`, `string`, `version`, `vxd`
- `<ID>` : Resource ID value which must be integer or string.
- `<string-value>` : Actual resource data. The value will be stored as UTF-8 string data.
- `@<file-name>` : File name containing data for the resource. `@` character must be followed by the file name.

This option can be specified one or more.

### Delete options

If following options are used, appropriate resources are deleted first, and adding/replacing operations will be performed.

#### `--delete <data>`

- `string`

Specifies resource data to delete. `<data>` must be `<type>` or `<type>,<ID>`, whose values are as followings:

- `<type>` : Resource type value which must be integer or string. This tool does not convert the type value to commonly-used type identifier (e.g. specify `24` value for `RT_MANIFEST`, not specify `"RT_MANIFEST"`). To use commonly name, use `--delete-xxxxx` instead.
- `<ID>` : (optional) Resource ID value which must be integer or string. `,<ID>` can be omitted; in this case, all resources with the type will be deleted.

Note that `--lang` value is ignored for deletion.

#### `--delete-xxxxx [<ID>]`

- `string`

Specifies resource data to delete by type. `xxxxx` is a placeholder (see below). `[<ID>]` is a resource ID value, which must be integer or string, to delete. If omitted, all resources with the type will be deleted.

`xxxxx` must be the predefined names as: `accelerator`, `anicursor`, `aniCursor`, `aniicon`, `aniIcon`, `bitmap`, `cursor`, `dialog`, `dlginclude`, `dlgInclude`, `font`, `fontdir`, `fontDir`, `groupcursor`, `groupCursor`, `groupicon`, `groupIcon`, `html`, `icon`, `manifest`, `menu`, `messagetable`, `messageTable`, `plugplay`, `plugPlay`, `rcdata`, `rcData`, `string`, `version`, `vxd` (these are equal to the name available in `--raw2`).

Additionally, `allicon`, `allIcon`, `allcursor`, `allCursor` can be used for `xxxxx`. `allicon` and `allIcon` deletes `icon`, `groupIcon`, and `aniIcon`, and `allcursor` and `allCursor` deletes `cursor`, `groupCursor`, and `aniCursor`.

Note that `--lang` value is ignored for deletion.

#### `--fail-if-no-delete`

- Flag (`boolean`)

If specified, and the resource data to be deleted does not exist, the tool will fail.

### Signing options

#### `--sign`

- Flag (boolean)
- Alias: `-s`

To specify this option, the output executable will be signed with appropriate data.

Note: If `--sign` is not specified, all signing options will be ignored and the output executable will not be signed.

#### `--p12 <file>`

- `string`
- Required if `--certificate` and `--private-key` are not specified
- Cannot be specified if `--certificate` and `--private-key` are specified
- Alias: `--pfx`

Specifies pkcs12 data file ('.p12' or '.pfx' file) containing certificate(s) and a private key. If either of them is missing in pkcs12 data, an error will be thrown.

Note: If the private key requires a password (including an 'empty' password), `--password` option is necessary.

#### `--certificate <file>`

- `string`
- Required if `--p12` is not specified
- Cannot be specified if `--p12` is specified
- Alias: `--cert`

Specifies a certificate file. PEM format ('.pem') and DER format (simple certificate data '.cer', or pkcs7 data containing one or more certificates '.p7b') are supported.

#### `--private-key <file>`

- `string`
- Required if `--p12` is not specified
- Cannot be specified if `--p12` is specified
- Alias: `--key`

Specifies a private-key file. Only PEM format ('.pem') is supported.

Note: If the private key requires a password (including an 'empty' password), `--password` option is necessary.

#### `--select <mode>`

- Choices: `leaf`, `no-root`, `all`
- Default: `leaf`

Specifies a mode for selecting certificates collected from `--p12` or `--certificates`, to be included in the signed executable. The choices has following meanings:

- `leaf` : only includes the 'leaf' certificate on the certificate chain.
- `no-root` : includes the certificates, excluding the root certificate. If specified certificates has no root certificate, `no-root` has the same meaning for `all`.
- `all` : includes all certificates. This is not recommended because the root certificate should be used from the system certificate store on verifying.

Note: this tool does not look into the system certificate store to select certificates.

#### `--password <pass>`

- `string`
- Default: not using password

Specifies a password (passphrase) for the private key. To specify an empty password required for the key, please use `--password ''` (sh) or `--password ""` (cmd.exe).

Note: It is not supported to input a password from stdin (i.e. prompting for a password).

#### `--digest <algorithm>`

- Choices: `sha1`, `sha256`, `sha512`, `sha224`, `sha384`, `sha512-224`, `sha512-256`, `sha3-224`, `sha3-256`, `sha3-384`, `sha3-512`, `shake128`, `shake256`
- Default: `sha256`

Specifies an algorithm for generating digest. Some algorithms are available only if Node.js supports.

> Windows might not support some algorithms such as `sha512-224` and `sha3-512`.

#### `--timestamp <server-url>`

- `string`

Specifies a URL of the Time Stamping Authority (TSA), to add a time-stamp information for signed binary. The server must accept and response Time-Stamp Protocol (TSP) based on RFC 3161.

By default Node.js native `fetch`, or `http` or `https` module will be used for connection, but you can use [request](https://www.npmjs.com/package/request) module or [node-fetch](https://www.npmjs.com/package/node-fetch) by installing it manually as followings:

```
npm install resedit-cli request
- or -
npm install resedit-cli node-fetch
```

> - For `request`, at least `request@2.88.0` is expected. If less than 2.88.0, a warning log will be printed.
> - For `node-fetch`, `node-fetch@3` is expected. You can instead set `global.fetch` variable with a valid function. This means that you can use another `fetch` library such as `isomorphic-fetch`.
> - Currently if both `request` and fetch are available, fetch is used.

By installing one of them, you can connect to the server with features that those module supports, such as with a HTTP proxy. (If those modules are not installed, HTTP proxies cannot be used.)

If this parameter is omitted, a time-stamp will not be added.

### Other options

#### `--help`

- Flag (boolean)
- Alias: `-h`, `-?`

Outputs the usage for this tool.

#### `--version`

- Flag (boolean)
- Alias: `-V`

Outputs the version of this tool and [resedit](https://www.npmjs.com/package/resedit) library.

#### `--verbose`

- Flag (boolean)
- Alias: `-v`

Specifies to output logs for processing. If `--debug` is also specified, `--verbose` will be ignored and more logs will be printed.

#### `--debug`

- Flag (boolean)

Specifies to output more logs for processing than `--verbose`. Note that even if `--debug` is enabled, the password string will not be printed.

## Examples

Setting icon (ID = 1) to the data in specified file and string data on version resource data:

```
resedit base/a.exe out/a.exe --icon 1,res/myapp.ico --file-version 1.0.0.1 --file-description "My application"
```

Adding or replacing '.manifest' file:

```
resedit base/a.exe out/a.exe --raw 24,1,@res/myapp.manifest
```

Creating a resource-only DLL file from `myDefinition.yml` file (see below for 'the definition object'):

```
resedit --new out/x.dll --definition myDefinition.yml
```

Signing an executable:

```
resedit base/a.exe out/a.exe --sign --p12 signData/my.pfx --password ""
```

## The definition object

This tool supports 'the definition object' that defines resources and/or signing informations. This is useful for specifying complicated options.

From command line, you can specify a file containing the definition with using `--definition` parameter.
The file format must be either JSON, YAML, or JS file that exports a definition object (using [cosmiconfig](https://www.npmjs.com/package/cosmiconfig)). The object type is defined as a TypeScript interface type `DefinitionData` (defined in [definitions/DefinitionData.ts](./src/main/definitions/DefinitionData.ts)).

Note: The command-line options take precedence of values in the definition object if the same data is specified.

### Examples

As YAML file:

```yaml
lang: 1041
version:
  # If fileVersion is defined, fileVersionMS and fileVersionLS can be omitted, and
  # filled by parsed values from fileVersion.
  # (With following value, fileVersionMS will be '0x20003' and fileVersionLS will be '0x40005')
  fileVersion: 2.3.4.5
  fileDescription: description description description
  productVersion: 2.3.0.0
```

As JS file (.mjs):

```mjs
import * as path from 'path';

// a user-defined function to retrieve data asynchronously
import { promptPfxFile, promptPassword } from './func';

// Asynchronously returns a definition object
async function loadDefintion() {
  return {
    lang: 1041,
    icons: [
      {
        id: 101,
        sourceFile: path.resolve(__dirname, 'myapp.ico'),
      },
    ].
    version: {
      fileVersion: '2.3.4.5',
      fileDescription: 'description description description',
      productVersion: '2.3.0.0',
    },
    raw: [
      {
        type: 24,
        id: 1,
        file: path.resolve(__dirname, 'myapp.manifest'),
      },
    ],
    sign: {
      p12File: await promptPfxFile(),
      password: await promptPassword(),
    },
  };
}

// Since cosmiconfig supports, you can export 'Promise' object.
export default loadDefintion();
```

> .cjs is still supported.

## APIs

This tool is created for the command line tool, but you can also use this as a Node.js library.

```js
import resedit from 'resedit-cli';

await resedit({
  in: '/path/to/input/MyApp.exe',
  out: '/path/to/output/MyApp.exe',
  // definition object
  definition: {
    lang: 1033,
    version: {
      productName: 'MyApp',
      productVersion: '0.0.0.0',
    },
  },
  // This value is used instead of the value from 'definition'
  'product-version': '1.0.0.1',
});
```

## Notes

- If none of resource options are specified, the entire resource data in the input executable will be untouched. You can (re-)sign executables without modifying resources.

## License

[MIT License](./LICENSE)
