export interface OtpSender {
    sendOtp(otp: string): Promise<void>;
}
