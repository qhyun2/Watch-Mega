import dynamoDb from "../../../lib/AWS";
import withSession from "../../../lib/session";

export default withSession(async (req, res) => {
  if (!req.session.get("user")) return res.status(401).end();

  if (req.method === "GET") {
    const { Item } = await dynamoDb.get({
      Key: { id: "root" },
    });

    res.status(200).json(Item);
  } else if (req.method === "PUT") {
    await dynamoDb.put({
      Item: {
        id: "root",
        content: req.body,
      },
    });
    res.status(200).end();
  } else {
    res.status(405);
  }
});
