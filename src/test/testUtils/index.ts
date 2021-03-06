export function timeoutErrorPromise(millisec: number): Promise<Error> {
	const promise = new Promise<void>((resolve) =>
		setTimeout(resolve, millisec)
	).then(() => new Error('timeout'));
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	promise.catch(() => {});
	return promise;
}
