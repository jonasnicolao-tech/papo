import { MessengerApp } from "@/components/messenger/app";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <MessengerApp />;
}
