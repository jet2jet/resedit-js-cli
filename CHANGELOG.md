# Changelog

## v2.0.0

- Drop Node.js v12
- Convert scripts to native ESM
  - To use API, ES module `import` is required to load the module.
- Update dependencies

## v1.3.0

- Update dependencies

## v1.2.0

- Update dependencies

## v1.1.1

- Fix to parsing 'no-grow' option

## v1.1.0

- Add --no-grow (-N) and --allow-shrink options (jet2jet/resedit-js#21)

## v1.0.0

- Drop Node.js v10

## v0.3.0

- Add '--new' option to create an empty (data-only) executable binary
- Update dependency packages (including `resedit` to 0.7.0)
  - The usage message is changed due to `yargs` changes
- Changed JS files to ES2017-based scripts
  - At least Node.js v10 should be supported ES2017 features, so this would not be as a breaking change.

## v0.2.1

- Fix dependencies for security fix (370c3a5c, 6d93ddd9)

## v0.2.0

- Add support for 'fetch' function (by using `node-fetch` or global fetch function)
- Update `resedit` to 0.6.0, supporting extra data in the executables

## v0.1.0

- Initial version
