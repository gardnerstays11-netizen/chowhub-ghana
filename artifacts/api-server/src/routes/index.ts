import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import listingsRouter from "./listings";
import menuRouter from "./menu";
import reviewsRouter from "./reviews";
import reservationsRouter from "./reservations";
import ordersRouter from "./orders";
import savedRouter from "./saved";
import vendorRouter from "./vendor";
import adminRouter from "./admin";
import searchLogsRouter from "./search-logs";
import partnersRouter from "./partners";
import storageRouter from "./storage";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(listingsRouter);
router.use(menuRouter);
router.use(reviewsRouter);
router.use(reservationsRouter);
router.use(ordersRouter);
router.use(savedRouter);
router.use(vendorRouter);
router.use(adminRouter);
router.use(searchLogsRouter);
router.use(partnersRouter);
router.use(storageRouter);
router.use(eventsRouter);

export default router;
