import * as ResEdit from 'resedit';
type EmitResParameter = Pick<ResEdit.NtExecutableResource, 'entries'>;
export default EmitResParameter;
