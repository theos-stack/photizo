import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";

import { ProgramDetailView } from "@/components/programs/ProgramDetailView";
import { getProgramBySlug } from "@/lib/data";
import { siteConfig } from "@/lib/site";

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
    openGraph: {
      title: program.title,
      description: program.description || "Program details and registration.",
      type: "article",
      url: `${siteConfig.siteUrl}/programs/${program.slug}`,
      images: program.flyer_url
        ? [
            {
              url: program.flyer_url,
              alt: program.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: program.flyer_url ? "summary_large_image" : "summary",
      title: program.title,
      description: program.description || "Program details and registration.",
      images: program.flyer_url ? [program.flyer_url] : undefined,
    },
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
