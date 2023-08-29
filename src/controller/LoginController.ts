import {NextFunction, Request, Response} from "express-serve-static-core";
import {StatusCodes} from "http-status-codes";
import {JwtManager} from "../authentication/jwt/JwtManager";
import {User} from "../entity/User";

import {LoginResponse} from "./response/LoginResponse";

export class LoginController {
    private readonly jwtManager: JwtManager;

    constructor(jwtManager: JwtManager) {
        this.jwtManager = jwtManager;
    }

    public createJwt(request: Request, response: Response, next: NextFunction) {
        const user = request.user as User;
        const responseBody: LoginResponse = {
            error: false,
            jwt: this.jwtManager.createJwt({userId: user.id}),
            requiresTwoFactorAuthentication: user.twoFactorAuthentication
        };
        // TODO: generate otp
        response.status(
            user.twoFactorAuthentication ? StatusCodes.MOVED_TEMPORARILY : StatusCodes.OK
        );
        response.send(responseBody);
    }
}
