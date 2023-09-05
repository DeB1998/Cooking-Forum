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

// noinspection FallThroughInSwitchStatementJS

import dotenv from "dotenv";
import process from "node:process";
import {Application} from "./Application";
import {ApplicationConfiguration} from "./ApplicationConfiguration";
import {OtpSender} from "./authentication/otp/OptSender";
import {Logger} from "./utils/Logger";

/**
 * Simple OTP sender that prints the generated OTP on the console.
 */
class ConsoleOtpSender implements OtpSender {
    /**
     * Logger that will be used to log the OTP.
     */
    private static readonly LOGGER = Logger.createLogger();

    /**
     * Prints the specified OTP to the console.
     *
     * @param otp The OTP to print.
     */
    public async sendOtp(otp: string): Promise<void> {
        ConsoleOtpSender.LOGGER.info(`Generated OTP ${otp}`);
    }
}

/**
 * Utility function that converts a string into an integer number. If `valueToParse` is not a valid
 * integer number, if it is `undefined` or if it is an empty string, then this function will cause
 * the application to terminate.
 *
 * @param valueToParse Value to convert into an integer number.
 * @param missingErrorMessage Error message to print in case the value to convert is empty or
 *     `undefined`.
 * @param invalidNumberErrorMessage Error message if the value to convert is not a valid integer
 *     number.
 */
function parseAsInt(
    valueToParse: string | undefined,
    missingErrorMessage: string,
    invalidNumberErrorMessage: string
): number {
    if (valueToParse === undefined || valueToParse.length === 0) {
        logger.error(missingErrorMessage);
        process.exit(1);
    }
    const value = parseInt(valueToParse);
    if (isNaN(value)) {
        logger.error(invalidNumberErrorMessage);
        process.exit(1);
    }
    return value;
}

// Load the configuration from the .env file and/or from environment variables
const result = dotenv.config();
if (result.error !== undefined) {
    throw result.error;
}
// Create the logger to log information
const logger = Logger.createLogger();

// Check the correctness of the server port configuration
const serverPort = process.env["SERVER_PORT"];
if (serverPort === undefined || serverPort.length === 0) {
    logger.error("The server port must be provided as a non-empty environment variable");
    process.exit(1);
}
// Check the correctness of the database name configuration
const databaseName = process.env["DATABASE_NAME"];
if (databaseName === undefined || databaseName.length === 0) {
    logger.error("The database name must be provided as a non-empty environment variable");
    process.exit(1);
}
// Check the correctness of the database port configuration
let databasePort;
const databasePortToParse = process.env["DATABASE_PORT"];
if (databasePortToParse !== undefined) {
    databasePort = parseAsInt(
        databasePortToParse,
        "The database port must be provided as a non-empty environment variable",
        "The database port is not a valid number"
    );
    if (databasePort <= 0 || databasePort >= 65_535) {
        logger.error("The database port is not a valid port number");
        process.exit(1);
    }
} else {
    databasePort = undefined;
}
// Check the correctness of the salt generation algorithm iterations count configuration
const passwordSaltRounds = parseAsInt(
    process.env["PASSWORD_SALT_ROUNDS"],
    "The password salt rounds count port must be provided as a non-empty environment variable",
    "The password salt rounds count is not a valid number"
);
if (passwordSaltRounds <= 0) {
    logger.error("The password salt rounds count  must not be negative");
    process.exit(1);
}
// Check the correctness of the JWT signing secret key configuration
const jwtSecret = process.env["JWT_SECRET"];
if (jwtSecret === undefined || jwtSecret.length === 0) {
    logger.error("The JWT secret key must be provided as a non-empty environment variable");
    process.exit(1);
}
// Check the correctness of the user's session duration configuration
const sessionDuration = parseAsInt(
    process.env["SESSION_DURATION"],
    "The session duration must be provided as a non-empty environment variable",
    "The session duration is not a valid number"
);
if (sessionDuration <= 0) {
    logger.error("The session duration must not be negative");
    process.exit(1);
}
// Check the correctness of the OTP duration configuration
const otpDuration = parseAsInt(
    process.env["OTP_DURATION"],
    "The OTP duration must be provided as a non-empty environment variable",
    "The OTP duration is not a valid number"
);
if (otpDuration <= 0) {
    logger.error("The OTP duration must not be negative");
    process.exit(1);
}

// Create the application configuration
const applicationConfiguration: ApplicationConfiguration = {
    serverPort,
    databaseHost: process.env["DATABASE_HOST"],
    databasePort,
    databaseName,
    databaseUser: process.env["DATABASE_USER"],
    databasePassword: process.env["DATABASE_PASSWORD"],
    passwordSaltRounds,
    jwtSecret,
    sessionDuration,
    jwtIssuer: process.env["JWT_ISSUER"],
    otpSender: new ConsoleOtpSender(),
    otpDuration
};

// Create and start the application
const application = new Application(applicationConfiguration);
application.listen();

// Terminate the server on SIGUSR2, SIGQUIT and SIGTERM
process.once("SIGUSR2", () => {
    logger.info("Requested server to shut down");
    application.close();
});
process.once("SIGQUIT", () => {
    logger.info("Requested server to shut down");
    application.close();
});
process.once("SIGTERM", () => {
    logger.info("Requested server to shut down");
    application.close();
});
