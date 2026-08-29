import { redirect } from "next/navigation";

// Preserve old bookmarks while keeping the inbox inside the workspace.
export default function NotificationsPage() {
  redirect("/dashboard?notifications=open");
}
