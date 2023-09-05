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

// noinspection FallThroughInSwitchStatementJS

import express from "express";
import {expressjwt} from "express-jwt";
import {ErrorRequestHandler, NextFunction, Request, Response} from "express-serve-static-core";
import http from "http";
import {Server} from "node:http";
import {AddressInfo} from "node:net";
import process from "node:process";
import passport from "passport";
import {BasicStrategy} from "passport-http";
import {ApplicationConfiguration} from "./ApplicationConfiguration";
import {BasicAuthentication} from "./authentication/basic/BasicAuthentication";
import {PasswordManager} from "./authentication/basic/PasswordManager";
import {JwtManager} from "./authentication/jwt/JwtManager";
import {OtpManager} from "./authentication/otp/OtpManager";
import {ErrorController} from "./controller/ErrorController";
import {LoginController} from "./controller/LoginController";
import {UserController} from "./controller/UserController";
import {OtpRepository} from "./repository/OtpRepository";
import {UserRepository} from "./repository/UserRepository";
import {DatabaseConnection} from "./utils/DatabaseConnection";
import {InvalidEndpointError} from "./utils/InvalidEndpointError";
import {Logger} from "./utils/Logger";

/**
 * Main class configuring and starting the HTTP server that runs the application.
 */
export class Application {
    /**
     * Logger that will be used to log messages the application generates.
     */
    private static readonly LOGGER = Logger.createLogger();

    /**
     * HTTP server that runs the application.
     */
    private readonly httpServer: Server;

    /**
     * Port on which the HTTP server will listen for incoming requests.
     */
    private readonly port: any;

    /**
     * Creates, but do not start, the application. Call {@link Application.listen} to start the
     * HTTP server and listen for incoming requests.
     *
     * @param configuration Configuration of the application.
     */
    constructor(configuration: ApplicationConfiguration) {
        // Create the dependencies
        const databaseConnection = new DatabaseConnection(
            configuration.databaseHost,
            configuration.databasePort,
            configuration.databaseName,
            configuration.databaseUser,
            configuration.databasePassword
        );
        const passwordManager = new PasswordManager(configuration.passwordSaltRounds);
        const jwtManager = new JwtManager(
            configuration.jwtSecret,
            configuration.sessionDuration,
            configuration.jwtIssuer
        );
        const otpManager = new OtpManager(passwordManager, configuration.otpSender);
        const otpRepository = new OtpRepository(databaseConnection);
        const userRepository = new UserRepository(databaseConnection, passwordManager);
        const userController = new UserController(userRepository);
        const loginController = new LoginController(
            jwtManager,
            otpManager,
            otpRepository,
            configuration.otpDuration
        );
        const errorController = new ErrorController();
        const basicAuthentication = new BasicAuthentication(userRepository);

        // Use passport to check the user's credentials
        passport.use(
            new BasicStrategy((email, password, done) =>
                basicAuthentication.authenticate(email, password, done)
            )
        );

        // Create the routes to manage users
        const usersRouter = express.Router();
        // Create the route to register a new user
        usersRouter.post(
            "/",
            // Check the correctness of the JSON object in the request body
            (request, response, next) =>
                userController.checkUserCreationRequest(request, response, next),
            // Register the user
            (request, response, next) => userController.createUser(request, response, next)
        );

        // Create the routes to manage the first step of the login process
        const loginRouter = express.Router();
        loginRouter.get(
            "/",
            // Authenticate the user checking the provided credentials
            (request: Request, response: Response, next: NextFunction) =>
                loginController.authenticate(request, response, next),
            // Create the JWT holding the user's session
            (request: Request, response: Response, next: NextFunction) =>
                loginController.createJwt(request, response, next)
        );
        // Create the middleware that extracts and validates JWTs from the Authentication header
        const jwtExtractorMiddleware = expressjwt({
            secret: configuration.jwtSecret,
            algorithms: ["HS256"],
            issuer: configuration.jwtIssuer
        });
        // Create the routes to manage the second step of the login process
        const twoFactorAuthRouter = express.Router();
        twoFactorAuthRouter.get(
            "/jwt",
            // Extract the JWT holding the user's session
            jwtExtractorMiddleware,
            // Check the correctness of the request body
            (request, response, next) =>
                loginController.checkTwoFactorAuthRequest(request, response, next),
            // Verify the correctness of the OTP
            (request, response, next) => loginController.verifyOtp(request, response, next)
        );
        // Create the middleware that handles the errors
        const errorHandler: ErrorRequestHandler = (error, request, response, next) =>
            errorController.handleErrors(error, request, response, next);

        // Configure Express adding the middlewares
        const app = express();
        app.use(express.json());
        app.use(express.urlencoded({extended: false}));
        app.use("/users", usersRouter);
        app.use("/jwt", loginRouter);
        app.use("/2fa", twoFactorAuthRouter);
        // Add a default middleware that handles non-existent endpoints
        app.use("*", (request, _, next) =>
            next(
                new InvalidEndpointError(
                    `Invalid endpoint '${request.baseUrl}' with HTTP method '${request.method}'`
                )
            )
        );
        app.use(errorHandler);

        // Set the port
        this.port = Application.normalizePort(configuration.serverPort);
        app.set("port", this.port);

        // Create the HTTP server
        Application.LOGGER.info(`Starting the server on port ${this.port}`);
        this.httpServer = http.createServer(app);
        // Log the server events
        this.httpServer.on("error", (error) => Application.onError(error, this.port));
        this.httpServer.on("listening", () => Application.onListening(this.httpServer.address()));
        this.httpServer.on("close", () => {
            Application.LOGGER.info("Server correctly shut down");
            process.exit(0);
        });
    }

    /**
     * Returns the HTTP server.
     *
     * @returns The HTTP server.
     */
    public getHttpServer(): Server {
        return this.httpServer;
    }

    /**
     * Make the HTTP server listen for incoming requests. This qill effectively start teh
     * application.
     */
    public listen(): void {
        // Listen on provided port, on all network interfaces
        this.httpServer.listen(this.port);
    }

    /**
     * Stops the application by closing the HTTP server.
     */
    public close(): void {
        this.httpServer.close();
    }

    /**
     * Normalizes the port the HTTP server will listen on.
     *
     * @param value Value to normalize as a port.
     * @returns The port normalized into a number or a string, or `false` if the specifed value is
     *     not valid.
     */
    private static normalizePort(value: any): any {
        const port = parseInt(value, 10);

        if (isNaN(port)) {
            // Named pipe
            return value;
        }

        if (port >= 0) {
            // Port number
            return port;
        }

        // Ivalid value
        return false;
    }

    /**
     * Event listener that manages error events generated by the HTTP server.
     *
     * @param error The error that occurred.
     * @param port The port where the HTTP server is listening for incoming requests.
     */
    private static onError(error: Error, port: number | string): void {
        if (!("syscall" in error) || !("code" in error) || error.syscall !== "listen") {
            // Log the error
            Application.LOGGER.error(error);
        } else {
            const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

            // Handle specific listen errors with friendly messages
            switch (error.code) {
                case "EACCES":
                    Application.LOGGER.error(`${bind} requires elevated privileges`);
                    break;
                case "EADDRINUSE":
                    Application.LOGGER.error(`${bind} is already in use`);
                    break;
                default:
                    Application.LOGGER.error(error);
                    break;
            }
        }
        // Terminate the application
        process.exit(1);
    }

    /**
     * Event listener that manages the event generated when the HTTP server is successfully started.
     *
     * @param address Address on which the HTTP server is listening for incoming requests.
     * @private
     */
    private static onListening(address: string | null | AddressInfo): void {
        const bind =
            typeof address === "string" || address === null
                ? `pipe ${address}`
                : `port ${address.port}`;

        Application.LOGGER.info(`Server started on ${bind}`);
    }
}
