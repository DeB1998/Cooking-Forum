import {UnauthorizedError} from "express-jwt";
import {NextFunction, Response} from "express-serve-static-core";
import {StatusCodes} from "http-status-codes";
import {ValidationError} from "jsonschema";
import {AuthenticationError} from "../authentication/AuthenticationError";
import {InvalidEndpointError} from "../utils/InvalidEndpointError";
import {Logger} from "../utils/Logger";
import {InvalidRequestError} from "./InvalidRequestError";
import {ErrorResponse} from "./response/ErrorResponse";

export class ErrorController {
    private static readonly LOGGER = Logger.createLogger();

    public handleErrors(
        error: any,
        request: any,
        response: Response<ErrorResponse>,
        next: NextFunction
    ) {
        const errorResponse: ErrorResponse = {error: true, message: ""};
        if (error instanceof Error || error instanceof ValidationError) {
            if (error instanceof AuthenticationError) {
                response.status(StatusCodes.FORBIDDEN);
            } else if (error instanceof InvalidEndpointError) {
                response.status(StatusCodes.NOT_FOUND);
            } else if (
                error instanceof ValidationError ||
                error instanceof InvalidRequestError ||
                error instanceof UnauthorizedError
            ) {
                response.status(StatusCodes.BAD_REQUEST);
            } else {
                response.status(StatusCodes.INTERNAL_SERVER_ERROR);
            }
            errorResponse.message = error.message;
        } else {
            response.status(StatusCodes.INTERNAL_SERVER_ERROR);
            errorResponse.message = "An error occurred while serving the request";
        }
        ErrorController.LOGGER.debug(error);

        response.send(errorResponse);
    }
}
