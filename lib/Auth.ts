import { GetServerSideProps } from "next";
import withSession from "../lib/session";

// @ts-ignore
export const defaultAuth: GetServerSideProps = withSession(async ({ req, res }) => {
  const user = req.session.get("user");

  if (user === undefined) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: { user: req.session.get("user") },
  };
});
