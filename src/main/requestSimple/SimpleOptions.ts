export default interface SimpleOptions {
	method: string;
	headers?: Record<string, string>;
	body?: Buffer;
}
