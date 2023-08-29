import {Logger} from "../../utils/Logger";

export class OtpSender {
    private static readonly LOGGER = Logger.createLogger();

    public async sendOtp(otp: string) {
        OtpSender.LOGGER.info(`Generated OTP ${otp}`);
    }
}
