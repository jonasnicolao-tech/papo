import { createFileRoute } from "@tanstack/react-router";
import { InboxPanel } from "@/components/social/panels";

export const Route = createFileRoute("/mensagens/")({
  component: InboxPage,
});

function InboxPage() {
  return <InboxPanel />;
}
