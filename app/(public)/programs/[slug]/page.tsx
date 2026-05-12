import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";

import { ProgramDetailView } from "@/components/programs/ProgramDetailView";
import { getProgramBySlug } from "@/lib/data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program) {
    return {
      title: "Program",
    };
  }

  return {
    title: `${program.title} | Program`,
    description: program.description || "Program details and registration.",
  };
}

export default async function ProgramDetailPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program || program.status === "draft") {
    notFound();
  }

  return <ProgramDetailView program={program} />;
}
