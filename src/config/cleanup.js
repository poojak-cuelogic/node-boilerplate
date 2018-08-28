import connection from "./mySQLConnection";
import logger from "../lib/logger";
import nconf from "nconf";
import path from "path";

nconf.argv()
   .env()
   .file({ file: path.resolve("config.json")});

const exitHandler = async ({cleanup, exit, email, event}, err) => {
    if(email && nconf.get("IS_SERVER_NOTIFICATION_ON") == "true") {
        const msg = " Hello,  Soter: Server stop due to " + event;
        await notificationModel.sendEmailByNodeMailer(nconf.get("SERVER_EMAIL"), "Soter: Server Error", msg, msg);
    }
    if(cleanup){
        connection.end((err) => {
            if(err) logger.error(err);
            if(exit){
                process.exit(1);
            }
        });
    } else if (exit){
        process.exit(1);
    }
};


const Cleanup = () => {
    
    process.stdin.resume();

    process.on("exit", exitHandler.bind(null, { cleanup:true, exit: false, email: true, event: "exit" }));

    //catches ctrl+c event
    process.on("SIGINT", exitHandler.bind(null, { cleanup:true, exit: true, email: true, event: "SIGINT" }));

    // catches "kill pid" (for example: nodemon restart)
    process.on("SIGUSR1", exitHandler.bind(null, { cleanup:true, exit: true, email: true, event: "SIGUSR1" }));
    process.on("SIGUSR2", exitHandler.bind(null, { cleanup:true, exit: true, email: true, event: "SIGUSR2" }));

    //catches uncaught exceptions
    process.on("uncaughtException", exitHandler.bind(null, { cleanup:true, exit: true, email: true, event: "uncaughtException" }));

    //catches unhandledRejection
    process.on("unhandledRejection", exitHandler.bind(null, { cleanup:true, exit: true, email: true, event: "unhandledRejection" }));
};

export default Cleanup;