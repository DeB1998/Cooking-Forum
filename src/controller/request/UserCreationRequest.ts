export interface UserCreationRequest {
    name: string;
    surname: string;
    email: string;
    password: string;
    twoFactorAuthentication: boolean;
}
