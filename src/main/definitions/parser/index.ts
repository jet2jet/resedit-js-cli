import parseIcons, { ParsedIconDefinition } from './icons';
import parseRawResource, { ParsedRawResourceDefinition } from './rawResource';
import parseVersion, { ParsedVersionDefinition } from './version';
import parseSignDefinition, { ParsedSignDefinition } from './sign';

export interface ParsedDefinitionData {
	lang?: number;
	icons?: ParsedIconDefinition[];
	version?: ParsedVersionDefinition;
	raw?: ParsedRawResourceDefinition[];
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
		const value: unknown = (data as any)[key];
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
			case 'sign':
				ret.sign = parseSignDefinition(value);
				break;
			default:
				throw new Error(`Invalid data: unknown property '${key}'`);
		}
	});
	return ret;
}
