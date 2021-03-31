import { withIronSession } from "next-iron-session";
import type { NextApiRequest, NextApiResponse } from "next";

type Handler = (req: NextApiRequest & { session: any }, res: NextApiResponse) => any;

export default function withSession(handler: Handler) {
  return withIronSession(handler, {
    password: process.env.TOKEN_SECRET,
    cookieName: "next-iron-session",
    cookieOptions: {
      secure: false,
    },
  });
}
