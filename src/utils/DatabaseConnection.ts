import {Pool} from "pg";
import {Logger} from "./Logger";

export class DatabaseConnection {
    private static readonly LOGGER = Logger.createLogger();

    private pool: Pool;

    constructor(host: string, port: number, database: string, user: string, password: string) {
        this.pool = new Pool({
            host,
            port,
            database,
            user,
            password
        });
        DatabaseConnection.LOGGER.debug(
            "Created the connection pool to",
            host,
            ":",
            port,
            " on database ",
            database,
            "with user",
            user
        );
    }

    public async getClient() {
        return await this.pool.connect();
    }
}
