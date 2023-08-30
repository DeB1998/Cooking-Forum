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
import {UserRepository} from "./repository/UserRepository";
import {DatabaseConnection} from "./utils/DatabaseConnection";
import {InvalidEndpointError} from "./utils/InvalidEndpointError";
import {Logger} from "./utils/Logger";

export class Application {
    private static readonly LOGGER = Logger.createLogger();
    private readonly httpServer: Server;
    private port: any;

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
        const jwtManager = new JwtManager(configuration.jwtSecret);
        const otpManager = new OtpManager(passwordManager, configuration.otpSender);
        const userRepository = new UserRepository(databaseConnection, passwordManager);
        const userController = new UserController(userRepository);
        const loginController = new LoginController(jwtManager, otpManager);
        const errorController = new ErrorController();
        const basicAuthentication = new BasicAuthentication(userRepository);

        passport.use(
            new BasicStrategy((email, password, done) =>
                basicAuthentication.authenticate(email, password, done)
            )
        );

        // Create the routes
        const usersRouter = express.Router();
        usersRouter.post(
            "/",
            (request, response, next) =>
                userController.checkUserCreationRequest(request, response, next),
            (request, response, next) => userController.createUser(request, response, next)
        );

        const jwtExtractorMiddleware = expressjwt({
            secret: configuration.jwtSecret,
            algorithms: ["HS256"],
            issuer: JwtManager.JWT_ISSUER
        });
        const loginRouter = express.Router();
        loginRouter.get(
            "/",
            (request: Request, response: Response, next: NextFunction) =>
                loginController.authenticate(request, response, next),
            (request: Request, response: Response, next: NextFunction) =>
                loginController.createJwt(request, response, next)
        );
        const twoFactorAuthRouter = express.Router();
        twoFactorAuthRouter.get(
            "/jwt",
            jwtExtractorMiddleware,
            (request, response, next) =>
                loginController.checkTwoFactorAuthRequest(request, response, next),
            (request, response, next) => loginController.verifyOtp(request, response, next)
        );
        const errorHandler: ErrorRequestHandler = (error, request, response, next) =>
            errorController.handleErrors(error, request, response, next);

        // Configure express.js
        const app = express();
        app.use(express.json());
        app.use(express.urlencoded({extended: false}));
        app.use("/users", usersRouter);
        app.use("/jwt", loginRouter);
        app.use("/2fa", twoFactorAuthRouter);
        app.use("*", (request, response, next) => {
            next(
                new InvalidEndpointError(
                    `Invalid endpoint '${request.baseUrl}' with HTTP method '${request.method}'`
                )
            );
        });
        app.use(errorHandler);

        // Get the port
        this.port = this.normalizePort(configuration.serverPort);
        app.set("port", this.port);

        // Create the HTTP server
        Application.LOGGER.info(`Starting the server on port ${this.port}`);
        this.httpServer = http.createServer(app);
        this.httpServer.on("error", (error) => this.onError(error, this.port));
        this.httpServer.on("listening", () => this.onListening(this.httpServer.address()));
        this.httpServer.on("close", () => {
            Application.LOGGER.info("Server correctly shut down");
            process.exit(0);
        });
    }

    public getHttpServer() {
        return this.httpServer;
    }

    public listen() {
        // Listen on provided port, on all network interfaces
        this.httpServer.listen(this.port);
    }

    public close() {
        this.httpServer.close();
    }

    /**
     * Normalize a port into a number, string, or false.
     */
    private normalizePort(val: any) {
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
    private onError(error: Error, port: number | string) {
        if (!("syscall" in error) || !("code" in error) || error.syscall !== "listen") {
            Application.LOGGER.error(error);
        } else {
            const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

            // handle specific listen errors with friendly messages
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
        process.exit(1);
    }

    /**
     * Event listener for HTTP server "listening" event.
     */
    private onListening(address: string | null | AddressInfo) {
        const bind =
            typeof address === "string" || address === null
                ? `pipe ${address}`
                : `port ${address.port}`;

        Application.LOGGER.info(`Server started on port ${bind}`);
    }
}
