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

import {NewUser, User} from "../entity/User";
import {DatabaseConnection} from "../utils/DatabaseConnection";
import {InvalidValueError} from "../utils/InvalidValueError";
import {Logger} from "../utils/Logger";
import {PasswordManager} from "../authentication/basic/PasswordManager";

/**
 * Class allowing to access the table on the database storing users' information.
 */
export class UserRepository {
    /**
     * Logger used to log information.
     */
    private static readonly LOGGER = Logger.createLogger();

    /**
     * Length, in characters, of the encoded passwords.
     */
    private static readonly PASSWORD_LENGTH = 60;

    /**
     * Object holding the connection to the database.
     */
    private readonly databaseConnection: DatabaseConnection;
    /**
     * Object that encodes and verifies passwords.
     */
    private readonly passwordManager: PasswordManager;

    /**
     * Creates a new object allowing to interact with the database and manipulate or extract users'
     * information.
     *
     * @param databaseConnection Object holding the connection to the database.
     * @param passwordManager Object that encodes and verifies passwords.
     */
    constructor(databaseConnection: DatabaseConnection, passwordManager: PasswordManager) {
        this.databaseConnection = databaseConnection;
        this.passwordManager = passwordManager;
    }

    /**
     * Inserts a new user in the database. This method takes care of encoding the password of the
     * user before storing it on the database, but no additional checks are performed on the
     * specified `user` object.
     *
     * @param user Object holding the user's information that will be stored on the database.
     * @param password Unencoded password of the user.
     * @returns A promise that resolves with `true` if the user is correctly inserted, or `false`
     *     if the user is already present. If any other error occurs, the returned promise will be
     *     rejected.
     */
    public async insertUser(user: NewUser, password: string): Promise<boolean> {
        // Retrieve a connection from the pool
        const client = await this.databaseConnection.getClient();

        try {
            // Encode the password
            const encodedPassword = await this.passwordManager.encodePassword(password);
            if (encodedPassword.length !== UserRepository.PASSWORD_LENGTH) {
                UserRepository.LOGGER.fatal(
                    `The encoded password has length ${encodedPassword.length} instead of ${UserRepository.PASSWORD_LENGTH}`
                );
                throw new InvalidValueError("Password error");
            }
            // Create the query.
            // If the user is already present in the table, the 'ON CONFLICT DO NOTHING' clause
            // ensures that the query is executed successfully, but no information is modified.
            const query = `INSERT INTO users(name, surname, email, password, two_factor_authentication)
                           VALUES ($1, $2, $3, $4, $5)
                           ON CONFLICT DO NOTHING`;
            // Insert the user
            const result = await client.query(query, [
                user.name,
                user.surname,
                user.email,
                encodedPassword,
                user.twoFactorAuthentication
            ]);
            return result.rowCount !== 0;
        } finally {
            // Release the connection
            client.release();
        }
    }

    /**
     * Authenticates the user by checking if a user with the specified email is registered, and if
     * the specified password matches the stored one.
     *
     * @param email Email of the user that wants to authenticate.
     * @param password Unencoded password of the user that wants to authenticate.
     * @returns A promise that is resolved with the user's information if the user is successfully
     *     authenticated, or with `null` if the user is not authenticated. If any error occurs
     *     while retrieving the information from the database, or while verifying the password, the
     *     returned promise will be rejected.
     */
    public async authenticateUser(email: string, password: string): Promise<User | null> {
        // Retrieve a connection from the pool
        const client = await this.databaseConnection.getClient();

        try {
            // Select the user
            const userSelectionQuery = `SELECT id,
                                               name,
                                               surname,
                                               email,
                                               password,
                                               two_factor_authentication AS "twoFactorAuthentication"
                                        FROM users
                                        WHERE email = $1
                                        LIMIT 1`;
            const result = await client.query(userSelectionQuery, [email]);
            // Extract the result
            if (result.rowCount === 1) {
                const row = result.rows[0] as User & {password: string};
                // Check the password
                if (await this.passwordManager.verifyPassword(password, row.password)) {
                    return {
                        id: row.id,
                        name: row.name,
                        surname: row.surname,
                        email: row.email,
                        twoFactorAuthentication: row.twoFactorAuthentication
                    };
                }
            }
            return null;
        } finally {
            // Release the connection
            client.release();
        }
    }
}
