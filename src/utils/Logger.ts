import process from "node:process";
import pino, {LoggerOptions} from "pino";
import pretty, {PrettyOptions} from "pino-pretty";

export class Logger {
    public static createLogger(): pino.Logger<PrettyOptions> {
        const prettyOptions: PrettyOptions = {
            colorizeObjects: true,
            crlf: false,
            errorLikeObjectKeys: ["stack"],
            translateTime: true,
            hideObject: false,
            singleLine: false,
            customColors: "err:red,warn:yellow,info:green,debug:blue",
            ignore: "pid,hostname",
            destination: 1,
            minimumLevel: "trace"
        };
        const pinoOptions: LoggerOptions = {level: "trace"};
        if (process.env["DEBUG"] !== "true") {
            prettyOptions.minimumLevel = "info";
            pinoOptions.level = "info";
        }
        const stream = pretty(prettyOptions);
        return pino(pinoOptions, stream);
    }
}
