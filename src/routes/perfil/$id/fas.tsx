import { createFileRoute } from "@tanstack/react-router";
import { ProfileChrome } from "@/components/social/chrome";
import { FansPanel } from "@/components/social/panels";

export const Route = createFileRoute("/perfil/$id/fas")({
  component: FasPage,
});

function FasPage() {
  const { id } = Route.useParams();
  return (
    <ProfileChrome id={id} section="fas">
      <FansPanel id={id} />
    </ProfileChrome>
  );
}
