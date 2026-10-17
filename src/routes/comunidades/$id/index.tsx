import { createFileRoute } from "@tanstack/react-router";
import { CommunityPanel } from "@/components/social/panels";

export const Route = createFileRoute("/comunidades/$id/")({
  component: CommunityPage,
});

function CommunityPage() {
  const { id } = Route.useParams();
  return <CommunityPanel id={id} />;
}
