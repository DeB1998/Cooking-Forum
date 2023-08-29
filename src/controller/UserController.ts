import {NextFunction, Request, Response} from "express-serve-static-core";
import {Schema, Validator} from "jsonschema";
import * as EmailValidator from "email-validator";
import {UserRepository} from "../repository/UserRepository";
import {InvalidRequestError} from "./InvalidRequestError";
import {UserCreationRequest} from "./request/UserCreationRequest";
import {UserCreationResponse} from "./response/UserCreationResponse";

export class UserController {
    private static readonly PASSWORD_REGEX =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{8,32}$/;

    private readonly userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    public async checkUserCreationRequest(
        request: Request,
        response: Response,
        next: NextFunction
    ) {
        const requestBody = request.body;
        const schema: Schema = {
            type: "object",
            properties: {
                name: {type: "string"},
                surname: {type: "string"},
                email: {type: "string"},
                password: {type: "string"},
                twoFactorAuthentication: {type: "boolean"}
            },
            required: ["name", "surname", "email", "password", "twoFactorAuthentication"],
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

    public async createUser(
        request: Request<any, UserCreationResponse, UserCreationRequest>,
        response: Response<UserCreationResponse>,
        next: NextFunction
    ) {
        const userToAdd = request.body;
        // Check the correctness
        if (userToAdd.name.length === 0 || userToAdd.name.length >= 32) {
            next(
                new InvalidRequestError("The name must be non-empty and at most 32 characters long")
            );
        } else if (userToAdd.surname.length === 0 || userToAdd.surname.length >= 32) {
            next(
                new InvalidRequestError(
                    "The surname must be non-empty and at most 32 characters long"
                )
            );
        } else if (!EmailValidator.validate(userToAdd.email)) {
            next(new InvalidRequestError("The provided email is not valid"));
        } else if (!userToAdd.password.match(UserController.PASSWORD_REGEX)) {
            next(
                new InvalidRequestError(
                    "The password must be from 8 to 32 characters-long, and it must contain at least one uppercase letter, one lowercase letter, one digit and one special characters among '@$!%*?&'"
                )
            );
        } else {
            const inserted = await this.userRepository.insertUser(userToAdd, userToAdd.password);
            if (inserted) {
                response.status(200).send({error: false, created: true});
            } else {
                next(new InvalidRequestError("The e-mail address has already been used"));
            }
        }
    }
}
