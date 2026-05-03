import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://realtorwisdom.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages — public marketing surfaces
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Public deal profiles — discoverable
  // We dynamically pull these from Supabase. Use anon access so this runs without auth.
  let publicDeals: MetadataRoute.Sitemap = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && anonKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/deals?select=id,updated_at&is_public=eq.true`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          next: { revalidate: 3600 },
        }
      );
      if (res.ok) {
        const deals = (await res.json()) as { id: string; updated_at: string }[];
        publicDeals = deals.map((d) => ({
          url: `${BASE_URL}/deals/${d.id}/public`,
          lastModified: new Date(d.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
      }
    }
  } catch {
    // If Supabase is down at sitemap-build time, just return static pages.
  }

  return [...staticPages, ...publicDeals];
}
