export class InvalidRequestError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidRequestError.prototype);
        this.name = "InvalidRequestError";
    }
}
