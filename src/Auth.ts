import { GetServerSideProps } from "next";
import { NextApiRequestCookies } from "next/dist/next-server/server/api-utils";
import jwt from "jsonwebtoken";

export function auth(cookies: NextApiRequestCookies): boolean {
  try {
    if (jwt.verify(cookies.jwt, process.env.TOKEN_SECRET) == process.env.ACCESS_CODE) {
      return true;
    }
  } catch {}
  return false;
}

export const defaultAuth: GetServerSideProps = async (context) => {
  if (!auth(context.req.cookies)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  } else {
    return { props: {} };
  }
};
