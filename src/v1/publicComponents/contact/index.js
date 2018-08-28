import express from "express";
 
import contactController from "./controller/contact.controller";
import contactValidation from "./validator/contact.validator";
 
const router = express.Router();
 
router.post("/", contactController.insert);

export default router;