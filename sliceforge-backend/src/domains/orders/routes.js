import express from "express";
import { authMiddleware } from "../../common/middleware/auth.js";
import * as ctrl from "./controller.js";

const router = express.Router();

router.post("/", authMiddleware, ctrl.create);

export default router;
