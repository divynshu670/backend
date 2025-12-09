import express from "express";
import * as ctrl from "./controller.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireAdmin } from "../../common/middleware/role.js";

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
