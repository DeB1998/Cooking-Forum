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

import {NextFunction, Request, Response} from "express-serve-static-core";
import {StatusCodes} from "http-status-codes";
import {Schema, Validator} from "jsonschema";
import * as EmailValidator from "email-validator";
import {UserRepository} from "../repository/UserRepository";
import {InvalidRequestError} from "./InvalidRequestError";
import {UserCreationRequest} from "./request/UserCreationRequest";
import {UserCreationResponse} from "./response/UserCreationResponse";

/**
 * Express middleware taking care of registering a new user.
 */
export class UserController {
    /**
     * Maximum allowed length, in characters, of the user's name.
     */
    private static readonly NAME_MAX_LENGTH = 32;

    /**
     * Maximum allowed length, in characters, of the user's surname.
     */
    private static readonly SURNAME_MAX_LENGTH = 32;

    /**
     * Regular expression that will be used to check the password strength.
     */
    private static readonly PASSWORD_REGEX =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{8,32}$/;

    /**
     * Object that allows to interact with the users' information stored on the database.
     */
    private readonly userRepository: UserRepository;

    /**
     * Creates a new Express middleware taking care of registering a new user.
     *
     * @param userRepository Object that allows to interact with the users' information stored on
     *     the database.
     */
    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Middleware that checks the structural correctness of the JSON object stored in the body of
     * the HTTP request.
     *
     * @param request HTTP request sent by the client.
     * @param response Object allowing to customize the HTTP response that will be sent back to the
     *     client.
     * @param next Function that invokes the next middleware in the chain. The next middleware in
     *     invoked only if the JSON object in the body of the HTTP request contains a valid JSON
     *     object having only all the required fields, which must have the correct type. Otherwise,
     *     the error-handling middleware is invoked.
     */
    public async checkUserCreationRequest(
        request: Request,
        response: Response,
        next: NextFunction
    ) {
        // Create the JSON schema that will be used to validate the HTTP request body
        const schema: Schema = {
            type: "object",
            properties: {
                name: {type: "string"},
                surname: {type: "string"},
                email: {type: "string"},
                password: {type: "string"},
                twoFactorAuthentication: {type: "boolean"}
            },
            required: ["name", "surname", "email", "password", "twoFactorAuthentication"],
            additionalProperties: false
        };
        // Validate the body against a JSON schema
        const requestBody = request.body;
        const validator = new Validator();
        const result = validator.validate(requestBody, schema, {required: true});
        if (result.valid) {
            // Call the next middleware since the body is correct
            next();
        } else {
            // Call the error-handling middleware
            next(result.errors[0]);
        }
    }

    /**
     * Express middleware that registers a new user. This method will assume the HTTP request body
     * to contain a structurally correct JSON object, and will perform additional checks on the
     * values of the fields of that object, in particular:
     * - The name must not be empty, and must be at most 32-characters long;
     * - The surname must not be empty, and must be at most 32-characters long;
     * - The email must be a syntactically valid email;
     * - The password must contain at least an uppercase letter, a lowercase letter, a digit and
     * one of the symbols `@`, `$`, `!`, `%`, `*`, `?` or `&`.
     *
     * @param request HTTP request the application is serving.
     * @param response Object that allows to customize the
     * @param next Function that invokes the next middleware in the chain. Since this middleware is
     *     meant to be used as the last middleware of the chain, this function will only be used to
     *     invoke the error-handling middleware.
     */
    public async createUser(
        request: Request<any, UserCreationResponse, UserCreationRequest>,
        response: Response<UserCreationResponse>,
        next: NextFunction
    ) {
        const userToAdd = request.body;
        // Check the correctness of the values
        if (
            userToAdd.name.length === 0 ||
            userToAdd.name.length >= UserController.NAME_MAX_LENGTH
        ) {
            next(
                new InvalidRequestError("The name must be non-empty and at most 32 characters long")
            );
        } else if (
            userToAdd.surname.length === 0 ||
            userToAdd.surname.length >= UserController.SURNAME_MAX_LENGTH
        ) {
            next(
                new InvalidRequestError(
                    "The surname must be non-empty and at most 32 characters long"
                )
            );
        } else if (!EmailValidator.validate(userToAdd.email)) {
            next(new InvalidRequestError("The provided email is not valid"));
        } else if (!userToAdd.password.match(UserController.PASSWORD_REGEX)) {
            next(
                new InvalidRequestError(
                    "The password must be from 8 to 32 characters-long, and it must contain at least one uppercase letter, one lowercase letter, one digit and one of the symbols '@$!%*?&'"
                )
            );
        } else {
            // Insert the user in the database
            const inserted = await this.userRepository.insertUser(userToAdd, userToAdd.password);
            if (inserted) {
                // The user has been successfully registered
                response.status(StatusCodes.OK).send({error: false, created: true});
            } else {
                // The user is already registered
                next(new InvalidRequestError("The e-mail address has already been used"));
            }
        }
    }
}
