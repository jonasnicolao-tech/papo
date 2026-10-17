import { createFileRoute } from "@tanstack/react-router";
import { ThreadPanel } from "@/components/social/panels";

export const Route = createFileRoute("/mensagens/$id")({
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  return <ThreadPanel id={id} />;
}
