# TailorTab — Privacy Policy

_Last updated: October 18, 2026_

TailorTab ("the Extension") is a Chrome extension that replaces your new tab
page with a personal dashboard. This policy explains what data the Extension
handles and where it goes. **We do not have user accounts, we do not show ads, and
we do not sell or share your data for advertising.**

## What stays on your device

The following is stored only in your browser's `localStorage` and never leaves your
device except as described below:

- **Your widgets, profiles, and settings** (which widgets you've added, the active
  profile, font size, time format/zone, chosen background).
- **Any API keys you choose to add** in Settings for gated data sources. These are
  stored locally on your device. When a widget that needs one makes a request, the key
  is inserted into that request and sent **directly from your browser to the
  third-party API the key belongs to** — it is never sent to, or seen by, our backend,
  and we do not log or retain it.
- **A random device identifier** (a UUID we generate). It is not linked to your
  identity, email, or any account. It is used solely to apply usage rate limits.

## What is sent to our backend

When you type a prompt into the prompt bar (e.g. "show me Steelers news"), the
Extension contacts our backend service (hosted on Cloudflare Workers) to:

1. **Interpret your prompt** — your prompt text and your device identifier are sent
   to our backend, which forwards the prompt to **OpenAI** (the gpt-4o-mini model) to
   convert it into a widget configuration.
2. **Shape data for agent widgets** — for widgets that pull from a public API, a small
   **sample of the API response** may be sent to our backend (and on to OpenAI) so it
   can be formatted for display. The underlying data request itself is made directly
   from your browser, not by our backend.

As with any internet request, our backend receives your device's **IP address**.

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
- **Data providers** — to display widgets, the Extension requests data **directly from
  your browser**, so each provider receives your **IP address** and the query (for
  example, a city name for weather). This includes the built-in sources — ESPN (sports),
  Yahoo Finance (stocks), Google News (news), and Open-Meteo (weather) — and any public
  API the agent sources at your request (for example, Coinbase, Frankfurter, GitHub, or
  Wikipedia). Each provider has its own privacy practices, which we do not control.

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

Questions: atinmathur12@gmail.com
