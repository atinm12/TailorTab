# Smart Homepage — Privacy Policy

_Last updated: June 16, 2026_

Smart Homepage ("the Extension") is a Chrome extension that replaces your new tab
page with a personal dashboard. This policy explains what data the Extension
handles and where it goes. **We do not have user accounts, we do not show ads, and
we do not sell or share your data for advertising.**

## What stays on your device

The following is stored only in your browser's `localStorage` and never leaves your
device except as described below:

- **Your widgets, profiles, and settings** (which widgets you've added, the active
  profile, font size, time format/zone, chosen background).
- **Any API keys you choose to add** in Settings for gated data sources. These are
  stored locally. When a widget that needs one makes a request, the key is inserted
  into that request and sent to our backend **only to complete that single request**;
  we do not log or retain it.
- **A random device identifier** (a UUID we generate). It is not linked to your
  identity, email, or any account. It is used solely to apply usage rate limits.

## What is sent to our backend

When you type a prompt into the prompt bar (e.g. "show me Steelers news"), or when an
AI-generated widget refreshes, the Extension contacts our backend service (hosted on
Cloudflare Workers) to:

1. **Interpret your prompt** — your prompt text and your device identifier are sent
   to our backend, which forwards the prompt to **OpenAI** (the gpt-4o-mini model) to
   convert it into a widget configuration.
2. **Fetch data for "dynamic" widgets** — for widgets that pull from a public API, our
   backend fetches that API on your behalf and returns the data.

Our backend temporarily stores:
- **Cached prompt interpretations** (~1 hour) keyed by the prompt text, to reduce cost
  and latency. These are not associated with your device identifier.
- **Rate-limit counters** (~24 hours) keyed by your device identifier.

We do not maintain long-term logs that tie prompts to a device, and we do not sell
this data or use it for advertising.

## Third parties that receive data

- **OpenAI** — receives your prompt text (and, for dynamic widgets, a sample of an
  API response) to generate the widget. OpenAI processes this under its API terms; by
  default, API inputs are not used to train its models. Please avoid typing personal
  or sensitive information into the prompt bar.
- **Data providers** — to display widgets, the Extension requests data from public
  services. Some are requested **directly from your browser** (so they receive your IP
  address and the query): ESPN (sports), Yahoo Finance (stocks), Google News (news),
  and Open-Meteo (weather). Others are requested **through our backend** (so the
  provider sees our server, not you): the sources used by dynamic/agent widgets
  (e.g. Coinbase, Frankfurter, GitHub, Wikipedia). Each provider has its own privacy
  practices, which we do not control.

## What we do NOT collect

- No names, emails, or account credentials (there are no accounts).
- No browsing history, no tracking across sites, no advertising identifiers.
- No analytics SDKs.

## Data retention & deletion

- On-device data: clearing the Extension's data or removing the Extension deletes your
  widgets, settings, keys, and device identifier from your browser.
- Backend data: caches and rate-limit counters expire automatically (within ~1 hour
  and ~24 hours respectively).

## Children

The Extension is not directed to children under 13 and does not knowingly collect
data from them.

## Changes

We may update this policy; material changes will be reflected by the "Last updated"
date above.

## Contact

Questions: <your-email@example.com>
