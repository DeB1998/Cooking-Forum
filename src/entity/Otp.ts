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
 * Interface describing the information of a new OTP.
 */
export interface NewOtp {
    /**
     * Value of the OTP.
     */
    otp: string;
}

/**
 * Interface describing an OTP stored on the database.
 */
export interface Otp extends NewOtp {
    /**
     * Unique identifier of the OTP.
     */
    id: number;

    /**
     * Date and time when the OTP was created.
     */
    creationDate: Date;
}
