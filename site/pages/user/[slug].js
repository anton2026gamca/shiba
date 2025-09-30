import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter();
  return <p>User: {router.query.slug}</p>;
}
