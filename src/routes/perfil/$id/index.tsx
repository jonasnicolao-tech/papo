import { createFileRoute } from "@tanstack/react-router";
import { ProfileChrome } from "@/components/social/chrome";
import { ScrapsPanel } from "@/components/social/panels";

export const Route = createFileRoute("/perfil/$id/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  return (
    <ProfileChrome id={id} section="recados">
      <ScrapsPanel id={id} />
    </ProfileChrome>
  );
}
