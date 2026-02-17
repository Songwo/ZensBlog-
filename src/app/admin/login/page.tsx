import { redirect } from "next/navigation";

export default function AdminLoginRedirect() {
  redirect("/auth/signin?callbackUrl=/admin");
}

