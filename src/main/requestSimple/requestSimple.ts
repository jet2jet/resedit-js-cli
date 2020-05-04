import requestSimpleUsingModule, {
	isAvailable as isRequestAvailable,
} from './requestSimpleUsingModule';
import requestSimpleUsingFetch, {
	isAvailable as isFetchAvailable,
} from './requestSimpleUsingFetch';
import requestSimpleUsingHttp from './requestSimpleUsingHttp';

const requestSimple = isRequestAvailable()
	? requestSimpleUsingModule
	: isFetchAvailable()
	? requestSimpleUsingFetch
	: requestSimpleUsingHttp;

export default requestSimple;
