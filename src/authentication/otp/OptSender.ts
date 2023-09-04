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
 * Base interface that must be implemented by all the objects that sends an OTP to the user after
 * the first step of the two-factor authentication has been performed successfully.
 */
export interface OtpSender {
    /**
     * Sends the specified OTP to the user.
     *
     * @param otp OTP to send to the user.
     * @returns A promise that fulfills when the OTP has been successfully sent, or rejects if an
     *     error occurs while sending the OTP.
     */
    sendOtp(otp: string): Promise<void>;
}
