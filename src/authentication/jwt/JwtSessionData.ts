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
 * Interface describing the data in the user session. Objects conforming to this interface can be
 * placed in the JWT that holds the user session information.
 */
export interface JwtSessionData {
    /**
     * ID identifying the user.
     */
    userId: number;

    /**
     * ID identifying the OTP information stored on the database if the user has enabled the
     * two-factor authentication and needs to perform the second authentication with the OTP.
     */
    otpId?: number;
}
