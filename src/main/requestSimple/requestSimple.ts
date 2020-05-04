import requestSimpleUsingModule, {
	isAvailable as isRequestAvailable,
} from './requestSimpleUsingModule';
import requestSimpleUsingHttp from './requestSimpleUsingHttp';

const requestSimple = isRequestAvailable()
	? requestSimpleUsingModule
	: requestSimpleUsingHttp;

export default requestSimple;
