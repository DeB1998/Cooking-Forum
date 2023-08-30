import {OtpSender} from "./authentication/otp/OptSender";

export interface ApplicationConfiguration {
    serverPort: string;
    databaseHost: string | undefined;
    databasePort: number | undefined;
    databaseName: string;
    databaseUser: string | undefined;
    databasePassword: string | undefined;
    passwordSaltRounds: number;
    jwtSecret: string;
    otpSender: OtpSender;
}
