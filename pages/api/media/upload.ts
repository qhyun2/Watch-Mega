import { createAuthedApiRoute } from "../../../lib/withSession";
import multer from "multer";

const router = createAuthedApiRoute();
const upload = multer({
  storage: multer.diskStorage({
    destination: "./data",
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});
router.use(upload.array("main"));
router.post((req, res) => {
  res.status(200).json({ data: "success" });
});

export default router;

export const config = {
  api: {
    bodyParser: false,
  },
};
