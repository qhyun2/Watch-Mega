import { defaultWithSessionRoute } from "../../../lib/withSession";

export default defaultWithSessionRoute(async (req, res) => {
  const user = req.session.user;
  if (user) {
    res.json({
      isLoggedIn: true,
      ...user,
    });
  } else {
    res.json({
      isLoggedIn: false,
    });
  }
});
