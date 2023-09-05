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
import passport from "passport";
import {AuthenticationError} from "../authentication/AuthenticationError";
import {JwtManager} from "../authentication/jwt/JwtManager";
import {JwtSessionData} from "../authentication/jwt/JwtSessionData";
import {OtpManager} from "../authentication/otp/OtpManager";
import {User} from "../entity/User";
import {OtpRepository} from "../repository/OtpRepository";
import {TwoFactorAuthRequest} from "./request/TwoFactorAuthRequest";

import {LoginResponse} from "./response/LoginResponse";

/**
 * Express middleware responsible for authenticating the user when they try to log into the
 * application.
 */
export class LoginController {
    /**
     * Object that creates JWTs.
     */
    private readonly jwtManager: JwtManager;

    /**
     * Object that creates OTPs.
     */
    private readonly otpManager: OtpManager;

    /**
     * Object that allows storing and retrieving OTPs from the database.
     */
    private readonly otpRepository: OtpRepository;

    /**
     * Time, in seconds, after which an OTP is considered expired.
     */
    private readonly otpDuration: number;

    /**
     * Creates a new Express middleware responsible for authenticating the user.
     *
     * @param jwtManager Manager that allows creating JWTs.
     * @param otpManager Manager that allows creating and verifying OTPs.
     * @param otpRepository Object that allows storing and retrieving OTPs from the database.
     * @param otpDuration Time, in seconds, after which an OTP is considered expired.
     */
    constructor(
        jwtManager: JwtManager,
        otpManager: OtpManager,
        otpRepository: OtpRepository,
        otpDuration: number
    ) {
        this.jwtManager = jwtManager;
        this.otpManager = otpManager;
        this.otpRepository = otpRepository;
        this.otpDuration = otpDuration;
    }

    /**
     * Express middleware that invokes the _passport_ basic authentication strategy to verify the
     * credentials supplied by the user that wants to log into the application.
     *
     * @param request HTTP request sent by the client.
     * @param response Object allowing the customization of the HTTP response to send back to the
     *     client.
     * @param next Function that invokes the next middleware in the chain.
     */
    public async authenticate(request: Request, response: Response, next: NextFunction) {
        // Authenticate the user
        passport.authenticate("basic", {session: false}, (err: Error, user: User | boolean) => {
            // Check the authentication result
            if (err) {
                // An error occurred while authenticating the user
                next(err);
            } else if (user === false) {
                // The user is not authenticated
                next(new AuthenticationError("Missing credentials"));
            } else {
                // THe user is authenticated
                request.user = user;
                next();
            }
        })(request, response, next);
    }

    /**
     * Express middleware that creates the JWT holding the user's session information. This
     * middleware assumes that the user has already submitted the correct credentials, but they may
     * still need to perform the second step of the two-factor authentication.
     *
     * @param request HTTP request sent by the client.
     * @param response Object that allows to customize the HTTP response to send back to the
     *     client.
     * @param next Function that invokes the next middleware in the chain. Since this middleware is
     *     meant to be the last in the chain of middlewares, this function is invoked only to
     *     handle errors.
     */
    public async createJwt(request: Request, response: Response, next: NextFunction) {
        // Check if the two-factor authentication is enabled
        const user = request.user as User;
        const requiresTwoFactorAuthentication = user.twoFactorAuthentication;

        // Create the basic user's session information
        const sessionData: JwtSessionData = {userId: user.id};
        // Generate and send the OTP if the two-factor authentication is enabled
        if (requiresTwoFactorAuthentication) {
            // Generate an OTP
            const otp = await this.otpManager.generateOtp();
            // Store the OTP in the database
            const insertedOtp = await this.otpRepository.insertOtp({otp});
            if (insertedOtp === null) {
                next(new AuthenticationError("Unable to generate the OTP"));
            } else {
                // Insert the identifier of the OTP into the user's session
                sessionData.otpId = insertedOtp.id;
            }
        }
        // Send the response back to the user
        const responseBody: LoginResponse = {
            error: false,
            jwt: this.jwtManager.createJwt(sessionData),
            requiresTwoFactorAuthentication
        };
        response.status(
            requiresTwoFactorAuthentication ? StatusCodes.MOVED_TEMPORARILY : StatusCodes.OK
        );
        response.send(responseBody);
    }

    /**
     * Express middleware that checks the structural correctness of the value stored in the HTTP
     * request body sent by the client when the user wants to complete the second step of the
     * two-factor authentication.
     *
     * @param request HTTP request received by the application.
     * @param response Object allowing to customize the HTTP response to send back to the client.
     * @param next Function that invokes the next middleware in the chain.
     */
    public async checkTwoFactorAuthRequest(
        request: Request,
        response: Response,
        next: NextFunction
    ) {
        // Create the JSON schema that will be used to validate the HTTP request body
        const schema: Schema = {
            type: "object",
            properties: {
                otp: {type: "string"}
            },
            required: ["otp"],
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
     * Express middleware that verifies the correctness of the OTP provided by the client when the
     * user wants to perform the second step of the two-factor authentication.
     * This middleware assumes the structural correctness of the JSON object stored in the HTTP
     * request body.
     * This middleware will take care of validating the correctness of the JWT that is assumed to
     * be found in `request.auth`.
     *
     * @param request HTTP request sent by the client.
     * @param response Object that allows to customize the HTTP response to send back to the
     *     client.
     * @param next Function that allows to call the next middleware in the chain. Since this
     *     middleware is meant to be used as the last middleware of a chain, this function will be
     *     invoked only to handle errors.
     */
    public async verifyOtp(
        request: Request<any, TwoFactorAuthRequest>,
        response: Response,
        next: NextFunction
    ) {
        // Check the correctness of the JWT
        if (
            "auth" in request &&
            typeof request.auth === "object" &&
            request.auth !== null &&
            "otpId" in request.auth &&
            "userId" in request.auth
        ) {
            // Extract the identifier of the OTP from the session
            const sessionData = request.auth as JwtSessionData;
            const otpId = sessionData.otpId || -1;
            // Retrieve the OTP information from the database
            const referenceOtp = await this.otpRepository.getOtpById(otpId);
            if (referenceOtp !== null) {
                // Check if the OTP is expired
                const expirationDate = referenceOtp.creationDate;
                expirationDate.setUTCSeconds(expirationDate.getUTCSeconds() + this.otpDuration);
                if (
                    LoginController.dateAsUtc(expirationDate) > Date.now() &&
                    (await this.otpManager.verifyOtp(request.body.otp, referenceOtp.otp))
                ) {
                    // Remove the OTP identifier from the session
                    delete sessionData.otpId;
                    // Remove the OTP information from the database
                    if (await this.otpRepository.deleteOtpById(otpId)) {
                        // The user is now authenticated
                        const responseBody: LoginResponse = {
                            error: false,
                            jwt: this.jwtManager.createJwt({userId: sessionData.userId}),
                            requiresTwoFactorAuthentication: false
                        };
                        response.status(StatusCodes.OK).send(responseBody);
                        return;
                    }
                }
            }
        }
        // An error occurred in the authentication
        next(new AuthenticationError("Wrong OTP"));
    }

    /**
     * Utility method that interprets the specified date as a UTC date.
     * For instance, if `date` is `2023-01-01 10:00:00 UTC+2`, then this method will return the new
     * date `2023-01-01 10:00:00 UTC+0`.
     *
     * @param date Date to interpret not in the local timezone, but as if it is in UTC.
     */
    private static dateAsUtc(date: Date) {
        return Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        );
    }
}
