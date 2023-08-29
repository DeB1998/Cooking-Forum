export class InvalidEndpointError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidEndpointError.prototype);
        this.name = "InvalidEndpointError";
    }
}
