import {NewOtp, Otp} from "../entity/Otp";
import {DatabaseConnection} from "../utils/DatabaseConnection";

export class OtpRepository {
    private readonly databaseConnection: DatabaseConnection;

    constructor(databaseConnection: DatabaseConnection) {
        this.databaseConnection = databaseConnection;
    }

    public async insertOtp(otp: NewOtp): Promise<Otp | null> {
        const client = await this.databaseConnection.getClient();

        try {
            // Insert the otp
            const query = `INSERT INTO otp(otp)
                           VALUES ($1)
                           RETURNING id, otp, date`;
            const result = await client.query(query, [otp.otp]);
            if (result.rowCount === 1) {
                const row = result.rows[0];
                return {
                    id: row.id,
                    otp: row.otp,
                    date: row.date
                };
            }
            return null;
        } finally {
            client.release();
        }
    }

    public async deleteOtpById(otpId: number): Promise<boolean> {
        const client = await this.databaseConnection.getClient();

        try {
            // Select the user
            const query = `DELETE
                           FROM otp
                           WHERE id = $1`;
            const result = await client.query(query, [otpId]);
            // Extract the result
            return result.rowCount === 1;
        } finally {
            client.release();
        }
    }

    public async getOtpById(otpId: number): Promise<Otp | null> {
        const client = await this.databaseConnection.getClient();

        try {
            // Select the user
            const query = `SELECT id,
                                  otp,
                                  date
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
                    date: row.date
                };
            }
            return null;
        } finally {
            client.release();
        }
    }
}
