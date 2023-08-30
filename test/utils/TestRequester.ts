import chai from "chai";
import dotenv from "dotenv";
import process from "node:process";
import {Application} from "../../src/Application";
import {TestOtpSender} from "./TestOtpSender";

export class TestRequester {
    public static createRequester(otpSender: TestOtpSender) {
        const result = dotenv.config();
        if (result.error !== undefined) {
            throw result.error;
        }
        const jwtSecret = process.env["JWT_SECRET"] || "";
        const application = new Application({
            serverPort: "5000",
            databaseHost: process.env["DATABASE_HOST"] || "127.0.0.1",
            databasePort: parseInt(process.env["DATABASE_PORT"] || "5432"),
            databaseName: process.env["DATABASE_NAME"] || "",
            databaseUser: process.env["DATABASE_USER"] || "",
            databasePassword: process.env["DATABASE_PASSWORD"] || "",
            passwordSaltRounds: 10,
            jwtSecret,
            sessionDuration: parseInt(process.env["SESSION_DURATION"] || "100"),
            otpSender,
            otpDuration: 1
        });
        return chai.request(application.getHttpServer()).keepOpen();
    }
}
