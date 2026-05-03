import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const alt = 'Realtor Wisdom — public deal profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: deal } = await supabase
    .from('deals')
    .select('name, city, state, total_cost, real_impact_score, ami_targeting, unit_count')
    .eq('id', params.id)
    .eq('is_public', true)
    .single();

  const dealName = deal?.name ?? 'Deal profile';
  const location = deal ? [deal.city, deal.state].filter(Boolean).join(', ') : '';
  const totalCost = deal?.total_cost
    ? `$${(deal.total_cost / 1_000_000).toFixed(1)}M`
    : '—';
  const ris = deal?.real_impact_score ?? 0;
  const subtitle = [
    deal?.unit_count ? `${deal.unit_count} units` : null,
    deal?.ami_targeting,
  ]
    .filter(Boolean)
    .join(' · ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0F1A14',
          color: '#F7F6F2',
          padding: 80,
          fontFamily: 'serif',
        }}
      >
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#1D9E75',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: 'white',
              fontStyle: 'italic',
              fontWeight: 700,
            }}
          >
            W
          </div>
          <div style={{ fontSize: 28, fontWeight: 400, display: 'flex' }}>
            Realtor{' '}
            <span style={{ color: '#1D9E75', fontStyle: 'italic', marginLeft: 10 }}>Wisdom</span>
          </div>
        </div>

        {/* Deal name */}
        <div style={{ fontSize: 72, lineHeight: 1.05, marginBottom: 16, fontWeight: 400 }}>
          {dealName}
        </div>

        {/* Location + subtitle */}
        <div style={{ fontSize: 28, color: '#6B6B65', marginBottom: 'auto', display: 'flex' }}>
          {location}
          {subtitle ? `  ·  ${subtitle}` : ''}
        </div>

        {/* Bottom stats row */}
        <div
          style={{
            display: 'flex',
            gap: 60,
            paddingTop: 36,
            borderTop: '1px solid rgba(247,246,242,0.15)',
          }}
        >
          <Stat label="Capital goal" value={totalCost} accent="#F7F6F2" />
          <Stat
            label="Real Impact Score"
            value={String(ris)}
            accent={ris >= 80 ? '#1D9E75' : ris >= 60 ? '#EF9F27' : '#E24B4A'}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, color: '#6B6B65', textTransform: 'uppercase', letterSpacing: 2 }}>
              Live deal profile
            </div>
            <div style={{ fontSize: 22, color: '#1D9E75', marginTop: 6 }}>realtorwisdom.io</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: 18,
          color: '#6B6B65',
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 400, color: accent, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
