import winston from "winston";
import fs from "fs";
import nconf from "nconf";
import path from "path";

nconf.argv()
   .env()
   .file({ file: path.resolve("config.json")});
   
const env = nconf.get("env");
const logger_conf = nconf.get("logger");

const logDir = logger_conf["dir"];
const logLevel = logger_conf["level"];
const errorFile = logger_conf["error_file"];
const logFile = logger_conf["log_file"]

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const timeFormat = () => (new Date()).toISOString();

// Create seperate exception logger:
winston.handleExceptions(new winston.transports.File({ filename: `${logDir}/${errorFile}` }));

// Create custom logger and export as default
const logger = new (winston.Logger)({
    transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
            timestamp: timeFormat,
            colorize: true,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            level: logLevel,
            json: false,
        }),

        // we place a “-” before “results.log”, that appears in a format like: 2016-06-09-results
        new (require("winston-daily-rotate-file"))({
            filename: `${logDir}/${logFile}_%DATE%.log`,
            timestamp: timeFormat,
            datePattern: "Y-MM-D",
            prepend: true,
            // maxsize: 5242880, // 5MB
            // maxFiles: 5,
            colorize: false,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            level: "debug",
            json: true,
            // formatter: function (options) {
            //     // Return string will be passed to logger.
            //     return options.timestamp() + " " + options.level.toUpperCase() + " : " + (options.message ? options.message : " ") + " ";
            // }

        })
    ],
    exitOnError: false, // do not exit on handled exceptions
});

logger.stream = {
    write: function(message, encoding) {
      logger.info(JSON.parse(message));
    }
};

export default logger;