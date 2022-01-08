import { withSessionRoute } from "../../../lib/withSession";

export default withSessionRoute(async (req, res) => {
  if (req.method != "POST") res.status(405).end();
  if (!req.body.password) res.status(400).end();

  // security theater
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (req.body.password === process.env.ACCESS_CODE) {
    const user = { isAdmin: true };
    req.session.user = user;
    await req.session.save();
    res.send({ status: "accepted" });
  } else {
    res.send({ status: "rejected" });
  }
});
