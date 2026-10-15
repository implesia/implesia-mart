import Image from "next/image";

import type { AboutStory } from "@/lib/mart-api/about-stories";
import { cn } from "@/lib/utils";

import { AboutSection, CtaLink, Prose, SectionHeader, firstImage } from "./about-ui";

export function BrandStory({ stories }: { stories: AboutStory[] }) {
  const visible = stories.filter((story) => story.isActive);
  if (!visible.length) return null;
  return (
    <>
      {visible.map((story, index) => (
        <StoryBlock key={story.id} story={story} flip={index % 2 === 1} />
      ))}
    </>
  );
}

function StoryBlock({ story, flip }: { story: AboutStory; flip: boolean }) {
  const paragraphs = story.paragraphs.filter((item) => item.text.trim());
  const image = firstImage(story.images);
  const label = story.cta.label.trim();
  const href = story.cta.href.trim();
  const headingId = `about-story-${story.id}`;

  return (
    <AboutSection tone="white" labelledBy={story.title ? headingId : undefined}>
      <div className={cn("grid items-center gap-8 lg:gap-16", image && "md:grid-cols-2")}>
        <div className={cn(flip && image && "md:order-2")}>
          <SectionHeader id={headingId} kicker={story.kicker} title={story.title} />
          {paragraphs.length ? (
            <Prose className="mt-5">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.id}>{paragraph.text}</p>
              ))}
            </Prose>
          ) : null}
          {label && href ? (
            <div className="mt-8">
              <CtaLink href={href} label={label} />
            </div>
          ) : null}
        </div>
        {image ? (
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-neutral-100 md:aspect-square lg:aspect-[4/3]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 92vw, 46vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </AboutSection>
  );
}
