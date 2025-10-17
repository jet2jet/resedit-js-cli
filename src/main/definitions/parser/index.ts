import {
	type ParsedDeleteResourceDefinition,
	parseDeleteResource,
} from './delete.js';
import parseIcons, { type ParsedIconDefinition } from './icons.js';
import parseRawResource, {
	type ParsedRawResourceDefinition,
} from './rawResource.js';
import parseSignDefinition, { type ParsedSignDefinition } from './sign.js';
import parseVersion, { type ParsedVersionDefinition } from './version.js';

export interface ParsedDefinitionData {
	lang?: number;
	icons?: ParsedIconDefinition[];
	version?: ParsedVersionDefinition;
	raw?: ParsedRawResourceDefinition[];
	delete?: ParsedDeleteResourceDefinition[];
	sign?: ParsedSignDefinition;
}

export default function parseDefinitionData(
	data: unknown
): ParsedDefinitionData {
	// check if data is a non-null object
	if (typeof data !== 'object' || !data) {
		throw new Error('Invalid data: not an object');
	}
	const ret: ParsedDefinitionData = {};
	// check properties
	Object.keys(data).forEach((key) => {
		const value = (data as Record<string, unknown>)[key];
		switch (key) {
			case 'lang':
				if (typeof value !== 'number') {
					throw new Error("Invalid data: invalid 'lang' value");
				}
				ret.lang = value;
				break;
			case 'icons':
				ret.icons = parseIcons(value);
				break;
			case 'version':
				ret.version = parseVersion(value);
				break;
			case 'raw':
				ret.raw = parseRawResource(value);
				break;
			case 'delete':
				ret.delete = parseDeleteResource(value);
				break;
			case 'sign':
				ret.sign = parseSignDefinition(value);
				break;
			default:
				throw new Error(`Invalid data: unknown property '${key}'`);
		}
	});
	return ret;
}
