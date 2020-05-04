import * as http from 'http';

type SimpleCallback = (
	err: any,
	headers: http.IncomingHttpHeaders,
	body: Buffer
) => void;
export default SimpleCallback;
