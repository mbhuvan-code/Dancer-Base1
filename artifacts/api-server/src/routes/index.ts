import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import classesRouter from "./classes";
import bookingsRouter from "./bookings";
import savedRouter from "./saved";
import feedRouter from "./feed";
import friendsRouter from "./friends";
import instructorsRouter from "./instructors";
import studiosRouter from "./studios";
import pastClassesRouter from "./pastClasses";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(classesRouter);
router.use(bookingsRouter);
router.use(savedRouter);
router.use(feedRouter);
router.use(friendsRouter);
router.use(instructorsRouter);
router.use(studiosRouter);
router.use(pastClassesRouter);

export default router;
