import jwt from "jsonwebtoken";
import {JwtSessionData} from "./JwtSessionData";

export class JwtManager {

    private secretKey: string;


    constructor(secretKey: string) {
        this.secretKey = secretKey;
    }

    public createJwt(payload: JwtSessionData) {
        return jwt.sign(payload, this.secretKey, {
            expiresIn: 5 * 60,
            issuer: "https://cooking-forum"
        })
    }
}
