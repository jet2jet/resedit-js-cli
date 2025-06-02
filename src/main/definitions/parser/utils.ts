////////////////////////////////////////////////////////////////////////////////
// validation

import {
	PredefinedResourceTypeName,
	PredefinedResourceTypeNameForDelete,
} from '../DefinitionData.js';

export function validateBooleanValue(
	data: unknown,
	propName: string
): asserts data is boolean {
	if (typeof data !== 'boolean') {
		throw new Error(`Invalid data: '${propName}' is not a boolean`);
	}
}

export function validateIntegerValue(
	data: unknown,
	propName: string
): asserts data is number {
	if (typeof data !== 'number') {
		throw new Error(`Invalid data: '${propName}' is not a number`);
	}
	if (Math.floor(data) !== data) {
		throw new Error(
			`Invalid data: '${propName}' is numeric, but not an integer`
		);
	}
}

export function validateStringValue(
	data: unknown,
	propName: string
): asserts data is string {
	if (typeof data !== 'string') {
		throw new Error(`Invalid data: '${propName}' is not a string`);
	}
}

export function validateStringOrIntegerValue(
	data: unknown,
	propName: string
): asserts data is string | number {
	if (typeof data === 'number') {
		if (Math.floor(data) !== data) {
			throw new Error(
				`Invalid data: '${propName}' is numeric, but not an integer`
			);
		}
	} else if (typeof data !== 'string') {
		throw new Error(
			`Invalid data: '${propName}' is neither a string nor a number`
		);
	}
}

export function validatePredefinedResourceTypeName(
	data: unknown,
	propName: string
): asserts data is keyof typeof PredefinedResourceTypeName {
	if (
		typeof data !== 'string' ||
		!Object.keys(PredefinedResourceTypeName).includes(data)
	) {
		throw new Error(
			`Invalid data: '${propName}' is not a valid predefined resource type name`
		);
	}
}

export function validatePredefinedResourceTypeNameForDelete(
	data: unknown,
	propName: string
): asserts data is keyof typeof PredefinedResourceTypeNameForDelete {
	if (
		typeof data !== 'string' ||
		!Object.keys(PredefinedResourceTypeNameForDelete).includes(data)
	) {
		throw new Error(
			`Invalid data: '${propName}' is not a valid predefined resource type name`
		);
	}
}
