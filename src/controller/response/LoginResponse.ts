import {SuccessfulResponse} from "./SuccessfulResponse";

export interface LoginResponse extends SuccessfulResponse {
    jwt: string;
    requiresTwoFactorAuthentication: boolean;
}
