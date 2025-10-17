import requestSimpleUsingFetch, {
	isAvailable as isFetchAvailable,
} from './requestSimpleUsingFetch.js';
import requestSimpleUsingHttp from './requestSimpleUsingHttp.js';
import requestSimpleUsingModule, {
	isAvailable as isRequestAvailable,
} from './requestSimpleUsingModule.js';

const requestSimple = isFetchAvailable()
	? requestSimpleUsingFetch
	: isRequestAvailable()
		? requestSimpleUsingModule
		: requestSimpleUsingHttp;

export default requestSimple;
