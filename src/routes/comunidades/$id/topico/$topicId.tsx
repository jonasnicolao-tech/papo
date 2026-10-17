import { createFileRoute } from "@tanstack/react-router";
import { TopicPanel } from "@/components/social/panels";

export const Route = createFileRoute("/comunidades/$id/topico/$topicId")({
  component: TopicPage,
});

function TopicPage() {
  const { id, topicId } = Route.useParams();
  return <TopicPanel id={id} topicId={topicId} />;
}
