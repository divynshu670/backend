import express from "express";
import * as ctrl from "./controller.js";

const router = express.Router();

router.get("/", ctrl.list);
router.get("/:id", ctrl.get);

export default router;
