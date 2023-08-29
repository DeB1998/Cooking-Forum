import {User} from "../../entity/User";
import {UserRepository} from "../../repository/UserRepository";
import {AuthenticationError} from "../AuthenticationError";

export class BasicAuthentication {
    private readonly userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    private onError(error: any, done: (error: any, user?: User) => void) {
        done(error);
    }

    private onUser(user: User | null, done: (error: any, user?: User) => void) {
        if (user === null) {
            done(new AuthenticationError("Invalid username or password"));
        } else {
            done(null, user);
        }
    }

    public authenticate(email: string, password: string, done: (error: any, user?: User) => void) {
        if (email.length === 0 || password.length === 0) {
            done(new AuthenticationError("Invalid username or password"));
        }

        this.userRepository
            .logIn(email, password)
            .then((user) => this.onUser(user, done))
            .catch((error) => this.onError(error, done));
    }
}
