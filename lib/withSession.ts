import { IronSessionOptions } from "iron-session";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiHandler,
  NextApiRequest,
  NextApiResponse,
} from "next";
import nextConnect, { NextConnect } from "next-connect";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      isAdmin?: boolean;
    };
  }
}

const DISABLE_AUTH = false;

const sessionOptions: IronSessionOptions = {
  password: process.env.TOKEN_SECRET || "default password to allow docker builds to work",
  cookieName: "next-iron-session",
  ttl: 0,
};

export const withSessionRoute = (handler: NextApiHandler): NextApiHandler => {
  return withIronSessionApiRoute(handler, sessionOptions);
};

export const defaultWithSessionRoute = (handler: NextApiHandler): NextApiHandler => {
  return withSessionRoute(async (req, res) => {
    if (!req.session.user && !DISABLE_AUTH) return res.status(401).end();
    await handler(req, res);
  });
};

function withSessionSsr<P extends { [key: string]: unknown } = { [key: string]: unknown }>(
  handler: (context: GetServerSidePropsContext) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return withIronSessionSsr(handler, sessionOptions);
}

export const defaultServerSidePropsAuth = withSessionSsr(async ({ req }) => {
  const user = req.session.user;

  if (user === undefined && !DISABLE_AUTH) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: 0,
    },
  };
});

export const createAuthedApiRoute = (): NextConnect<NextApiRequest, NextApiResponse> => {
  return nextConnect({
    onNoMatch(req, res) {
      res.status(405).send(`Method '${req.method}' Not Allowed`);
    },
  });
};
