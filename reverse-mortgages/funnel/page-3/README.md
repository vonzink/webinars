# Page 3 — /webinar-broadcast-reverse

Replace existing broadcast-page Custom CSS with 03-broadcast.css and Custom HTML block with 03-broadcast.html. Save and publish. These files are not deployed automatically.

Custom settings:
- next_webinar_start_iso: 2026-10-08T18:00:00-06:00
- webinar_duration_minutes: 60
- webinar_live_url: https://web.msfgmortgage.com/webinar-live-reverse
- webinar_expired_url: https://web.msfgmortgage.com/expired-webinar-reverse

Behavior: countdown before start, join button during scheduled window, redirect to expired URL at scheduled end. This does not detect whether Zoom has actually started or ended.

Live inspection on September 30 confirmed that this published page still showed literal merge tokens in text, logo URL, links and countdown attributes. Page 2 resolved its values. Replacing these files does not by itself prove GHL substitution is fixed: verify the published page after saving. If tokens remain, inspect the page's GHL Custom HTML element/publishing configuration. Do not silently replace production values with hard-coded defaults.

The unused logo home link is removed because its earlier token resolved blank on Page 2. preview.html contains resolved sample values for local layout review only, and must not be pasted as production HTML.
