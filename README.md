# ChangeProof

ChangeProof monitors public scholarship, hackathon and application pages for changes in deadlines, eligibility and required documents. Tavily Extract retrieves a page; NVIDIA Nemotron on Nebius Token Factory extracts facts with source quotes. The application verifies each quote against the extracted text, compares values deterministically and requests a second Nemotron analysis only when a value changes or an observation needs review. Before/after values come from the deterministic comparison, not from the model's impact summary.

**Status: implementation in progress; no live deployment or API connectivity has been verified yet.** Model availability, latency and Tavily extraction of the hosted fictional page must be checked with the actual accounts. The app uses a shared public workspace: anyone can read all monitors, contexts and reports. Never enter personal information, private URLs or secrets.

## Run locally

1. Install Node.js 20.9+ (a current Node LTS is recommended), then run `npm install`.
2. Create a Supabase project. Execute `supabase/schema.sql` once in its SQL editor. It creates the tables, indexes, RLS and transactional functions. The functions use the caller's privileges; the server uses the service role. Do not expose this key in the browser.
3. Copy `.env.example` to `.env.local` and supply `TAVILY_API_KEY`, `NEBIUS_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` (the Supabase project URL), and `SUPABASE_SERVICE_ROLE_KEY`. The default `NEBIUS_BASE_URL` and `NEBIUS_MODEL` are from Nebius's cookbook, but model access has **not** been verified for this account. Check availability with a real completion; if needed select another NVIDIA Nemotron model actually available on Nebius, and document it.
4. Run `npm run dev` and open http://localhost:3000. Add a public HTTPS URL, then click Check now to save a baseline. Check again after the per-monitor cooldown.
5. Run `npm run lint`, `npm test`, and `npm run build`.

## Deploy to Vercel

1. Push this repository to GitHub. Import it as a Next.js project in Vercel.
2. Create the Supabase schema as above and add all six variables from `.env.example` to Vercel's server environment. The `NEXT_PUBLIC_SUPABASE_URL` is public by naming convention; the service role and API keys must remain server-side.
3. Deploy. Ensure the project supports the check route's `maxDuration` of 120 seconds; check real Tavily plus Nebius latency within that limit. Use a faster available Nemotron model or shorter input if needed. The first successful check uses one inference, and a changed check uses two.
4. Open the public deployment and check a real public application page twice. Inspect server logs and provider dashboards for real Tavily and Nebius requests. Confirm Supabase persistence after refreshing, error behavior, and mobile layout.
5. Run the fictional demo below and verify Tavily can extract its deployed route. If it cannot, use a different publicly accessible test page and document the substitution; do not represent synthetic history as a real site's history.

No live URL is available yet.

## Fictional change demo

`/demo/scholarship` is a fictional public page with a November 5, 2026 deadline and a recommendation letter. Once deployed and with Supabase credentials in `.env.local`, run:

```sh
npm run seed:demo -- https://YOUR-DEPLOYED-APP
```

This inserts a clearly labeled **synthetic prior baseline** for that same URL: November 15 and no recommendation-letter requirement. It refuses to overwrite an existing snapshot. On the dashboard, select the demo monitor and click Check now: the check still fetches the deployed route through Tavily and calls Nebius. A missing document in the prior fact list is not proof of absence; its appearance is marked Needs review. The deadline change is separately shown with its supporting quotes. Test Tavily access to the hosted page before relying on this scenario.

## Accuracy and limits

- Failed retrieval, invalid analysis or a failed impact call does not save a snapshot or report. Snapshot, report and timestamp are committed together, with stale checks rejected.
- Only exact source quotes after whitespace/case normalization are accepted. Unsupported facts are discarded; a quote being present does not guarantee the model interpreted it correctly. Verify source pages before acting.
- Missing or unsupported facts, changed document lists, and dates not reliably expressed as `YYYY-MM-DD` are observations needing review, not definite additions or removals. Empty document lists are not proof of no requirements.
- Checks are manual. Text is limited to 40,000 characters; omitted content and inconsistent extraction can hide facts. AI summaries and suggested actions are not verified personal advice.
- This shared anonymous workspace has a database-enforced cap of 50 monitors and 100 check attempts per UTC day, including failures, plus a 90-second per-monitor cooldown. These are global limits, not abuse-proof identity controls. The service role must never be placed in client code.
- URL validation blocks private IPv4 targets and IPv6 literals and requires resolvable public IPv4 HTTPS hosts. Tavily is a third-party extractor and controls subsequent redirect handling; this validation cannot guarantee where a remote service ultimately fetches. Only monitor pages suitable for public sharing.
- No authentication, notifications, scheduling, PDF crawling or bulk monitoring is included.

## Submission checklist

- Verify real Tavily Extract and Nebius Nemotron calls with the account; record the working model ID and request times.
- Deploy to Vercel, test the public URL and synthetic demo; publish this repository with its MIT license.
- Record a public YouTube demo under three minutes, create the Devpost entry, and provide honest Nebius/NVIDIA tool feedback based on actual use. These actions have not been completed.

References: [Nebius model example](https://github.com/nebius/token-factory-cookbook/blob/main/models/nemotron/nemotron3-super-120B.md), [Tavily Extract](https://docs.tavily.com/documentation/api-reference/endpoint/extract), [hackathon rules](https://nebiusglobalaihackathon.devpost.com/rules).
