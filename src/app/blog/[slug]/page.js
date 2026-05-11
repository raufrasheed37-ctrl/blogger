import Link from "next/link";
import PostActions from "@/components/PostActions";
import CommentSection from "@/components/CommentSection";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";


  const posts = [
  {
      name: "Sarah Johnson",
      handle: "@sarahwrites",
      time: "2h ago",
      slug: "how-consistency-builds-online-income",
      title: "How Consistency Builds Online Income",
      category: "Business",
      likes: 128,
      comments: 24,
      text: "Consistency builds what motivation cannot. Real online income comes from showing up repeatedly and earning trust over time.",
      avatarClass: "from-emerald-400 to-teal-500",
    },
    {
      name: "Daniel Brooks",
      handle: "@danielmedia",
      time: "5h ago",
      slug: "sports-business-behind-modern-football",
      title: "The Sports Business Behind Modern Football",
      category: "Sports",
      likes: 214,
      comments: 39,
      text: "Modern football is now a billion-dollar business powered by branding and global media rights.",
      avatarClass: "from-orange-400 to-amber-500",
    },
    {
name: "Olivia Grant",
handle: "@oliviabuilds",
time: "1d ago",
slug: "why-small-brands-win-online",
title: "Why Small Brands Win Online",
category: "Business",
likes: 175,
comments: 28,
text: "Smaller brands move faster, connect deeper, and build stronger trust than large corporate systems.",
avatarClass: "from-purple-400 to-pink-500",
},
{
name: "Marcus Reed",
handle: "@sportsmind",
time: "1d ago",
slug: "athletes-as-global-brands",
title: "Athletes Are Becoming Global Brands",
category: "Sports",
likes: 245,
comments: 44,
text: "Athletes today are media companies, brand ambassadors, and business founders beyond the field.",
avatarClass: "from-orange-500 to-red-500",
},
{
name: "Lena Fox",
handle: "@entdaily",
time: "1d ago",
slug: "streaming-platforms-changing-hollywood",
title: "How Streaming Platforms Changed Hollywood",
category: "Entertainment",
likes: 201,
comments: 36,
text: "Streaming shifted power from traditional studios to audiences who now decide what survives.",
avatarClass: "from-cyan-500 to-indigo-500",
},
{
name: "Victor Hayes",
handle: "@startupfocus",
time: "1d ago",
slug: "startup-founders-and-focus",
title: "Startup Founders Need Focus, Not More Ideas",
category: "Startups",
likes: 149,
comments: 21,
text: "Most founders fail from distraction, not lack of ideas. Focus is the real competitive advantage.",
avatarClass: "from-violet-500 to-purple-600",
}, 

    {
name: "Ella Monroe",
handle: "@showbizdaily",
time: "2d ago",
slug: "celebrity-culture-and-digital-power",
title: "Celebrity Culture and Digital Power",
category: "Entertainment",
likes: 205,
comments: 35,
text: "Celebrities now compete with creators in real-time. Digital relevance moves faster than traditional fame.",
avatarClass: "from-cyan-600 to-blue-600",
},
{
name: "Nathan Cole",
handle: "@startupengine",
time: "2d ago",
slug: "launch-fast-learn-faster",
title: "Launch Fast, Learn Faster",
category: "Startups",
likes: 158,
comments: 23,
text: "Waiting for perfection kills momentum. Startups grow by testing reality, not planning forever.",
avatarClass: "from-violet-600 to-purple-700",
},
{
name: "Ariana West",
handle: "@techshift",
time: "2d ago",
slug: "automation-is-the-new-advantage",
title: "Automation Is the New Competitive Advantage",
category: "Technology",
likes: 295,
comments: 54,
text: "Teams that automate repetitive work create more time for strategy, creativity, and scale.",
avatarClass: "from-pink-600 to-rose-600",
},
{
name: "Leo Bennett",
handle: "@freelancewins",
time: "2d ago",
slug: "raising-prices-without-losing-clients",
title: "Raise Your Prices Without Losing Clients",
category: "Freelancing",
likes: 211,
comments: 32,
text: "Clients pay for confidence and outcomes, not just hours. Better positioning supports premium pricing.",
avatarClass: "from-yellow-600 to-orange-700",
},
    {
name: "Clara James",
handle: "@conversionlab",
time: "3d ago",
slug: "why-simple-offers-convert-more",
title: "Why Simple Offers Convert More",
category: "Marketing",
likes: 187,
comments: 25,
text: "Confused customers do not buy. Clear offers outperform clever but complicated messaging.",
avatarClass: "from-indigo-600 to-blue-700",
},
{
name: "David Stone",
handle: "@disciplinefirst",
time: "3d ago",
slug: "protecting-focus-in-a-distracted-world",
title: "Protecting Focus in a Distracted World",
category: "Personal Growth",
likes: 322,
comments: 66,
text: "Focus is now a business skill. Protecting attention protects performance and long-term growth.",
avatarClass: "from-lime-600 to-green-700",
},
{
name: "Julia Reyes",
handle: "@creatoreconomy",
time: "3d ago",
slug: "community-first-business-models",
title: "Community-First Business Models",
category: "Creator Economy",
likes: 230,
comments: 38,
text: "The strongest digital businesses begin with community. Revenue becomes stronger when trust comes first.",
avatarClass: "from-sky-600 to-cyan-700",
},
{
name: "Brandon Scott",
handle: "@zerofounder",
time: "3d ago",
slug: "solving-small-problems-for-big-profit",
title: "Solve Small Problems for Big Profit",
category: "Business",
likes: 248,
comments: 40,
text: "Massive companies often begin by solving one simple painful problem better than everyone else.",
avatarClass: "from-red-600 to-pink-700",
},  
    {
name: "Jordan Miles",
handle: "@freelanceflow",
time: "1d ago",
slug: "high-paying-clients-without-cold-dms",
title: "Finding High-Paying Clients Without Cold DMs",
category: "Freelancing",
likes: 196,
comments: 30,
text: "Positioning and authority attract better clients faster than random outreach ever will.",
avatarClass: "from-yellow-500 to-orange-600",
},
{
name: "Grace Allen",
handle: "@marketqueen",
time: "1d ago",
slug: "storytelling-sells-better-than-ads",
title: "Storytelling Sells Better Than Ads",
category: "Marketing",
likes: 183,
comments: 26,
text: "People ignore advertisements but remember stories. Narrative creates emotional conversion.",
avatarClass: "from-blue-500 to-indigo-600",
},
{
name: "Kevin Ross",
handle: "@growthmode",
time: "2d ago",
slug: "daily-systems-for-high-performance",
title: "Daily Systems for High Performance",
category: "Personal Growth",
likes: 310,
comments: 61,
text: "Peak performance is built by repeatable habits, not occasional motivation spikes.",
avatarClass: "from-lime-500 to-green-600",
},
{
name: "Isabella Cruz",
handle: "@creatorfuture",
time: "2d ago",
slug: "monetizing-trust-in-the-creator-economy",
title: "Monetizing Trust in the Creator Economy",
category: "Creator Economy",
likes: 223,
comments: 37,
text: "Trust converts faster than attention. Communities buy from creators they genuinely believe in.",
avatarClass: "from-sky-500 to-cyan-600",
},
{
name: "Ethan Blake",
handle: "@founderjournal",
time: "2d ago",
slug: "profitable-business-before-scaling",
title: "Build a Profitable Business Before Scaling",
category: "Business",
likes: 259,
comments: 42,
text: "Scaling a broken model only creates bigger problems. Profitability should come before expansion.",
avatarClass: "from-red-500 to-pink-600",
},
    {
name: "Nina Park",
handle: "@futuretech",
time: "1d ago",
slug: "future-of-remote-work-with-ai",
title: "The Future of Remote Work with AI",
category: "Technology",
likes: 288,
comments: 52,
text: "AI tools are changing productivity, hiring, and collaboration across global remote teams.",
avatarClass: "from-pink-500 to-rose-500",
}, 

{
  name: "Sophie Carter",
  handle: "@clientgrowth",
  time: "1d ago",
  slug: "building-client-trust-that-converts",
  title: "Building Client Trust That Converts",
  category: "Freelancing",
  likes: 207,
  comments: 34,
  text: "Clients buy confidence before they buy services. Trust is the fastest path to premium opportunities.",
  avatarClass: "from-amber-500 to-yellow-600",
},
];
    

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
} 

async function fetchPostFromBackend(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch post from backend:", error);
    return null;
  }
}

export default async function SinglePostPage({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams?.slug || ""); 

  let post = posts.find(
    (item) =>
      item.slug.trim().toLowerCase() ===
      slug.trim().toLowerCase()
  );

  if (!post) {
    post = await fetchPostFromBackend(slug);
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#090909] p-10 text-white">
        <h1>Post not found</h1>
      </main>
    );
  } 

  return (
  <main className="min-h-screen bg-[#090909] text-zinc-100 px-4 py-8">
    <div className="mx-auto max-w-3xl">

      {/* Back */}
      <Link
        href="/"
        className="text-sm text-zinc-400 transition hover:text-white"
      >
        ← Back to Home
      </Link>

      {/* Main Article */}
      <section className="mt-8">

        {/* Author Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-full bg-linear-to-br ${post.avatarClass}`}
            />

            <div>
              <h3 className="font-semibold text-white">
                {post.name}
              </h3>

              <p className="text-sm text-zinc-500">
                {post.handle} • {post.time}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <PostActions post={post} />
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-8 text-4xl font-bold leading-tight text-white">
          {post.title}
        </h1>

        {/* Article Content */}
        <div className="mt-8 space-y-6 text-[17px] leading-8 text-zinc-300">
          {post.content ? (
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            <p>{post.text}</p>
          )}

        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center gap-8 border-y border-white/10 py-5 text-sm text-zinc-400">
          <button className="transition hover:text-red-400">
            ♡ {post.likes}
          </button>

          <button className="transition hover:text-white">
            💬 {post.comments}
          </button>

          <button className="transition hover:text-white">
            ↻ 4
          </button>

          <button className="transition hover:text-white">
            ↗ Share
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-6 flex flex-wrap justify-between gap-4 border-b border-white/10 pb-6 text-sm text-zinc-500">
          <div>
            {post.likes} Likes • {post.comments} Replies • 4 Restacks
          </div>

          <div>
            Apr 27 at 7:26 PM
          </div>
        </div>

        {/* Comments (client) */}
        <div className="mt-8">
          <CommentSection postId={post.slug} />
        </div>

      </section>
    </div>
  </main>
);
    
  }
