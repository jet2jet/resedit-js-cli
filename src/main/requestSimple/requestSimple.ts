import requestSimpleUsingFetch, {
	isAvailable as isFetchAvailable,
} from './requestSimpleUsingFetch.js';
import requestSimpleUsingHttp from './requestSimpleUsingHttp.js';

const requestSimple = isFetchAvailable()
	? requestSimpleUsingFetch
	: requestSimpleUsingHttp;

export default requestSimple;
