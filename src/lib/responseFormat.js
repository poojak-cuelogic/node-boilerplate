class ResponseFormat {
    constructor() {
        this.statusCode = {
            SUCCESS: 200,
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            PRECONDITION_FAILED: 412, 
            NOT_FOUND: 404,
            INTERNAL_SERVER_ERROR: 500,
            SERVICE_UNAVAILABLE: 503,
            UNPROCESSABLE_ENTITY: 422
        };
    }

    getResponseObject(type, code, message, data) {
        let resObject = {
            status: type,
            status_code: code,
            message: message 
        };
        if(data) {
            resObject.data=data;
        }
        return resObject;
    }
    
}

export default new ResponseFormat();