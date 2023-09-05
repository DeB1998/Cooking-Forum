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

import {OtpSender} from "./authentication/otp/OptSender";

/**
 * Interface describing the configuration that can be used to customize some aspects of the
 * application.
 */
export interface ApplicationConfiguration {
    /**
     * Port on which the HTTP server will listen for incoming requests.
     */
    serverPort: string;

    /**
     * Host that runs the DBMS. If not specified, it defaults to localhost.
     */
    databaseHost: string | undefined;

    /**
     * Port, on the host that runs the DBMS, where the DMMS will listen for incoming requests. If
     * not specified, it defaults to 5432.
     */
    databasePort: number | undefined;

    /**
     * Name of the database the application will interact with.
     */
    databaseName: string;

    /**
     * Name of the user that will be used to interact with the database. If not specified, the
     * default PostgreSQL user will be used.
     */
    databaseUser: string | undefined;

    /**
     * Password of the user that will be used to interact with the database. If not specified, the
     * empty password will be used.
     */
    databasePassword: string | undefined;

    /**
     * Number of iterations performed by the algorithm that generates the salt when encoding the
     * passwords.
     */
    passwordSaltRounds: number;

    /**
     * Secret key that will be used to sign JWTs.
     */
    jwtSecret: string;

    /**
     * Time, in seconds, after which a JWT toke is considered expired.
     */
    sessionDuration: number;

    /**
     * String identifying the issuer of the JWTs. If not specified, no issuer is added to the JWTs.
     */
    jwtIssuer: string | undefined;

    /**
     * Object that is responsible for sending the generated OTP to the user in case they have
     * enabled the two-factor authentication.
     */
    otpSender: OtpSender;

    /**
     * Number of seconds after which an OTP is considered expired.
     */
    otpDuration: number;
}
