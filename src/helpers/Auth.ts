import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export function auth(req: Request, res: Response, next): void {
  try {
    if (jwt.verify(req.cookies.jwt, process.env.TOKEN_SECRET) == process.env.ACCESS_CODE) {
      next();
      return;
    }
  } catch {
    return res.redirect("/login");
  }
  return res.redirect("/login");
}

export async function login(req: Request, res: Response) {
  // security theater
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (req.body.password == process.env.ACCESS_CODE) {
    const token = createJWT();
    res.cookie("jwt", token, { sameSite: "strict" });
    res.send({ status: "accepted" });
  } else {
    res.send({ status: "rejected" });
  }
}

export function createJWT(): string {
  return jwt.sign(process.env.ACCESS_CODE, process.env.TOKEN_SECRET);
}
