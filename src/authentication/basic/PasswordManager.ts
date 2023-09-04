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

import Bcrypt from "bcrypt";

/**
 * Class allowing to encode and verify passwords using the bcrypt algorithm.
 */
export class PasswordManager {
    /**
     * Number of iterations performed by the algorithm that generates the salt.
     */
    private readonly saltRounds: number;

    /**
     * Creates a new object that encodes and verifies passwords.
     *
     * @param saltRounds Number of iterations that will be performed by the algorithm that
     *     generates the salt.
     */
    constructor(saltRounds: number) {
        this.saltRounds = saltRounds;
    }

    /**
     * Encodes the specified password.
     *
     * @param password Password to encode.
     * @returns A promise resolving with the encoded password, or rejected if an error occurs.
     */
    public async encodePassword(password: string): Promise<string> {
        return Bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Verifies that the specified `password`, once encoded, matches the specified
     * `hashedPassword`.
     *
     * @param password Unencoded password to encode and compare with `hashedPassword`.
     * @param hashedPassword Encoded password that will be compared wil the encoding of the
     *     specified `password`.
     * @returns A promise that:
     *  - resolves with `true` if the two passwords match;
     *  - resolves with `false` otherwise if the two passwords do not match;
     *  - rejected if an error occurs.
     */
    public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return Bcrypt.compare(password, hashedPassword);
    }
}
