////////////////////////////////////////////////////////////////////////////////
// validation

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
