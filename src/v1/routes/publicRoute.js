import express from "express";
import contact from "../publicComponents/contact";

const router = express.Router();

router.use("/contact", contact);

export default router;

