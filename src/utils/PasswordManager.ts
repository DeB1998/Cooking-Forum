import Bcrypt from "bcrypt";

export class PasswordManager {
    private readonly saltRounds: number;

    constructor(saltRounds: number) {
        this.saltRounds = saltRounds;
    }

    public async encodePassword(password: string) {
        return Bcrypt.hash(password, this.saltRounds);
    }
}
