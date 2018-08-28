import sqlConnection from "config/mySQLConnection";
import logger from "lib/logger";
import mysql from "mysql";
import csv from "csvtojson";
import _ from "lodash";
import utilityModel from "components/utility/models/UtilityModel";
import elasticSearchController from "components/utility/controllers/ElasticSearchController";
import {
    OFFSET
} from "config/constants";

class ContactModel {

    constructor() {}
    /**
     * @input : Impoeted csv path     
     * @output : promise
     * Description : parse csv in object and return json-array object.
     */
    getParsedCsv = (csvFilePath) => {
        return new Promise((resolve, reject) => {
            csv()
                .fromFile(csvFilePath)
                .on("end_parsed", (jsonArrayObj) => {
                    //when parse finished, result will be emitted here. 
                    resolve(jsonArrayObj);
                })
        });
    }

    /**
     * @input : Impoeted csv Json object   
     * @output : promise
     * Description : save  imported csv user contact info.  
     *               
     ***/
    saveImportedCsvContacts = (jsonData, user) => {

        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.info("ContactModel : saveImportedCsvContacts");
            const userId = mysql.escape(user.id);
            let queryString = "";

            queryString = " Insert into `user_contact` (`user_id`, `user_role`, `create_type`, `first_name`,`last_name`, `company_name`, `email`, `contact_no`, `city_id`, `state_id`, `postal_code`,`linkedin_url`,`whatsapp_no`,`address_line1`,`address_line2`,`created_by`,`row_status`) values ";

            let promiseArr = [];
            jsonData.map((data) => {
                promiseArr.push(self.getQuery(data, userId));
            });

            Promise.all(promiseArr)
                .then((data) => {
                    logger.debug("data===>", data.join(", "));
                    queryString += data.join(", ");
                    sqlConnection.query(queryString, (err, result) => {
                        if (err) {
                            logger.error(`ContactModel : saveImportedCsvContacts :: error ${err} `);
                            reject({
                                Error: "Server Error"
                            });
                        } else if (result) {
                            logger.debug("result====>", result);
                            resolve(result);
                        }
                    });
                });



        });

    }


    getQuery = async (data, user_id) => {

        logger.info("ContactModel : getQuery");

        let query_string;
        return new Promise(async (resolve, reject) => {
            try {


                const created_by = mysql.escape(user_id);
                const user_role = mysql.escape(data.role);
                const create_type = "2";
                const first_name = mysql.escape(data.first_name);
                const last_name = mysql.escape(data.last_name);
                const company_name = mysql.escape(data.company_name);
                const email = mysql.escape(data.email);
                const contact_no = mysql.escape(data.contact_no);

                let result = await utilityModel.getCityId(data.city_name);
                let result_state = await utilityModel.getStates(data.state_code);

                let city_id = null;
                let state_id = null;

                if (result && result[0]) {
                    city_id = result[0].id;
                }
                if (result_state && result_state[0]) {
                    state_id = result_state[0].id;
                }
                logger.debug("city_id : " + city_id);
                logger.debug("state_id : " + state_id);

                const postal_code = mysql.escape(data.postal_code);
                const linkedin_url = mysql.escape(data.linkedin_url);
                const whatsapp_no = mysql.escape(data.whatsapp_no);
                const address_line1 = mysql.escape(data.address_line1);
                const address_line2 = mysql.escape(data.address_line2);

                query_string = " (" + user_id + ", " + user_role + ", " + create_type + ", " + first_name + ", " + last_name + ", " + company_name + ", " + email + ", " + contact_no + ", " + city_id + ", " + state_id + ", " + postal_code + ", " + linkedin_url + ", " + whatsapp_no + ", " + address_line1 + ", " + address_line2 + ", " + user_id + ", '1')";

                logger.debug(query_string);
                //  return query_string;
                resolve(query_string);
            } catch (err) {
                reject({
                    message: "something went wrong"
                })
            }


        });
    }

    /**
     * @input : obejct param 
     * @output : promise
     * Description : save user contact info.  
     *               If contact already exist  update its content.
     ***/
    saveContact = (req) => {

        logger.info("ContactModel : saveContact METHOD - " + req.method);

        let params = req.body;
        params.create_type = 1;
        logger.debug(params);
        let contactID = "0";
        if (req.method == "PUT") {
            contactID = params.contact_id;
        }
        let userID = params.user.id;
        let created_by = params.user.id;
        let modified_by = params.user.id;

        return new Promise((resolve, reject) => {

            let sql = "";

            params.city_id = params.city_id == "" ? null : params.city_id;
            params.state_id = params.state_id == "" ? null : params.state_id;
            params.user_role = params.user_role == "" ? null : params.user_role;

            if (req.method == "POST") {
                sql = "CALL save_user_contact(" + mysql.escape(contactID) + "," + mysql.escape(userID) + "," + mysql.escape(params.user_role) + "," + mysql.escape(params.create_type) + "," + mysql.escape(params.first_name) + "," + mysql.escape(params.last_name) + "," + mysql.escape(params.company_name) + "," + mysql.escape(params.email) + "," + mysql.escape(params.contact_no) + "," + mysql.escape(params.city_id) + "," + mysql.escape(params.state_id) + "," + mysql.escape(params.postal_code) + "," + mysql.escape(params.linkedin_url) + "," + mysql.escape(params.whatsapp_no) + "," + mysql.escape(params.street) + "," + mysql.escape(params.apt_floor_unit) + ",'" + created_by + "','" + modified_by + "')";
            }
            // if (req.method == "PUT") {
            //     sql = "CALL save_user_contact(" + mysql.escape(contactID) + "," + mysql.escape(userID) + "," + mysql.escape(params.user_role) + "," + mysql.escape(params.create_type) + "," + mysql.escape(params.first_name) + "," + mysql.escape(params.last_name) + "," + mysql.escape(params.company_name) + "," + mysql.escape(params.email) + "," + mysql.escape(params.contact_no) + "," + mysql.escape(params.city_id) + "," + mysql.escape(params.state_id) + "," + mysql.escape(params.postal_code) + "," + mysql.escape(params.linkedin_url) + "," + mysql.escape(params.whatsapp_no) + "," + mysql.escape(params.address_line1) + "," + mysql.escape(params.address_line2) + ",'" + created_by + "','" + modified_by + "')";
            // }
            logger.debug(sql);

            sqlConnection.query(sql, (err, result) => {
                if (err) {
                    logger.error(`ContactModel : saveContact :: error ${err} `);
                    reject(err);
                } else if (result) {
                    logger.debug("result====>", result);
                    resolve(result);
                }
            });
        });
    }

    /**
     * @input : obejct param 
     * @output : promise
     * Description : save user contact info.  
     *               If contact already exist  update its content.
     ***/
    updateContact = (params) => {

        logger.info("ContactModel : updateContact params - " + JSON.stringify(params));
        let userID = params.user.id;

        return new Promise(async (resolve, reject) => {

            let result;
            let contactId = params.contact_id;
            logger.debug("params :: " + params);
            params.modified_by = userID;

            let where = {
                id: params.contact_id
            };

            if (params.city_id == "") {
                params.city_id = null;
            }
            if (params.user_role == "") {
                params.user_role = null;
            }
            if (params.state_id == "") {
                params.state_id = null;
            }

            delete params["contact_id"];
            delete params["user"];

            try {

                if (params.listing_type_preference) {
                    let sql = "call contact_save_listing_type_preference(" + mysql.escape(contactId) + "," + mysql.escape(JSON.stringify(params.listing_type_preference)) + ");";
                    result = await utilityModel.execute(sql);
                    logger.info("ContactModel  : updateContact :: listing type preference saved !!");

                } else if (params.geolocation_preference) {

                    result = await utilityModel.execute("call save_contact_geolocation_preference(" + mysql.escape(contactId) + "," + mysql.escape(JSON.stringify(params.geolocation_preference)) + ");");
                    result = result[0];
                    logger.info("ContactModel  : updateContact :: geolocation preference saved !!");

                } else {

                    result = utilityModel.update("user_contact", params, where);
                    logger.info("ContactModel  : updateContact :: contact information saved !!");

                }

                resolve(result);

            } catch (err) {

                logger.error(`ContactModel  : updateContact :: error ${err} `);
                reject(err);
            }
        });
    }




    getContactGeolocationPreference = (geolocation_preference) => {

        logger.info("ContactModel : getContactGeolocationPreference ");

        return new Promise(async (resolve, reject) => {

            let sql = "select `id`, `contact_id`, `range`, `range_unit`, `geo_location`, `latitude`, `longitude` from contact_preference_geolocation where `row_status` = '1' and `id` in (" + geolocation_preference + " )";

            logger.debug("getContactGeolocationPreference sql==>", sql);
            sqlConnection.query(sql, (err, result) => {

                if (err) {
                    logger.error(`ContactModel  : getContactGeolocationPreference :: error ${err} `);
                    reject({
                        message: "something went wrong !!"
                    });

                } else if (result) {

                    logger.debug("result====>", result);
                    resolve(result);

                }

            });
        });

    }

    /**
     * @param : obejct param 
     * @return : promise
     * Description : Returns contact details   
     ***/
    getContact = async (param) => {

        logger.info("ContactModel : getContact  ");
        let get_search_records = false;
        // let select = "SELECT UC.id,UC.user_id,UC.user_role,(CASE WHEN (UC.user_role='1' || UC.user_role='5') THEN 'Broker' WHEN (UC.user_role='2' || UC.user_role='6') THEN 'Principal'  WHEN (UC.user_role='3' || UC.user_role='7') THEN 'Tenant' END) as user_role_text,UC.create_type,UC.first_name,UC.last_name,UC.company_name, UC.email,UC.contact_no,UC.city_id,UC.state_id, C.city, S.state_name,UC.postal_code, UC.website_url,UC.linkedin_url,UC.whatsapp_no,UC.address_line1, UC.street, UC.work_phone , UC.apt_floor_unit, UC.favourite,UC.address_line2,CONCAT('[',GROUP_CONCAT(distinct CT.`listing_type_id`),']') as listing_type , GROUP_CONCAT(distinct LTM.`group`) as listing_group , GROUP_CONCAT(distinct CG.`id`) as geo_location ";

        let select = "SELECT UC.id,UC.user_id,UC.user_role,(CASE WHEN (UC.user_role='1' || UC.user_role='5') THEN 'Broker' WHEN (UC.user_role='2' || UC.user_role='6') THEN 'Principal'  WHEN (UC.user_role='3' || UC.user_role='7') THEN 'Tenant' END) as user_role_text,UC.create_type,UC.first_name,UC.last_name,UC.company_name, UC.email,IFNULL(UC.contact_no,'') AS contact_no,UC.city_id,UC.state_id, C.city, D.storage_location AS contact_image, S.state_name,UC.postal_code, UC.website_url,UC.linkedin_url,UC.whatsapp_no,UC.address_line1, UC.street, IFNULL(UC.work_phone ,'') AS work_phone, UC.apt_floor_unit, UC.favourite,UC.address_line2,CONCAT('[',GROUP_CONCAT(distinct CT.`listing_type_id`),']') as listing_type , GROUP_CONCAT(distinct LTM.`group`) as listing_group , GROUP_CONCAT(distinct CG.`id`) as geo_location ";


        let joinsAndCondition = " FROM user_contact AS UC  LEFT JOIN contact_preference_listing_type as CT ON UC.id = CT.contact_id  and CT.row_status = '1' LEFT JOIN contact_preference_geolocation as CG ON UC.id = CG.contact_id LEFT JOIN cities as C ON C.id =  UC.city_id LEFT JOIN states as S ON S.id = UC.state_id LEFT JOIN listing_types_master as LTM ON LTM.id = CT.`listing_type_id` LEFT JOIN document AS D ON D.id = UC.document_id  WHERE UC.row_status='1' ";

        let sql = "";
        let havingQuery = "";
        let orderBy = " ";
        let countSelectQuery = " Select COUNT(0) as total_records ";
        const offset = parseInt(param.offset) ? parseInt(param.offset) : OFFSET;
        const start = (parseInt(param.start) ? parseInt(param.start) : 0 || 0) * offset;

        if (param.user && param.user.id) {
            joinsAndCondition += "   AND  UC.user_id=" + mysql.escape(param.user.id) + "";
        }

        if (param.user_role && param.user_role.length) {
            joinsAndCondition += "   AND  UC.user_role in (" + param.user_role.join(", ") + ") ";
        }
        // get contact which are set as favourite
        if (param.favourite) {
            joinsAndCondition += " AND UC.favourite = '1' ";
        }

        if (param.listing_type && param.listing_type.length) {
            joinsAndCondition += " AND  CT.listing_type_id in (" + param.listing_type.join(", ") + " )";
        }
        //if geolocation filter is added
        if (param.geo_location && Object.keys(param.geo_location).length !== 0) {
            select += `, (
                    3959 * acos (
                      cos ( radians(${param.geo_location.latitude}) )
                      * cos( radians( latitude ) )
                      * cos( radians( longitude ) - radians(${param.geo_location.longitude}) )
                      + sin ( radians(${param.geo_location.latitude}) )
                      * sin( radians( latitude ) )
                    )
                  ) AS distance `;
            countSelectQuery += `, (
                3959 * acos (
                  cos ( radians(${param.geo_location.latitude}) )
                  * cos( radians( latitude ) )
                  * cos( radians( longitude ) - radians(${param.geo_location.longitude}) )
                  + sin ( radians(${param.geo_location.latitude}) )
                  * sin( radians( latitude ) )
                )
              ) AS  distance `;
            havingQuery += " HAVING distance < " + param.geo_location.range;
        }

        if (param.contact_id) {

            joinsAndCondition += "   AND  UC.id=" + mysql.escape(param.contact_id) + "";
        }
        joinsAndCondition += " GROUP BY UC.id  ";

        if (param.sort_on) {
            if (!param.sort_order) {
                param.sort_order = "ASC";
            }
            orderBy += " order by if(" + param.sort_on + " = '' OR " + param.sort_on + " IS NULL, 1,0)," + param.sort_on + " " + param.sort_order;

        } else if (param.sort_by) {
            if (param.sort_by != "first_name,last_name" && param.sort_by != "last_name,first_name") {
                orderBy += " order by if(" + param.sort_by + " = '' OR " + param.sort_by + " IS NULL, 1,0)," + param.sort_by;
            } else {
                orderBy += " order by " + param.sort_by;
            }
        }

        //pagination logic 
        const count_sql = countSelectQuery + joinsAndCondition + " " + havingQuery;
        let res_count = await utilityModel.execute(count_sql);
        let total_records = res_count.length;

        logger.debug("total_records " + total_records);
        sql += select + joinsAndCondition + havingQuery + orderBy + "  limit " + start + " ," + offset;
        logger.debug("getContact query" + sql);
        return new Promise((resolve, reject) => {
            sqlConnection.query(sql, (err, result) => {
                if (err) {
                    logger.error(`ContactModel  : getContact :: error ${err} `);
                    reject(err);
                } else if (result) {
                    //if geolocation filter is added
                    if ((param.contact_id) || (param.geo_location && Object.keys(param.geo_location).length !== 0)) {
                        let promiseArr = [];
                        result.map((record) => {
                            promiseArr.push(this.getObjectWithGeolocationPreferences(record, get_search_records, null, null, null, false));
                        })
                        Promise.all(promiseArr)
                            .then((result) => {
                                let data = {
                                    total_records: total_records,
                                    fetched_records: result.length,
                                    result: result
                                };
                                resolve(data);
                            });
                    } else {
                        //send data
                        let data = {
                            total_records: total_records,
                            fetched_records: result.length,
                            result: result
                        };
                        resolve(data);
                    }
                }
            });
        });
    }


    getObjectWithGeolocationPreferences = async (record, get_search_records = null, listing_category = null, size = null, from = null, isDeals = true) => {
        return new Promise(async (resolve, reject) => {

            let geolocation_pref = null;

            try {
                if (record.geo_location) {
                    geolocation_pref = await this.getContactGeolocationPreference(record.geo_location);
                }
                record["geo_location"] = geolocation_pref;
                //deals operation
                if (isDeals) {
                    let filters = []
                    let type = JSON.parse(record.listing_type)
                    let result_type = "listing_count";
                    if (get_search_records) {
                        result_type = "listing_record"
                    }
                    if (record["geo_location"] || record["listing_type"]) {
                        if (record["geo_location"] && record["geo_location"].length > 0) {

                            record["geo_location"].forEach(element => {
                                filters.push({
                                    range: element.range,
                                    lat: element.latitude,
                                    lng: element.longitude
                                });
                            });
                        }
                        if (record["geo_location"] || record["listing_type"]) {
                            if (record["geo_location"] && record["geo_location"].length > 0) {

                                record["geo_location"].forEach(element => {
                                    filters.push({
                                        range: element.range,
                                        lat: element.latitude,
                                        lng: element.longitude
                                    });
                                });
                            }

                            const listings_location = await elasticSearchController.searchListingsByLocation({
                                filters,
                                type,
                                result_type,
                                listing_category,
                                size,
                                from
                            });
                            if (get_search_records) {
                                record["deals"] = listings_location
                            } else {
                                let deals_count = 0;
                                let dealsCountArr = [];
                                if (listings_location) {
                                    deals_count = parseInt(listings_location.result.count)
                                }
                                //record["deals"] = deals_count;
                                record["deals"] = {
                                    id: record["id"],
                                    deals_count: deals_count
                                };
                            }

                        }
                    } else {
                        record["deals"] = {
                            fetched_records: 0,
                            result: [],
                            total_records: 0
                        };
                    }

                }

                resolve(record);

            } catch (err) {
                logger.error(`ContactModel  : getObjectWithGeolocationPreferences ::  ${err} `);
                resolve(reject);
            }

        });

    }

    deleteContact = async (param) => {

        logger.info("ContactModel : deleteContact ");

        return new Promise((resolve, reject) => {

            const data = {
                row_status: "0"
            };

            const whereclause = param.id;
            const sql = mysql.format("UPDATE user_contact SET ? WHERE id IN (?)", [data, whereclause]);
            logger.debug(sql);

            try {
                const result = utilityModel.execute(sql);
                resolve(result);
            } catch (err) {
                logger.error(`ContactModel  : deleteContact ::  ${err} `);
                resolve(reject);
            }

        });

    }

    updateContactFavourite = async (params) => {

        logger.info("ContactModel : updateContactFavourite ");

        return new Promise(async (resolve, reject) => {

            logger.info("UserModel : updateContactFavourite");
            let jsonContact = params.contact;
            logger.info(jsonContact);

            let queries = "";
            if (jsonContact && jsonContact.length > 0) {
                jsonContact.forEach((contact) => {

                    let contactIds = contact.id.join();

                    queries += mysql.format("UPDATE user_contact SET favourite = " + mysql.escape(contact.favourite) + " WHERE id IN(" + contactIds + ");");

                });
            }


            logger.debug("queries :: " + queries);
            try {
                let result = await utilityModel.execute(queries);
                resolve(result);
            } catch (err) {
                logger.error(`ContactModel  : updateContactFavourite :: error ${err} `);
                resolve(reject);
            }

        });

    }

    deleteGeolocationPreference = (params) => {
        logger.info("ContactModel : deleteGeolocationPreference " + params);
        return new Promise(async (resolve, reject) => {
            let data = {
                row_status: "0"
            };
            try {

                let whereclause = params.preference_id;
                let sql = mysql.format("update contact_preference_geolocation set ? WHERE id IN (?)", [data, whereclause]);
                let result = await utilityModel.execute(sql);
                resolve(result);

            } catch (err) {
                logger.error(`ContactModel  : deleteGeolocationPreference :: error ${JSON.stringify(err)} `);
                reject({
                    message: "Something went wrong !!"
                });
            }
        });
    }

    getDealsForContact = (params) => {
        logger.info("ContactModel : getDealsForContact ");
        return new Promise(async (resolve, reject) => {
            try {
                let deals = {};
                let promiseArr = [];
                let listingInfoFlag = true;
                if (params.deals_count) {
                    listingInfoFlag = false;
                }

                let sql = `SELECT UC.id,CONCAT('[',GROUP_CONCAT(distinct CT.listing_type_id),']') as listing_type,
                GROUP_CONCAT( CG.id) as geo_location 
                FROM user_contact AS UC  LEFT JOIN contact_preference_listing_type as CT ON UC.id = CT.contact_id  and CT.row_status = '1' LEFT JOIN contact_preference_geolocation as CG ON UC.id = CG.contact_id
                WHERE CT.row_status = '1' `;

                if (params.contact_id) {
                    sql += ` AND UC.id in (` + params.contact_id.join(",") + `)`;
                }

                sql += " Group by UC.id";
                const geolocationPreferenceIds = await utilityModel.execute(sql);
                if (geolocationPreferenceIds && geolocationPreferenceIds.length > 0) {
                    geolocationPreferenceIds.forEach((record) => {
                        promiseArr.push(this.getObjectWithGeolocationPreferences(record, listingInfoFlag, params.listing_category, params.size, params.from));
                    })
                    Promise.all(promiseArr)
                        .then((dealsLoc) => {
                            let arr = [];
                            dealsLoc.forEach((obj) => {
                                arr.push(obj.deals);
                            })
                            deals["deals"] = arr;

                            resolve(deals);
                        })

                } else {
                    resolve({
                        "deals": [{
                            "fetched_records": 0,
                            "result": [],
                            "total_records": 0
                        }]
                    });
                }

            } catch (err) {
                logger.error(`ContactModel  : getDealsForContact :: error ${JSON.stringify(err)} `);
                reject({
                    message: "Something went wrong !!"
                });
            }
        });
    }

    getRecommendedListingForContact = (params) => {

        logger.info("ContactModel : getRecommendedListingForContact ");
        return new Promise(async (resolve, reject) => {

            try {

                let sql = "SELECT `listing_id` FROM listing_recommendation WHERE contact_id = " + mysql.escape(params.contact_id) + " AND row_status = '1' AND user_id = " + mysql.escape(params.user.id) + " AND listing_id IN (" + params.listing_ids.join(",") + ") ";
                let result = await utilityModel.execute(sql);
                result = result.map((item) => item.listing_id);
                resolve(result);

            } catch (err) {
                logger.error(`ContactModel  : deleteGeolocationPreference :: error ${JSON.stringify(err)} `);
                reject({
                    message: "Something went wrong !!"
                });
            }
        });
    }

    contactBelongsToUser = (params) => {

        logger.info("ContactModel : contactBelongsToUser ");
        return new Promise(async (resolve, reject) => {
            try {
                let sql = "SELECT `id` FROM user_contact WHERE id IN(" + params.contact_id.join(",")+") AND row_status = '1' AND user_id = " + mysql.escape(params.user_id)+" ";
                console.log("sqlsqlsqlsqlsqlsqlsql======"+sql);
                let result = await utilityModel.execute(sql);
                result = result.map((item) => item.listing_id);

                resolve(result);

            } catch (err) {
                logger.error(`ContactModel  : deleteGeolocationPreference :: error ${err} `);
                reject({
                    message: "Something went wrong !!"
                });
            }
        });
    }

}




export default new ContactModel();