#!/usr/bin/env node

import { createRequire } from 'module';
import type * as LogLevel from 'loglevel';
import type YArgsFactory from 'yargs';
import type { Arguments, Options as YargsOptions } from 'yargs';
import type * as YArgsHelper from 'yargs/helpers';
import {
	certificateSelectModeValues,
	PredefinedResourceTypeName,
	PredefinedResourceTypeNameForDelete,
} from './definitions/DefinitionData.js';
import { getValidDigestAlgorithm } from './definitions/parser/sign.js';
import type Options from './Options.js';
import type { DeletePredefinedOptions } from './Options.js';
import run from './run.js';
import thisVersion from './version.js';

const require = createRequire(import.meta.url);
const loglevel = require('loglevel') as typeof LogLevel;
// I'll use CommonJS version of yargs to display help message with correct word-wrap
// (see: https://github.com/yargs/yargs/issues/2112)
const yargsFactory = require('yargs') as typeof YArgsFactory;
const { hideBin } = require('yargs/helpers') as typeof YArgsHelper;

const thisName = 'resedit';

interface Args extends Arguments, Options {
	grow?: boolean;
	new?: boolean;
	version?: boolean;
}

type DeletePredefinedOptionsYargOptions = {
	[P in keyof DeletePredefinedOptions]: YargsOptions;
};

////////////////////////////////////////////////////////////////////////////////

class CommandLineError extends Error {}

async function main(): Promise<number> {
	loglevel.setDefaultLevel('WARN');
	try {
		const yargs = yargsFactory(hideBin(process.argv));
		const argv = yargs
			.scriptName(thisName)
			.version(false)
			.locale('en')
			.usage(
				`Usage:
  ${thisName} [[--in] <in> | --new] [--out] <out> [<options...>]`
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
			.option('delete', {
				description:
					'One or more resources to delete from executable.\nThe value must be one of following format:\n* <type>,<ID>\n* <type>',
				type: 'array',
				nargs: 1,
			})
			.option('delete-xxxxx', {
				description:
					'One or more resources to delete from executable (xxxxx is one of the predefined type names described below).\nThe value must be <ID> or no value.',
				type: 'array',
				requiresArg: false,
			})
			.options<DeletePredefinedOptionsYargOptions>(
				Object.keys(PredefinedResourceTypeNameForDelete).reduce(
					(prev, _key) => {
						const key =
							_key as keyof typeof PredefinedResourceTypeNameForDelete;
						prev[`delete-${key}`] = {
							description: `One or more resources to delete <type = ${PredefinedResourceTypeNameForDelete[key]}> from executable.\n* If the value is specified, the specific ID data will be deleted.\n* If the value is omitted, all data with the specified type will be deleted.`,
							type: 'array',
							requiresArg: false,
							hidden: true,
						};
						return prev;
					},

					{} as DeletePredefinedOptionsYargOptions
				)
			)
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
			.option('fail-if-no-delete', {
				description:
					'If specified and the resource to be deleted does not exist, the operation will fail.\nIf no delete options are specified, this flag is ignored.',
				type: 'boolean',
				nargs: 0,
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
			// used for 'no-grow' option
			.option('grow', {
				type: 'boolean',
				hidden: true,
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
					'Password/passphrase for private key. If an empty string password is required, specify \'\' (sh) or "" (cmd.exe).\nRequires --sign option.',
				type: 'string',
				nargs: 1,
			})
			.option('private-key', {
				alias: ['key'],
				description:
					'Private key file for signing. (only PEM format file (.pem) is supported)\nRequires --sign option.',
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
			.option('raw2', {
				description:
					'One or more resources to add to executable.\nThe value must be one of following format:\n* <type-name>,<ID>,<string-value>\n* <type-name>,<ID>,@<file-name>\n(<string-value> will be stored as UTF-8 string)\n' +
					'Type names must be the predefined names described below.',
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
			.epilogue(
				`The predefined type names are: ${Object.keys(
					PredefinedResourceTypeName
				)
					.sort((a, b) => a.localeCompare(b))
					.join(
						', '
					)}\nIn addition, 'allicon'/'allIcon' and 'allcursor'/'allCursor' can also be used for --delete-xxxxx (e.g. --delete-allicon).`
			)
			.command('$0', 'default command', (yargs) => {
				yargs.positional('in', {}).positional('out', {});
			})
			.check((argv, _opts) => {
				if (argv.version) {
					return true;
				}
				// parse parameters without option key
				// - the first parameter is used for input file
				// - the second parameter is used for output file
				const restArgs = argv._;
				if (!argv.new && (argv.in == null || argv.in === '')) {
					const val = restArgs.splice(0, 1).shift();
					const inVal = val !== undefined ? `${val}` : '';
					if (inVal !== '') {
						argv.in = inVal;
					}
				}
				if (argv.out == null || argv.out === '') {
					const val = restArgs.splice(0, 1).shift();
					argv.out = val !== undefined ? `${val}` : '';
				}
				if (argv.in == null || argv.in === '') {
					if (!argv.new) {
						throw new CommandLineError('input file is missing.');
					}
					argv.in = undefined;
				} else if (argv.new) {
					throw new CommandLineError(
						'cannot specify both input file and --new.'
					);
				}
				if (argv.out === '') {
					throw new CommandLineError('output file is missing.');
				}
				if (argv.new && argv.grow === false) {
					throw new CommandLineError(
						'--no-grow cannot be used with --new'
					);
				}
				if (restArgs.length > 0) {
					throw new CommandLineError(
						'Unknown arguments: ' + restArgs.join(', ')
					);
				}
				return true;
			})
			.fail((msg, err, yargs) => {
				if (err !== null && err !== undefined) {
					if (err instanceof CommandLineError) {
						msg = err.message;
					} else if (typeof err === 'string') {
						msg = err;
					} else {
						throw err;
					}
				}
				msg = yargs.help().toString() + '\n\nERROR: ' + msg;
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
		if (argv.noGrow === undefined && argv.grow !== undefined) {
			argv.noGrow = !argv.grow;
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
				msg = String(s);
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
process.exit(await main());
