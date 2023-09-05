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

/**
 * Interface describing the information of a new user.
 */
export interface NewUser {
    /**
     * Name of the user.
     */
    name: string;

    /**
     * Surname of the user.
     */
    surname: string;

    /**
     * Email of the user.
     */
    email: string;

    /**
     * Boolean flag indicating whether the user has enabled (`true`) or not (`false`) the
     * two-factor authentication.
     */
    twoFactorAuthentication: boolean;
}

/**
 * Interface describing the user's information stored on the database.
 */
export interface User extends NewUser {
    /**
     * Unique identifier of the user.
     */
    id: number;
}
