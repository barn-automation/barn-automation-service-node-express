/**
 * A class that contains properties necessary to perform GetVcn
 * @param {string} vcnId Minimum: 1 Maximum: 255 The OCID of the VCN.
 * @class GetVcnRequest
 */
class GetVcnRequest {

	constructor(vcnId){
		this._headers = {};
		this._pathParams = {};
		this._queryParams = {};
		this.body = '';
		this.vcnId = vcnId;
	}

	get headers(){
		return this._headers;
	}
	set headers(value){
		this._headers = value;
	}
	get queryParams(){
		return this._queryParams;
	}
	set queryParams(value){
		this._queryParams = value;
	}
	get pathParams(){
		this._pathParams['vcnId'] = this.vcnId;
		return this._pathParams;
	}
	set pathParams(value){
		this._pathParams = value;
	}
}
module.exports = GetVcnRequest;