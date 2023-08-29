import * as crypto from "crypto";
import {PasswordManager} from "../basic/PasswordManager";
import {OtpSender} from "./OptSender";

export class OtpManager {
    private readonly passwordManager: PasswordManager;
    private readonly otpSender: OtpSender;

    constructor(passwordManager: PasswordManager, otpSender: OtpSender) {
        this.passwordManager = passwordManager;
        this.otpSender = otpSender;
    }

    public async generateOtp() {
        const otp = crypto.randomInt(0, 1_000_000);
        const otpString = `${otp}`;

        await this.otpSender.sendOtp(otpString);

        return this.passwordManager.encodePassword(otpString);
    }

    public async verifyOtp(otp: string, referenceOtp: string) {
        return this.passwordManager.verifyPassword(otp, referenceOtp);
    }
}
