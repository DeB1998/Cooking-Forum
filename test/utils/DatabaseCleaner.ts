import {DatabaseConnection} from "../../src/utils/DatabaseConnection";

export class DatabaseCleaner {
    private readonly databaseConnection: DatabaseConnection;

    constructor(databaseConnection: DatabaseConnection) {
        this.databaseConnection = databaseConnection;
    }

    public async cleanDatabase() {
        const client = await this.databaseConnection.getClient();
        try {
            // language=PostgreSQL
            await client.query("TRUNCATE TABLE otp CASCADE");
            await client.query("TRUNCATE TABLE users CASCADE");
        } finally {
            client.release();
        }
    }
}
