import express from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./lib/logger";
import morgan from "morgan";

import v1RouterPublic from "./v1/routes/publicRoute";
import v1RouterCommon from "./v1/routes/commonRoutes";
import v1RouterExpert from "./v1/routes/expertRoute";
import v1RouterClient from "./v1/routes/clientRoutes";

import v1Authentication from "./v1/middlewares/authenticate";
import cleanup from "./config/cleanup";


const app = express();
app.use(morgan(function (tokens, req, res) {
    return JSON.stringify({
        "remote-addr": tokens["remote-addr"](req, res),
        "remote-user": tokens["remote-user"](req, res),
        "method": tokens.method(req, res),
        "url": tokens.url(req, res),
        "http-version": tokens["http-version"](req, res),
        "status": tokens.status(req, res),
        "res-content-length": tokens.res(req, res, "content-length"),
        "referrer": tokens.referrer(req, res),
        "user-agent": tokens["user-agent"](req, res),
        "response-time": tokens["response-time"](req, res) + "ms"
    });
  }, { stream: logger.stream }));

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded());

app.get("/ping",  (req, res, next) =>{
    res.send(`{
        "status": "OK",
        "status_code": 200  
    }`);
});

app.use("/v1/", v1RouterPublic); 
app.use("/v1/", v1Authentication.authentication, v1RouterCommon);
app.use("/v1/expert/", v1Authentication.authentication, v1RouterExpert);
app.use("/v1/client/", v1Authentication.authentication, v1RouterClient);
cleanup();

export default app;