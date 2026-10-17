import { createFileRoute } from "@tanstack/react-router";
import { ProfileChrome } from "@/components/social/chrome";
import { AboutPanel } from "@/components/social/panels";

export const Route = createFileRoute("/perfil/$id/sobre")({
  component: SobrePage,
});

function SobrePage() {
  const { id } = Route.useParams();
  return (
    <ProfileChrome id={id} section="sobre">
      <AboutPanel id={id} />
    </ProfileChrome>
  );
}
