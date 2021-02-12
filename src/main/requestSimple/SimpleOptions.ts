// TODO: replace 'any' to 'unknown'
export default interface SimpleOptions {
	method: string;
	headers?: { [key: string]: string };
	body?: any;
}
