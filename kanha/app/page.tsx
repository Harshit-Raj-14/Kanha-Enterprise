import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login"); // Automatically redirect to login page
}
