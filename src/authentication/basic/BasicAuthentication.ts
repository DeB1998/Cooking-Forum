/***************************************************************************************************
 *
 * This file is part of the Cooking Forum web application created by Alessio De Biasi.
 *
 * The Cooking Forum web application is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * The Cooking Forum web application is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with the Cooking Forum
 * web application. If not, see <http://www.gnu.org/licenses/>.
 *
 * Copyright © Alessio De Biasi, 2023.
 *
 **************************************************************************************************/

import {User} from "../../entity/User";
import {UserRepository} from "../../repository/UserRepository";
import {AuthenticationError} from "../AuthenticationError";

/**
 * Class performing the authentication of the user when the credentials are specified using the
 * HTTP basic authentication scheme.
 */
export class BasicAuthentication {
    /**
     * Repository used to access the database and authenticate the user.
     */
    private readonly userRepository: UserRepository;

    /**
     * Creates a new object that authenticates the user using the HTTP basic authentication scheme.
     * @param userRepository Repository that will be used to authenticate the user using
     *     information stored on the database.
     */
    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Authenticates the user using the provided email and password.
     *
     * @param email The email of the user.
     * @param password The unencoded password of the user.
     * @param done A callback that will be invoked with:
     *  - `error === null` and `user !== undefined` if the user is successfully authenticated. In
     *     this case,
     *     `user` will contain the user's information;
     *  - `error !== null` if the user is not authenticated. In this case, `error` will be the
     *     cause of the authentication error (typically, an exception), while the value of `user`
     *     is unspecified.
     */
    public authenticate(
        email: string,
        password: string,
        done: (error: any, user?: User) => void
    ): void {
        // Check the arguments
        if (email.length === 0 || password.length === 0) {
            done(new AuthenticationError("Invalid username or password"));
        }

        // Access the database to retrieve the user's information
        this.userRepository
            .authenticateUser(email, password)
            .then((user) => BasicAuthentication.onUserAuthenticated(user, done))
            .catch((error) => BasicAuthentication.onAuthenticationError(error, done));
    }

    /**
     * Utility method that will be called if the user is not authenticated.
     *
     * @param error Error describing why the user is not authenticated.
     * @param done Callback that will be invoked with the error.
     */
    private static onAuthenticationError(
        error: any,
        done: (error: any, user?: User) => void
    ): void {
        done(error);
    }

    /**
     * Utility method that will be called if the user is successfully authenticated.
     *
     * @param user User's information.
     * @param done Callback that will be invoked with the user's information.
     */
    private static onUserAuthenticated(
        user: User | null,
        done: (error: any, user?: User) => void
    ): void {
        if (user === null) {
            done(new AuthenticationError("Invalid username or password"));
        } else {
            done(null, user);
        }
    }
}
