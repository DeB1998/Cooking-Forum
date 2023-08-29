import {NextFunction, Response} from "express-serve-static-core";
import {ValidationError} from "jsonschema";
import {Logger} from "../utils/Logger";
import {ErrorResponse} from "./response/ErrorResponse";

export class ErrorController {
    private static readonly LOGGER = Logger.createLogger();

    public handleErrors(
        error: any,
        request: any,
        response: Response<ErrorResponse, any>,
        next: NextFunction
    ) {
        const errorResponse: ErrorResponse = {error: true, message: ""};
        if (error instanceof Error || error instanceof ValidationError) {
            response.status(400);
            errorResponse.message = error.message;
        } else {
            response.status(500);
            errorResponse.message = "An error occurred while serving the request";
        }
        ErrorController.LOGGER.error(error);

        response.send(errorResponse);
    }
}
