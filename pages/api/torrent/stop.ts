import { createAuthedApiRoute } from "../../../lib/withSession";
import { logger } from "../../../src/Instances";
import { tc } from "../../../src/Instances";

const router = createAuthedApiRoute();

router.post((req, res) => {
  tc.torrents.forEach((torrent) => {
    if (torrent.magnetURI == req.body.magnet) {
      logger.info(`${torrent.name} download cancelled`);
      torrent.destroy({ destroyStore: true });
    }
  });
  res.status(303).redirect("/torrent");
});

export default router;
