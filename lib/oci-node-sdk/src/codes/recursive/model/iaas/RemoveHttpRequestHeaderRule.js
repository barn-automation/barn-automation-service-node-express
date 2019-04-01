/**
* An object that represents the action of removing a header from a request. This rule applies only to HTTP listeners.
* @param {string} action Required value: REMOVE_HTTP_REQUEST_HEADER See {@link Rule} for more information.
* @param {string} header Minimum: 1 Maximum: 256 A header name that conforms to RFC 7230. Example: example_header_name
* @class RemoveHttpRequestHeaderRule
*/
class RemoveHttpRequestHeaderRule {
	constructor(action, header){
		this.action = action;
		this.header = header;
	}
}

module.exports = RemoveHttpRequestHeaderRule;