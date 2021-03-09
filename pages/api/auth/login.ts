import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export default async function login(req: Request, res: Response) {
  if (req.method != "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  // security theater
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (req.body.password == process.env.ACCESS_CODE) {
    const token = jwt.sign(process.env.ACCESS_CODE, process.env.TOKEN_SECRET);
    res.cookie("jwt", token, { sameSite: "strict", maxAge: 20 * 24 * 60 * 60 * 1000 });
    res.send({ status: "accepted" });
  } else {
    res.send({ status: "rejected" });
  }
}
