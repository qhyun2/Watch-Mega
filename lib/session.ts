import { withIronSession } from "next-iron-session";
import type { NextApiRequest, NextApiResponse } from "next";

type Handler = (req: NextApiRequest & { session: any }, res: NextApiResponse) => any;

export default function withSession(handler: Handler) {
  return withIronSession(handler, {
    password: process.env.TOKEN_SECRET || "default password to allow docker builds to work",
    cookieName: "next-iron-session",
    cookieOptions: {
      secure: false,
    },
  });
}
