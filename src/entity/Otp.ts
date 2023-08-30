export interface NewOtp {
    userId: number;
    otp: string;
}

export interface Otp extends NewOtp {
    id: number;
    date: Date
}
