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

import process from "node:process";
import pino, {LoggerOptions} from "pino";
import pretty, {PrettyOptions} from "pino-pretty";

/**
 * Utility class easing the creation of Pino loggers.
 */
export class Logger {
    /**
     * Creates a new Pino logger.
     * By default, the created logger will display only logs with level
     * greater or equal to 'info'. Debug and trace logs are shown only if the `DEBUG` environment
     * variable is set to the string `true`.
     * The generated logs are then prettified using the `pino-pretty` library.
     */
    public static createLogger(): pino.Logger<PrettyOptions> {
        // Set the prettifier options
        const prettyOptions: PrettyOptions = {
            colorizeObjects: true,
            crlf: false,
            errorLikeObjectKeys: ["err", "error"],
            translateTime: true,
            hideObject: false,
            singleLine: false,
            customColors: "error:red,warn:yellow,info:green,debug:blue",
            ignore: "pid,hostname",
            destination: 1,
            minimumLevel: "trace"
        };
        // Set the minimum logging level
        const pinoOptions: LoggerOptions = {level: "trace"};
        if (process.env["DEBUG"] !== "true") {
            prettyOptions.minimumLevel = "info";
            pinoOptions.level = "info";
        }
        // Create the logger
        const stream = pretty(prettyOptions);
        return pino(pinoOptions, stream);
    }
}
