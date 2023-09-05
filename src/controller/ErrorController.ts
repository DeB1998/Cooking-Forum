/***************************************************************************************************
 *
 * This file is part of the Cooking Forum web application created by Alessio De Biasi.
 *
 * The Cooking Forum web application is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * The Cooking Forum web application is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with the Cooking Forum
 * web application. If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright © Alessio De Biasi, 2023.
 *
 **************************************************************************************************/

import {UnauthorizedError} from "express-jwt";
import {NextFunction, Response} from "express-serve-static-core";
import {StatusCodes} from "http-status-codes";
import {ValidationError} from "jsonschema";
import {AuthenticationError} from "../authentication/AuthenticationError";
import {InvalidEndpointError} from "../utils/InvalidEndpointError";
import {Logger} from "../utils/Logger";
import {InvalidRequestError} from "./InvalidRequestError";
import {ErrorResponse} from "./response/ErrorResponse";

/**
 * Express middleware handling all the errors generated during an HTTP request is served. This
 * middleware will take care of giving back to the client an HTTP response describing the error.
 */
export class ErrorController {
    /**
     * Logger used to log debug information.
     */
    private static readonly LOGGER = Logger.createLogger();

    /**
     * Express middleware that handles all the errors generated when an HTTP request is served.
     *
     * @param error Error generated while the application was serving the HTTP request.
     * @param request HTTP request the application is serving.
     * @param response Object allowing to customize the HTTP response to send to the client.
     * @param next Function that allows to invoke the next middleware in the chain. Since this
     *     middleware is meant to be used as the last middleware in the chain, this value is not
     *     used.
     */
    public handleErrors(
        error: any,
        request: any,
        response: Response<ErrorResponse>,
        next: NextFunction
    ): void {
        // Create the object to place in the response
        const errorResponse: ErrorResponse = {error: true, message: ""};
        // Customize the response based on the error type
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

        // Send the response to the client
        response.send(errorResponse);
    }
}
