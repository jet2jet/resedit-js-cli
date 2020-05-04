#!/usr/bin/env node

import * as loglevel from 'loglevel';
import * as yargs from 'yargs';

import Options from './Options';

import run from './run';
import thisVersion from './version';
import { certificateSelectModeValues } from './definitions/DefinitionData';
import { getValidDigestAlgorithm } from './definitions/parser/sign';

const thisName = 'resedit';

interface Args extends yargs.Arguments, Options {
	version?: boolean;
}

////////////////////////////////////////////////////////////////////////////////

class CommandLineError extends Error {}

async function main(): Promise<number> {
	loglevel.setDefaultLevel('WARN');
	try {
		const argv = yargs
			.scriptName(thisName)
			.version(false)
			.locale('en')
			.usage(
				`Usage:
  ${thisName} [--in] <input> [--out] <output> [<options...>]`
			)
			.option('certificate', {
				alias: ['cert'],
				description:
					'Certificate file for signing.\n(DER format file (.cer) or PEM format file (.pem) is supported)\nRequires --sign option.',
				type: 'string',
				nargs: 1,
			})
			.option('company-name', {
				description: 'Company name for version resource',
				type: 'string',
				nargs: 1,
			})
			.option('debug', {
				type: 'boolean',
				description:
					'Output more logs than verbose mode while processing.',
				nargs: 0,
			})
			.option('definition', {
				description:
					'Resource definition file which contains resource data to write (see document for details)',
				type: 'string',
				nargs: 1,
			})
			.option('digest', {
				description:
					"Digest algorithm for signing. (default: 'sha256')\nRequires --sign option.",
				type: 'string',
				choices: getValidDigestAlgorithm(),
				nargs: 1,
			})
			.option('file-description', {
				description: 'File description for version resource',
				type: 'string',
				nargs: 1,
			})
			.option('file-version', {
				description:
					"File version for version resource.\nMust be 'n.n.n.n' format (n is an integer)",
				type: 'string',
				nargs: 1,
			})
			.option('help', {
				alias: ['h', '?'],
				type: 'boolean',
				description: 'Show help',
			})
			.option('icon', {
				description:
					'One or more icon files to add to executable.\nIcon ID can be specified with following format: <ID>,<file-name>',
				type: 'array',
				nargs: 1,
			})
			.option('ignore-signed', {
				description:
					'Force read input file even if it is a signed executable',
				type: 'boolean',
			})
			.option('in', {
				alias: 'i',
				description: 'Input executable file name',
				type: 'string',
				nargs: 1,
			})
			.option('internal-name', {
				description: 'Internal name for version resource',
				type: 'string',
				nargs: 1,
			})
			.option('lang', {
				description: 'Resource language id (default: 1033)',
				type: 'number',
				nargs: 1,
			})
			.option('original-filename', {
				description: 'Original file name for version resource',
				type: 'string',
				nargs: 1,
			})
			.option('out', {
				alias: 'o',
				description: 'Output executable file name',
				type: 'string',
				nargs: 1,
			})
			.option('p12', {
				alias: ['pfx'],
				description:
					'PKCS 12 file (.p12 or .pfx file), which contains private key and certificates, for signing.\nRequires --sign option.',
				type: 'string',
				nargs: 1,
			})
			.option('password', {
				description:
					'Password/passphrase for private key.\nIf an empty string password is required, specify \'\' (sh) or "" (cmd.exe).\nRequires --sign option.',
				type: 'string',
				nargs: 1,
			})
			.option('private-key', {
				alias: ['key'],
				description:
					'Private key file for signing.\n(only PEM format file (.pem) is supported)\nRequires --sign option.',
				type: 'string',
				nargs: 1,
			})
			.option('product-name', {
				description: 'Product name for version resource',
				type: 'string',
				nargs: 1,
			})
			.option('product-version', {
				description:
					"Product version for version resource.\nMust be 'n.n.n.n' format (n is an integer)",
				type: 'string',
				nargs: 1,
			})
			.option('raw', {
				description:
					'One or more resources to add to executable.\nThe value must be one of following format:\n* <type>,<ID>,<string-value>\n* <type>,<ID>,@<file-name>\n(<string-value> will be stored as UTF-8 string)',
				type: 'array',
				nargs: 1,
			})
			.option('select', {
				type: 'string',
				description:
					'Certificate selection mode whether to pick certificates from the specified file (default: leaf)\n' +
					"* leaf    : only pick 'leaf' certificate\n" +
					'* no-root : pick certificates except for root certificate (i.e. issuer is equal to subject)\n' +
					'* all     : no filter certificates (includes all certificates)',
				choices: certificateSelectModeValues,
			})
			.option('sign', {
				alias: 's',
				type: 'boolean',
				description: 'Sign output executables',
			})
			.option('timestamp', {
				description:
					'Timestamp server to set timestamp for signed data.\nRequires --sign option.',
				type: 'string',
				nargs: 1,
			})
			.option('verbose', {
				alias: 'v',
				type: 'boolean',
				description: 'Output logs while processing.',
				nargs: 0,
			})
			.option('version', {
				alias: 'V',
				type: 'boolean',
				description: 'Show version number of this tool',
				nargs: 0,
			})
			.strict()
			.check((a) => {
				const argv = a as Args;
				if (argv.version) {
					return true;
				}
				// parse parameters without option key
				// - the first parameter is used for input file
				// - the second parameter is used for output file
				const restArgs = argv._;
				if (!argv.in) {
					argv.in = restArgs.splice(0, 1)[0];
				}
				if (!argv.out) {
					argv.out = restArgs.splice(0, 1)[0];
				}
				if (!argv.in) {
					throw new CommandLineError('input file is missing.');
				}
				if (!argv.out) {
					throw new CommandLineError('output file is missing.');
				}
				return true;
			})
			.fail((msg, err, yargs?: yargs.Argv) => {
				if (err) {
					if (err instanceof CommandLineError) {
						msg = err.message;
					} else if (typeof err === 'string') {
						msg = err;
					} else {
						throw err;
					}
				}
				msg = yargs!.help().toString() + '\n\nERROR: ' + msg;
				throw new CommandLineError(msg);
			}).argv as Args;

		if (argv.version) {
			console.log(`${thisName} version ${thisVersion}`);
			return 0;
		}

		if (argv.debug) {
			loglevel.setLevel('DEBUG');
		} else if (argv.verbose) {
			loglevel.setLevel('INFO');
		}

		await run(argv);
	} catch (s) {
		if (s instanceof CommandLineError) {
			console.error(s.message);
		} else if (s instanceof Error) {
			console.error(`${thisName}:`, s.stack || s.message);
		} else {
			let msg: string | undefined;
			if (typeof s !== 'string') {
				msg = s.toString();
			} else {
				msg = s;
			}
			if (msg) {
				console.error(msg);
			}
		}
		return 1;
	}
	return 0;
}

(async () => {
	process.exit(await main());
})();