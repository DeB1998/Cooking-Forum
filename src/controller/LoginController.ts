import {NextFunction, Request, Response} from "express-serve-static-core";
import {StatusCodes} from "http-status-codes";
import {Schema, Validator} from "jsonschema";
import passport from "passport";
import {AuthenticationError} from "../authentication/AuthenticationError";
import {JwtManager} from "../authentication/jwt/JwtManager";
import {JwtSessionData} from "../authentication/jwt/JwtSessionData";
import {OtpManager} from "../authentication/otp/OtpManager";
import {User} from "../entity/User";
import {TwoFactorAuthRequest} from "./request/TwoFactorAuthRequest";

import {LoginResponse} from "./response/LoginResponse";

export class LoginController {
    private readonly jwtManager: JwtManager;
    private readonly otpManager: OtpManager;

    constructor(jwtManager: JwtManager, otpManager: OtpManager) {
        this.jwtManager = jwtManager;
        this.otpManager = otpManager;
    }

    public async authenticate(request: Request, response: Response, next: NextFunction) {
        passport.authenticate("basic", {session: false}, (err: Error, user: User | boolean) => {
            if (err) {
                next(err);
            } else if (user === false) {
                next(new AuthenticationError("Missing credentials"));
            } else {
                request.user = user;
                next();
            }
        })(request, response, next);
    }

    public async createJwt(request: Request, response: Response, next: NextFunction) {
        const user = request.user as User;
        const requiresTwoFactorAuthentication = user.twoFactorAuthentication;

        const sessionData: JwtSessionData = {userId: user.id};
        if (requiresTwoFactorAuthentication) {
            sessionData.otp = await this.otpManager.generateOtp();
        }
        const responseBody: LoginResponse = {
            error: false,
            jwt: this.jwtManager.createJwt(sessionData),
            requiresTwoFactorAuthentication
        };

        response.status(
            requiresTwoFactorAuthentication ? StatusCodes.MOVED_TEMPORARILY : StatusCodes.OK
        );
        response.send(responseBody);
    }

    public async verifyOtp(
        request: Request<any, TwoFactorAuthRequest>,
        response: Response,
        next: NextFunction
    ) {
        if (
            "auth" in request &&
            typeof request.auth === "object" &&
            request.auth !== null &&
            "otp" in request.auth &&
            "userId" in request.auth
        ) {
            const sessionData = request.auth as JwtSessionData;
            const referenceOtp = sessionData.otp || "";
            if (await this.otpManager.verifyOtp(request.body.otp, referenceOtp)) {
                delete sessionData.otp;
                const responseBody: LoginResponse = {
                    error: false,
                    jwt: this.jwtManager.createJwt({userId: sessionData.userId}),
                    requiresTwoFactorAuthentication: false
                };
                response.status(StatusCodes.OK).send(responseBody);
            } else {
                next(new AuthenticationError("Wrong OTP"));
            }
        } else {
            next(new AuthenticationError("Wrong OTP"));
        }
    }

    public async checkTwoFactorAuthRequest(
        request: Request,
        response: Response,
        next: NextFunction
    ) {
        const requestBody = request.body;
        const schema: Schema = {
            type: "object",
            properties: {
                otp: {type: "string"}
            },
            required: ["otp"],
            additionalProperties: false
        };
        const validator = new Validator();
        const result = validator.validate(requestBody, schema, {required: true});
        if (result.valid) {
            next();
        } else {
            next(result.errors[0]);
        }
    }
}
