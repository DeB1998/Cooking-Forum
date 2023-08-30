// noinspection FallThroughInSwitchStatementJS

import dotenv from "dotenv";
import process from "node:process";
import {Application} from "./Application";
import {ApplicationConfiguration} from "./ApplicationConfiguration";
import {OtpSender} from "./authentication/otp/OptSender";
import {Logger} from "./utils/Logger";

class ConsoleOtpSender implements OtpSender {
    private static readonly LOGGER = Logger.createLogger();

    public async sendOtp(otp: string) {
        ConsoleOtpSender.LOGGER.info(`Generated OTP ${otp}`);
    }
}

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

const result = dotenv.config();
if (result.error !== undefined) {
    throw result.error;
}
const serverPort = process.env["SERVER_PORT"];
const databasePortToParse = process.env["DATABASE_PORT"];
const databaseName = process.env["DATABASE_NAME"];
const passwordSaltRoundsToParse = process.env["PASSWORD_SALT_ROUNDS"];
const jwtSecret = process.env["JWT_SECRET"];

const logger = Logger.createLogger();
if (serverPort === undefined || serverPort.length === 0) {
    logger.error("The server port must be provided as a non-empty environment variable");
    process.exit(1);
}
if (databaseName === undefined || databaseName.length === 0) {
    logger.error("The database name must be provided as a non-empty environment variable");
    process.exit(1);
}
let databasePort;
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
const passwordSaltRounds = parseAsInt(
    passwordSaltRoundsToParse,
    "The password salt rounds count port must be provided as a non-empty environment variable",
    "The password salt rounds count is not a valid number"
);
if (passwordSaltRounds <= 0) {
    logger.error("The password salt rounds count  must not be negative");
    process.exit(1);
}
if (jwtSecret === undefined || jwtSecret.length === 0) {
    logger.error("The JWT secret key must be provided as a non-empty environment variable");
    process.exit(1);
}

const sessionDuration = parseAsInt(
    process.env["SESSION_DURATION"],
    "The session duration must be provided as a non-empty environment variable",
    "The session duration is not a valid number"
);
if (sessionDuration <= 0) {
    logger.error("The session duration must not be negative");
    process.exit(1);
}
const otpDuration = parseAsInt(
    process.env["OTP_DURATION"],
    "The OTP duration must be provided as a non-empty environment variable",
    "The OTP duration is not a valid number"
);
if (otpDuration <= 0) {
    logger.error("The OTP duration must not be negative");
    process.exit(1);
}

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
    otpSender: new ConsoleOtpSender(),
    otpDuration
};

// Create the application
const application = new Application(applicationConfiguration);
application.listen();

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
