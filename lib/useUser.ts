import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

export default function useUser() {
  const { data: user, mutate: mutateUser } = useSWR("/api/auth/user");
  const router = useRouter();

  useEffect(() => {
    // wait for data to be fetched
    if (!user) return;

    if (!user.isLoggedIn) {
      router.push("/login");
    }
  }, [user]);

  return { user, mutateUser };
}
