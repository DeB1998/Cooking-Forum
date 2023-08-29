export class InvalidValueError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidValueError.prototype);
        this.name = "InvalidValueError";
    }
}
