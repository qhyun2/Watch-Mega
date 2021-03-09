import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export function auth(req: Request, res: Response): void {
  try {
    if (jwt.verify(req.cookies.jwt, process.env.TOKEN_SECRET) == process.env.ACCESS_CODE) {
      return;
    }
  } catch {
    return res.redirect("/login");
  }
  return res.redirect("/login");
}
