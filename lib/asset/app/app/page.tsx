import { NextPage } from "next";
import Link from "next/link";

const page: NextPage = () => (
  <div className="bg-white w-screen h-screen mx-aut">
    The top page is not here. Go to{" "}
    <Link href="/subsystem" className="underline">
      /subsystem
    </Link>
    .
  </div>
);

export default page;
