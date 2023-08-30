export interface NewOtp {
    otp: string;
}

export interface Otp extends NewOtp {
    id: number;
    date: Date
}
