# Changelog

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
