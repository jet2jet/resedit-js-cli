import * as http from 'http';

// TODO: replace 'any' to 'unknown'
type SimpleCallback = (
	err: any,
	headers: http.IncomingHttpHeaders,
	body: Buffer
) => void;
export default SimpleCallback;
