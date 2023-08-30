import {OtpSender} from "../../src/authentication/otp/OptSender";

export class TestOtpSender implements OtpSender {
    private otp: string;

    constructor() {
        this.otp = "";
    }

    public getOtp() {
        return this.otp;
    }

    public async sendOtp(otp: string) {
        this.otp = otp;
    }
}
