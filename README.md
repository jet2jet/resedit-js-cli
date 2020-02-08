[![NPM version](https://badge.fury.io/js/resedit-cli.svg)](https://www.npmjs.com/package/resedit-cli)
[![Build Status](https://api.travis-ci.com/jet2jet/resedit-js-cli.svg?branch=master)](https://www.travis-ci.com/jet2jet/resedit-js-cli)

# resedit-js-cli

resedit-js-cli is a command line (CLI) tool for manipulating resources in Windows Executable files, as well as signing executables. This tool runs on Node.js environment.

## Table of contents

- [Install](#install)
- [Usage](#usage)
  - [Main options](#main-options)
  - [Icon resource options](#icon-resource-options)
  - [Version resource options](#version-resource-options)
  - [Raw resource options](#raw-resource-options)
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
  resedit [--in] <input> [--out] <output> [<options...>]

Options:
  --help, -h, -?         Show help                                     [boolean]
  --certificate, --cert  Certificate file for signing.
                         (DER format file (.cer) or PEM format file (.pem) is
                         supported)
                         Requires --sign option.                        [string]
  --company-name         Company name for version resource              [string]
  --debug                Output more logs than verbose mode while processing.
                                                                       [boolean]
  --definition           Resource definition file which contains resource data
                         to write (see document for details)            [string]
  --digest               Digest algorithm for signing. (default: 'sha256')
                         Requires --sign option.
                                            [string] [choices: "sha1", "sha256"]
  --file-description     File description for version resource          [string]
  --file-version         File version for version resource.
                         Must be 'n.n.n.n' format (n is an integer)     [string]
  --icon                 One or more icon files to add to executable.
                         Icon ID can be specified with following format:
                         <ID>,<file-name>                                [array]
  --ignore-signed        Force read input file even if it is a signed executable
                                                                       [boolean]
  --in, -i               Input executable file name                     [string]
  --internal-name        Internal name for version resource             [string]
  --lang                 Resource language id (default: 1033)           [number]
  --original-filename    Original file name for version resource        [string]
  --out, -o              Output executable file name                    [string]
  --p12, --pfx           PKCS 12 file (.p12 or .pfx file), which contains
                         private key and certificates, for signing.
                         Requires --sign option.                        [string]
  --password             Password/passphrase for private key.
                         If an empty string password is required, specify ''
                         (sh) or "" (cmd.exe).
                         Requires --sign option.                        [string]
  --private-key, --key   Private key file for signing.
                         (only PEM format file (.pem) is supported)
                         Requires --sign option.                        [string]
  --product-name         Product name for version resource              [string]
  --product-version      Product version for version resource.
                         Must be 'n.n.n.n' format (n is an integer)     [string]
  --raw                  One or more resources to add to executable.
                         The value must be one of following format:
                         * <type>,<ID>,<string-value>
                         * <type>,<ID>,@<file-name>
                         (<string-value> will be stored as UTF-8 string) [array]
  --select               Certificate selection mode whether to pick certificates
                         from the specified file (default: leaf)
                         * leaf    : only pick 'leaf' certificate
                         * no-root : pick certificates except for root
                         certificate (i.e. issuer is equal to subject)
                         * all     : no filter certificates (includes all
                         certificates)
                                    [string] [choices: "leaf", "no-root", "all"]
  --sign, -s             Sign output executables                       [boolean]
  --timestamp            Timestamp server to set timestamp for signed data.
                         Requires --sign option.                        [string]
  --verbose, -v          Output logs while processing.                 [boolean]
  --version, -V          Show version number of this tool              [boolean]
```

### Main options

#### `[--in] <input>`

- `string`
- Required
- Alias: `-i`

Specifies input executable file name. You can omit `--in`; the first parameter without option will be treated as 'input'.

#### `[--out] <output>`

- `string`
- Required
- Alias: `-o`

Specifies output executable file name. You can omit `--out`; the second parameter without option or, if `--in` is used, the first parameter without option will be treated as 'output'.

> Note: This tool does not check whether the output file exists, so the output may be overwritten without any prompts.

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

- `<type>` : Resource type value which must be integer or string. This tool does not convert the type value to commonly-used type identifier (e.g. specify `24` value for `RT_MANIFEST`, not specify `"RT_MANIFEST"`)
- `<ID>` : Resource ID value which must be integer or string.
- `<string-value>` : Actual resource data. The value will be stored as UTF-8 string data.
- `@<file-name>` : File name containing data for the resource. `@` character must be followed by the file name.

This option can be specified one or more.

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

- Choices: `sha1`, `sha256`
- Default: `sha256`

Specifies an algorithm for generating digest.

#### `--timestamp <server-url>`

- `string`

Specifies a URL of the Time Stamping Authority (TSA), to add a time-stamp information for signed binary. The server must accept and response Time-Stamp Protocol (TSP) based on RFC 3161.

By default Node.js `http` or `https` module will be used for connection, but you can use [request](https://www.npmjs.com/package/request) module by installing it manually as followings:

```
npm install resedit-cli request
```

> At least `request@2.88.0` is expected. If less than 2.88.0, a warning log will be printed.

By installing it, you can connect to the server with features that request module supports, such as with a HTTP proxy. (If request module is not installed, HTTP proxies cannot be used.)

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

As JS file:

```js
const path = require('path');

// a user-defined function to retrieve data asynchronously
const { promptPfxFile, promptPassword } = require('./func');

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
module.exports = loadDefintion();
```

## APIs

This tool is created for the command line tool, but you can also use this as a Node.js library.

```js
// NOTE: you must use 'default' in order to call API
const resedit = require('resedit-cli').default;

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

- If none of resource options are specified, the entire resource data in the input exectable will be untouched. You can (re-)sign executables without modifying resources.
- Currently the extra data which does not belong to any sections in the input executable will be dropped.

## License

[MIT License](./LICENSE)
