export interface NewUser {
    name: string;
    surname: string;
    email: string;
    twoFactorAuthentication: boolean;
}

export interface User extends NewUser {
    id: number;
}
