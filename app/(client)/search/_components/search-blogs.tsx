import Image from "next/image";
import Link from "next/link";

import { blogHref, type SearchBlogHit } from "@/lib/mart-api/search";

export function SearchBlogs({ posts, total }: { posts: SearchBlogHit[]; total: number }) {
  return (
    <section aria-labelledby="search-blogs">
      <h2 id="search-blogs" className="mb-3 text-base font-semibold">
        ব্লগ ({total.toLocaleString("en-US")})
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={blogHref(post.slug)}
              className="group flex h-full gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 transition-colors hover:border-primary/40"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[#f5f6f8]">
                {post.coverImage ? (
                  <Image src={post.coverImage} alt={post.coverAlt} fill sizes="80px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">{post.title}</h3>
                {post.excerpt ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">{post.excerpt}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-neutral-500">
                  {[post.publishedAt, post.readTime].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
