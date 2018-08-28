import mysql from "mysql";
import nconf from "nconf";
import path from "path";

nconf.argv()
    .env()
    .file({
        file: path.resolve("config.json")
    });

    const ENABLE_MYSQL_POOL = nconf.get("ENABLE_MYSQL_POOL");
    
    let connectObject = {
        host: nconf.get("MYSQL_HOST"),
        user: nconf.get("MYSQL_USER"),
        password: nconf.get("MYSQL_PASSWORD"),
        database: nconf.get("MYSQL_DB"),
        multipleStatements: true
    };
    let mySqlConnection;
    if (parseInt(ENABLE_MYSQL_POOL)) {
        console.log("MYSQL Pooled Connection !");
        connectObject.connectionLimit = 10;
        try{
            mySqlConnection = mysql.createPool(connectObject); 
        }catch(err){
            throw err;
        }
       
    } else {
        console.log("MYSQL Connection !");
        mySqlConnection = mysql.createConnection(connectObject); 
        mySqlConnection.connect((err) => {
            if (err) {
                throw err;
              //  process.exit();
            } 
        });
    }
    

export default mySqlConnection;
