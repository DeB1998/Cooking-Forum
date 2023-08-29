// noinspection FallThroughInSwitchStatementJS

import dotenv from "dotenv";
import express from "express";
import {ErrorRequestHandler} from "express-serve-static-core";
import http from "http";
import process from "node:process";
import {ErrorController} from "./controller/ErrorController";
import {UserController} from "./controller/UserController";
import {UserRepository} from "./repository/UserRepository";
import {DatabaseConnection} from "./utils/DatabaseConnection";
import {Logger} from "./utils/Logger";
import {PasswordManager} from "./utils/PasswordManager";

const logger = Logger.createLogger();

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: any) {
    const port = parseInt(val, 10);

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

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: Error) {
    if (!("syscall" in error) || !("code" in error) || error.syscall !== "listen") {
        logger.error(error);
    } else {
        const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case "EACCES":
                logger.error(`${bind} requires elevated privileges`);
                break;
            case "EADDRINUSE":
                logger.error(`${bind} is already in use`);
                break;
            default:
                logger.error(error);
                break;
        }
    }
    process.exit(1);
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const addr = server.address();
    const bind = typeof addr === "string" || addr === null ? `pipe ${addr}` : `port ${addr.port}`;

    logger.info(`Server started on port ${bind}`);
}

dotenv.config();

// Create the dependencies
const databaseConnection = new DatabaseConnection(
    process.env["DATABASE_HOST"] || "127.0.0.1",
    parseInt(process.env["DATABASE_PORT"] || "5432"),
    process.env["DATABASE_NAME"] || "",
    process.env["DATABASE_USER"] || "",
    process.env["DATABASE_PASSWORD"] || ""
);
const passwordManager = new PasswordManager(
    parseInt(process.env["PASSWORD_SALT_ROUNDS"] || "10") || 10
);
const userRepository = new UserRepository(databaseConnection, passwordManager);
const userController = new UserController(userRepository);
const errorController = new ErrorController();

// Create the routes
const usersRouter = express.Router();
usersRouter.post(
    "/",
    (request, response, next) => userController.checkUserCreationRequest(request, response, next),
    (request, response, next) => userController.createUser(request, response, next)
);
const errorHandler: ErrorRequestHandler = (error, request, response, next) =>
    errorController.handleErrors(error, request, response, next);

// Configure express.js
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/users", usersRouter);
app.use(errorHandler);

// Get the port
const port = normalizePort(process.env["PORT"] || "");
app.set("port", port);

// Create the HTTP server
logger.info(`Starting the server on port ${port}`);
const server = http.createServer(app);
// Listen on provided port, on all network interfaces
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
server.on("close", () => {
    logger.info("Server correctly shut down");
    process.exit(0);
});

process.once("SIGUSR2", () => {
    logger.info("Requested server to shut down");
    server.close();
});
