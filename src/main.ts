// noinspection FallThroughInSwitchStatementJS

import * as console from "console";
import express from "express";
import http from "http";
import dotenv from "dotenv";
import process from "node:process";
import usersRouter from "./routes/users";
import {Client} from "pg";
import {Logger} from "./utils/Logger";

dotenv.config();

async function f() {
    const logger = Logger.createLogger();
    console.log(process.cwd());
    logger.info("Starting the server");
    logger.debug("Starting the server");

    const client = new Client({
        host: process.env["DATABASE_HOST"],
        port: parseInt(process.env["DATABASE_PORT"] || "5432"),
        database: process.env["DATABASE_NAME"],
        user: process.env["DATABASE_USER"],
        password: process.env["DATABASE_PASSWORD"]
    });
    await client.connect();

    const result = await client.query("SELECT * FROM users");
    logger.debug(result)
}

f().then();

//const app = express();

/*
//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/users", usersRouter);

**
 * Get port from environment and store in Express.
 *
const port = normalizePort(process.env["PORT"] || "3000");
app.set("port", port);

**
 * Create HTTP server.
 *

const server = http.createServer(app);

**
 * Listen on provided port, on all network interfaces.
 *

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

**
 * Normalize a port into a number, string, or false.
 *

function normalizePort(val: any) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

**
 * Event listener for HTTP server "error" event.
 *

function onError(error: Error) {
    if (!("syscall" in error) || !("code" in error) || error.syscall !== "listen") {
        throw error;
    }

    var bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);

        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
}

**
 * Event listener for HTTP server "listening" event.
 *

function onListening() {
    var addr = server.address();
    var bind = typeof addr === "string" || addr === null ? `pipe ${addr}` : `port ${addr.port}`;
}
*/
