import {Pool, PoolClient} from "pg";
import {Logger} from "./Logger";

/**
 * Class holding a pool of connections to the database.
 */
export class DatabaseConnection {
    /**
     * Logger that logs debug information.
     */
    private static readonly LOGGER = Logger.createLogger();

    /**
     * Pool of connections to the database.
     */
    private pool: Pool;

    /**
     * Creates a new object holding a pool of connections to the database.
     *
     * @param host Host where the DBMS is run on. If not specified, it defaults to `localhost`.
     * @param port Port on the specified `host` where the DBMS is listening for incoming requests.
     *     If not specified, it defaults to 5432.
     * @param database Name of the database to connect to.
     * @param user If not specified, it defaults to the default PostgreSQL user.
     * @param password If not specified, it defaults to the empty string.
     */
    constructor(
        host: string | undefined,
        port: number | undefined,
        database: string,
        user: string | undefined,
        password: string | undefined
    ) {
        // Create the pool
        this.pool = new Pool({
            host,
            port,
            database,
            user,
            password
        });
        DatabaseConnection.LOGGER.debug(
            `Created the connection pool to ${host}:${port} on database '${database}' with user '${user}'`
        );
    }

    /**
     * Retrieves a connection from the pool of connections. To be correctly reused, the returned
     * connection should be released when not needed by calling the {@link PoolClient.release}
     * method.
     *
     * @returns A connection from the pool of connections to the database.
     */
    public async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }
}
