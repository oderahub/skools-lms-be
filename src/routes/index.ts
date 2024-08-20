import express from "express";
import { singleDownload } from "../controller/admin";
import { checkCourseAvailability } from "../controller/courses";
const router = express.Router();

/* GET home page. */
router.post("/", function (req, res) {
  res.send("I am connected to the PostgresSql database succefully");
});

router.get("/download-pdf/:id", singleDownload);

//Route to check course availability
router.post("/check-availability", checkCourseAvailability);

export default router;
