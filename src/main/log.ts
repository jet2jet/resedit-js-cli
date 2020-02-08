import * as log from 'loglevel';

function makeLogger(type: 'trace' | 'debug' | 'info' | 'warn' | 'error') {
	const prefix = '[' + type.toUpperCase() + ']';
	return (...args: any[]) => log[type](prefix, ...args);
}
export const trace = makeLogger('trace');
export const debug = makeLogger('debug');
export const info = makeLogger('info');
export const warn = makeLogger('warn');
export const error = makeLogger('error');
