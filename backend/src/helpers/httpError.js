export class HttpError extends Error {
    constructor(status, message, extra = {}) {
        super(message);
        this.status = status;
        this.expose = status < 500;
        Object.assign(this, extra);
    }
}
