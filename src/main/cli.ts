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
	new?: boolean;
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
  ${thisName} [[--in] <input> | --new] [--out] <output> [<options...>]`
			)
			.option('allow-shrink', {
				description:
					'Allow shrinking resource section size (if the data size is less than original)',
				type: 'boolean',
				nargs: 0,
			})
			.option('as-32bit', {
				type: 'boolean',
				description:
					'Creates the executable binary as a 32-bit version (default: as 64-bit).\nRequires --new option.',
				nargs: 0,
			})
			.option('as-exe-file', {
				type: 'boolean',
				description:
					'Creates the executable binary as an EXE file (default: as a DLL).\nRequires --new option.',
				nargs: 0,
			})
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
				description:
					'Input executable file name.\nCannot specify --new if an input file is specified.',
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
			.option('new', {
				alias: ['n'],
				type: 'boolean',
				description:
					'Create an empty (data-only) executable binary.\nCannot specify an input file if this option is used.',
				nargs: 0,
			})
			.option('no-grow', {
				alias: ['N'],
				description:
					'Disallow growing resource section size (throw errors if data exceeds)',
				type: 'boolean',
				nargs: 0,
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
				if (!argv.new && (argv.in === undefined || argv.in === '')) {
					const val = restArgs.splice(0, 1).shift();
					const inVal = val !== undefined ? `${val}` : '';
					if (inVal !== '') {
						argv.in = inVal;
					}
				}
				if (!argv.out) {
					const val = restArgs.splice(0, 1).shift();
					argv.out = val !== undefined ? `${val}` : '';
				}
				if (argv.in === undefined || argv.in === '') {
					if (!argv.new) {
						throw new CommandLineError('input file is missing.');
					}
					argv.in = undefined;
				} else if (argv.new) {
					throw new CommandLineError(
						'cannot specify both input file and --new.'
					);
				}
				if (!argv.out) {
					throw new CommandLineError('output file is missing.');
				}
				if (argv.new && argv.noGrow) {
					throw new CommandLineError(
						'--no-grow cannot be used with --new'
					);
				}
				return true;
			})
			.fail((msg, err, yargs?: yargs.Argv) => {
				if (err !== null && err !== undefined) {
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

		if ('debug' in argv && argv.debug !== false) {
			loglevel.setLevel('DEBUG');
		} else if ('verbose' in argv && argv.verbose !== false) {
			loglevel.setLevel('INFO');
		}

		await run(argv);
	} catch (s) {
		if (s instanceof CommandLineError) {
			console.error(s.message);
		} else if (s instanceof Error) {
			console.error(`${thisName}:`, s.stack ?? s.message);
		} else {
			let msg: string | undefined;
			if (typeof s !== 'string') {
				msg = s.toString();
			} else {
				msg = s;
			}
			if (msg !== undefined) {
				console.error(msg);
			}
		}
		return 1;
	}
	return 0;
}

// 'main' should not throw
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
	process.exit(await main());
})();
