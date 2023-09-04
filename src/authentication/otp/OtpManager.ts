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

import * as crypto from "crypto";
import {PasswordManager} from "../basic/PasswordManager";
import {OtpSender} from "./OptSender";

/**
 * Class allowing to generate and verify 6-digits OTPs.
 */
export class OtpManager {
    /**
     * Password manager that will be used to encode the OTP.
     */
    private readonly passwordManager: PasswordManager;

    /**
     * Object responsible for sending the generated OTP to the user.
     */
    private readonly otpSender: OtpSender;

    /**
     * Creates a new object that generates and verifies OTPs.
     *
     * @param passwordManager Password manager that will be used to encrypt the generated OTP.
     * @param otpSender Object responsible for sending the generated OTP to the user.
     */
    constructor(passwordManager: PasswordManager, otpSender: OtpSender) {
        this.passwordManager = passwordManager;
        this.otpSender = otpSender;
    }

    /**
     * Generates a 6-digits OTP.
     *
     * @returns A promise that will be resolved with the encrypted generated OTP, or rejected if an
     *     error occurs during the encryption.
     */
    public async generateOtp(): Promise<string> {
        // Generate a 6-digits random number, possibly padding it with zeros
        const otp = crypto.randomInt(0, 1_000_000);
        const otpString = `${otp}`.padStart(6, "0");

        // Send the OTP to the user
        await this.otpSender.sendOtp(otpString);

        // Encode the OTP
        return this.passwordManager.encodePassword(otpString);
    }

    /**
     * Verifies the correctness of the OTP.
     *
     * @param otp OTP to verify.
     * @param referenceOtp
     * @returns A promise that:
     *  - resolves with `true` if the two OTPs match;
     *  - resolves with `false` if the two OTPs do not match;
     *  - rejects with an `Error` if an error occurs.
     */
    public async verifyOtp(otp: string, referenceOtp: string): Promise<boolean> {
        return this.passwordManager.verifyPassword(otp, referenceOtp);
    }
}
