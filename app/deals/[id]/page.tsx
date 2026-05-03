import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import DealRoom from './DealRoom';

export const dynamic = 'force-dynamic';

export default async function DealRoomPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const dealId = params.id;

  // Fetch deal + all related data in parallel
  const [
    { data: deal, error: dealErr },
    { data: capitalSources },
    { data: checklist },
    { data: milestones },
    { data: stakeholders },
    { data: activity },
  ] = await Promise.all([
    supabase.from('deals').select('*').eq('id', dealId).single(),
    supabase.from('capital_sources').select('*').eq('deal_id', dealId).order('sort_order'),
    supabase.from('checklist_items').select('*').eq('deal_id', dealId).order('sort_order'),
    supabase.from('milestones').select('*').eq('deal_id', dealId).order('sort_order'),
    supabase.from('deal_stakeholders').select('*').eq('deal_id', dealId),
    supabase.from('activity_log').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }).limit(20),
  ]);

  if (dealErr || !deal) notFound();

  return (
    <DealRoom
      deal={deal}
      capitalSources={capitalSources ?? []}
      checklist={checklist ?? []}
      milestones={milestones ?? []}
      stakeholders={stakeholders ?? []}
      activity={activity ?? []}
      userEmail={user.email!}
    />
  );
}
