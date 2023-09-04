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

import {SuccessfulResponse} from "./SuccessfulResponse";

/**
 * Interface describing the body of the HTTP response this application sends when:
 * - the user has not enabled the two-factor authentication, and the provided credentials are
 * correct;
 * - the user has enabled the two-factor authentication, and the first step of the authentication
 * has been concluded successfully because the provided credentials are correct.
 */
export interface LoginResponse extends SuccessfulResponse {
    /**
     * JSON Web Token containing the user session information.
     */
    jwt: string;

    /**
     * Flag indicating whether the user enabled the two-factor authentication.
     *
     * In case this flag is `true`, then an OTP is automatically sent to the user, which then must
     * send the received OTP in the body of another HTTP request.
     *
     * In case, instead, this flag is `false`, then the user is correctly authenticated.
     */
    requiresTwoFactorAuthentication: boolean;
}
