import {NewUser, User} from "../entity/User";
import {DatabaseConnection} from "../utils/DatabaseConnection";
import {InvalidValueError} from "../utils/InvalidValueError";
import {Logger} from "../utils/Logger";
import {PasswordManager} from "../authentication/basic/PasswordManager";

export class UserRepository {
    private static readonly LOGGER = Logger.createLogger();

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
            if (encodedPassword.length !== 60) {
                UserRepository.LOGGER.fatal(
                    `The encoded password has length ${encodedPassword.length}`
                );
                throw new InvalidValueError("Password error");
            }
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

    public async authenticateUser(email: string, password: string): Promise<User | null> {
        const client = await this.databaseConnection.getClient();

        try {
            // Select the user
            const userSelectionQuery = `SELECT id,
                                               name,
                                               surname,
                                               email,
                                               password,
                                               two_factor_authentication AS "twoFactorAuthentication"
                                        FROM users
                                        WHERE email = $1
                                        LIMIT 1`;
            const result = await client.query(userSelectionQuery, [email]);
            // Extract the result
            if (result.rowCount === 1) {
                const row = result.rows[0] as User & {password: string};
                if (await this.passwordManager.verifyPassword(password, row.password)) {
                    return {
                        id: row.id,
                        name: row.name,
                        surname: row.surname,
                        email: row.email,
                        twoFactorAuthentication: row.twoFactorAuthentication
                    };
                }
            }
            return null;
        } finally {
            client.release();
        }
    }
}
