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

import {NewOtp, Otp} from "../entity/Otp";
import {DatabaseConnection} from "../utils/DatabaseConnection";

/**
 * Class allowing to access the table on the database storing the generated OTPs.
 */
export class OtpRepository {
    /**
     * Object holding the connection to the database.
     */
    private readonly databaseConnection: DatabaseConnection;

    /**
     * Creates a new object that interacts with the database to store and retrieve OTPs.
     *
     * @param databaseConnection Object holding the connection to the database.
     */
    constructor(databaseConnection: DatabaseConnection) {
        this.databaseConnection = databaseConnection;
    }

    /**
     * Inserts an OTP.
     *
     * @param otp Object holding the information of the OTP.
     * @returns A promise that resolves with the information of the newly inserted OTP, or `null`
     *     if the OTP cannot be stored on the database. If any other error occurs, the returned
     *     promise will be rejected.
     */
    public async insertOtp(otp: NewOtp): Promise<Otp | null> {
        // Retrieve a connection from the pool
        const client = await this.databaseConnection.getClient();

        try {
            // Insert the OTP
            const query = `INSERT INTO otp(otp)
                           VALUES ($1)
                           RETURNING id, otp, date`;
            const result = await client.query(query, [otp.otp]);
            if (result.rowCount === 1) {
                const row = result.rows[0];
                return {
                    id: row.id,
                    otp: row.otp,
                    creationDate: row.date
                };
            }
            return null;
        } finally {
            // Release the connection
            client.release();
        }
    }

    /**
     * Deletes an OTP from the database, so that the OTP cannot be used anymore.
     *
     * @param otpId Identifier uniquely identifying the OTP to delete.
     * @returns A promise that resolves with `true` if the OTP is successfully deleted, or `false`
     *     if it cannot be deleted. If any other error occurs, the returned promise will be
     *     rejected.
     */
    public async deleteOtpById(otpId: number): Promise<boolean> {
        // Retrieve a connection from the pool
        const client = await this.databaseConnection.getClient();

        try {
            // Delete the OTP
            const query = `DELETE
                           FROM otp
                           WHERE id = $1`;
            const result = await client.query(query, [otpId]);

            return result.rowCount === 1;
        } finally {
            // Release the connection
            client.release();
        }
    }

    /**
     * Retrieves the OTP with the specified identifier.
     *
     * @param otpId Identifier uniquely identifying the OTP to retrieve.
     * @returns A promise that resolves with the retrieved OTP if it is found, or with `null` if
     *     there is no OTP with the specified identifier. If any other error occurs, the returned
     *     promise will be rejected.
     */
    public async getOtpById(otpId: number): Promise<Otp | null> {
        // Retrieve a connection from the pool
        const client = await this.databaseConnection.getClient();

        try {
            // Select the OTP
            const query = `SELECT id,
                                  otp,
                                  creation_date AS creationDate
                           FROM otp
                           WHERE id = $1
                           LIMIT 1`;
            const result = await client.query(query, [otpId]);
            // Extract the result
            if (result.rowCount === 1) {
                const row = result.rows[0] as Otp;
                return {
                    id: row.id,
                    otp: row.otp,
                    creationDate: row.creationDate
                };
            }
            return null;
        } finally {
            // Release the connection
            client.release();
        }
    }
}
