import express from "express";
import * as ctrl from "./controller.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", ctrl.getCart);
router.post("/", ctrl.addOrUpdate);
router.put("/:id", ctrl.updateQuantity);
router.delete("/:id", ctrl.remove);

export default router;
