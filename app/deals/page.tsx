import { redirect } from 'next/navigation';

// /deals on its own redirects to the dashboard, which IS the deals list.
// Keeping this as a redirect avoids a dead "Coming soon" page.
export default function DealsIndex() {
  redirect('/dashboard');
}
