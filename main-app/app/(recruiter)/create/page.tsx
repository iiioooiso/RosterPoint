import { getOpenings } from "@/app/actions/openings";
import { CreatePageClient } from "./_components/CreatePageClient";

export const metadata = {
  title: "Manage Openings",
};

export default async function CreateOpeningPage() {
  const openings = await getOpenings();

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
      <CreatePageClient initialOpenings={openings} />
    </div>
  );
}
