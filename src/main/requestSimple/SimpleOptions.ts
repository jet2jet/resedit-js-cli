// TODO: replace 'any' to 'unknown'
export default interface SimpleOptions {
	method: string;
	headers?: Record<string, string>;
	body?: any;
}
