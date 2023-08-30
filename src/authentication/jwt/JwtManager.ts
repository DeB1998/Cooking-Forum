import jwt from "jsonwebtoken";
import {JwtSessionData} from "./JwtSessionData";

export class JwtManager {
    public static readonly JWT_ISSUER = "https://cooking-forum";
    private secretKey: string;
    private sessionDuration: number;

    constructor(secretKey: string, sessionDuration: number) {
        this.secretKey = secretKey;
        this.sessionDuration = sessionDuration;
    }

    public createJwt(payload: JwtSessionData) {
        return jwt.sign(payload, this.secretKey, {
            expiresIn: this.sessionDuration,
            issuer: JwtManager.JWT_ISSUER
        });
    }
}
