import {NewUser, User} from "../entity/User";
import {DatabaseConnection} from "../utils/DatabaseConnection";
import {PasswordManager} from "../utils/PasswordManager";

export class UserRepository {
    private readonly databaseConnection: DatabaseConnection;
    private passwordManager: PasswordManager;

    constructor(databaseConnection: DatabaseConnection, passwordManager: PasswordManager) {
        this.databaseConnection = databaseConnection;
        this.passwordManager = passwordManager;
    }

    public async insertUser(user: NewUser, password: string) {
        const client = await this.databaseConnection.getClient();

        try {
            // Encode the password
            const encodedPassword = await this.passwordManager.encodePassword(password);
            // Insert the user
            const query = `INSERT INTO users(name, surname, email, password, two_factor_authentication)
                           VALUES ($1, $2, $3, $4, $5)
                           ON CONFLICT DO NOTHING`;
            const result = await client.query(query, [
                user.name,
                user.surname,
                user.email,
                encodedPassword,
                user.twoFactorAuthentication
            ]);
            return result.rowCount !== 0;
        } finally {
            client.release();
        }
    }

    public async logIn(email: string, password: string): Promise<User | null> {
        const client = await this.databaseConnection.getClient();

        try {
            // Encode the password
            const encodedPassword = await this.passwordManager.encodePassword(password);
            // Select the user
            const userSelectionQuery = `SELECT id, name, surname, email, two_factor_authentication
                                        FROM users
                                        WHERE email = $1
                                          AND password = $2
                                        LIMIT 1`;
            const result = await client.query(userSelectionQuery, [email, encodedPassword]);
            // Extract the result
            if (result.rowCount === 1) {
                const row = result.rows[0] as [number, string, string, string, boolean];
                return {
                    id: row[0],
                    name: row[1],
                    surname: row[2],
                    email: row[3],
                    twoFactorAuthentication: row[4]
                };
            }
            return null;
        } finally {
            client.release();
        }
    }
}
