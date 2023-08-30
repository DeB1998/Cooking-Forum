import {NextFunction, Request, Response} from "express-serve-static-core";
import {StatusCodes} from "http-status-codes";
import {Schema, Validator} from "jsonschema";
import passport from "passport";
import {AuthenticationError} from "../authentication/AuthenticationError";
import {JwtManager} from "../authentication/jwt/JwtManager";
import {JwtSessionData} from "../authentication/jwt/JwtSessionData";
import {OtpManager} from "../authentication/otp/OtpManager";
import {User} from "../entity/User";
import {OtpRepository} from "../repository/OtpRepository";
import {TwoFactorAuthRequest} from "./request/TwoFactorAuthRequest";

import {LoginResponse} from "./response/LoginResponse";

export class LoginController {
    private readonly jwtManager: JwtManager;
    private readonly otpManager: OtpManager;
    private readonly otpRepository: OtpRepository;
    private otpDuration: number;

    constructor(
        jwtManager: JwtManager,
        otpManager: OtpManager,
        otpRepository: OtpRepository,
        otpDuration: number
    ) {
        this.jwtManager = jwtManager;
        this.otpManager = otpManager;
        this.otpRepository = otpRepository;
        this.otpDuration = otpDuration;
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
            const otp = await this.otpManager.generateOtp();
            const insertedOtp = await this.otpRepository.insertOtp({otp, userId: user.id});
            if (insertedOtp === null) {
                next(new AuthenticationError("Unable to generate the OTP"));
            } else {
                sessionData.otpId = insertedOtp.id;
            }
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
            "otpId" in request.auth &&
            "userId" in request.auth
        ) {
            const sessionData = request.auth as JwtSessionData;
            const otpId = sessionData.otpId || -1;
            const referenceOtp = await this.otpRepository.getOtpById(otpId);
            if (referenceOtp !== null) {
                const expirationDate = referenceOtp.date;
                expirationDate.setUTCSeconds(expirationDate.getUTCSeconds() + this.otpDuration);
                if (
                    LoginController.dateAsUtc(expirationDate) > Date.now() &&
                    (await this.otpManager.verifyOtp(request.body.otp, referenceOtp.otp))
                ) {
                    delete sessionData.otpId;
                    if (await this.otpRepository.deleteOtpById(otpId)) {
                        const responseBody: LoginResponse = {
                            error: false,
                            jwt: this.jwtManager.createJwt({userId: sessionData.userId}),
                            requiresTwoFactorAuthentication: false
                        };
                        response.status(StatusCodes.OK).send(responseBody);
                        return;
                    }
                }
            }
        }
        next(new AuthenticationError("Wrong OTP"));
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

    private static dateAsUtc(date: Date) {
        return Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        );
    }
}
