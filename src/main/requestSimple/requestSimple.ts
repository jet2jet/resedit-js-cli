import requestSimpleUsingModule, {
	isAvailable as isRequestAvailable,
} from './requestSimpleUsingModule.js';
import requestSimpleUsingFetch, {
	isAvailable as isFetchAvailable,
} from './requestSimpleUsingFetch.js';
import requestSimpleUsingHttp from './requestSimpleUsingHttp.js';

const requestSimple = isRequestAvailable()
	? requestSimpleUsingModule
	: isFetchAvailable()
	? requestSimpleUsingFetch
	: requestSimpleUsingHttp;

export default requestSimple;
