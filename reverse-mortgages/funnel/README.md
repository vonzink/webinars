# Webinar funnel, one page at a time

Page 1: `01-reverse-custom-values.html` replaces the Custom HTML block at `/reverse`. Nothing was published automatically.

Existing screenshot keys used: logo_image_url, domain_name_ (including trailing underscore), next_webinar_date, webinar_start_time, timezone, webinar_host, webinar_host_email, company_nmls.

Proposed new keys and values are in `page1-new-custom-values.json`; create these in GoHighLevel before publishing and verify the generated keys match the tokens. Topic-specific copy remains editable HTML. Form pGG0QkZMUpKNJORXbaL3 remains unchanged.

The page's Reserve Your Spot link opens the confirmation URL directly, as requested. It does not submit the iframe form or register the visitor. The form's own successful-submission redirect must also be configured in GoHighLevel to Page 2; do not use an outer-page click handler to simulate registration.

Custom values are shared wherever the same key is used. Copying pages does not create independent values for simultaneous webinars. Use separate webinar-specific keys or separate subaccounts when both versions must stay active with distinct details.

Routes supplied by user:
1. /reverse
2. /webinar-confirmation-reverse
3. /webinar-broadcast-reverse
4. /expired-webinar-reverse
5. /webinar-live-reverse
6. /schedule-consultation-reverse

The shown calendly_link still points to the earlier schedule-consultation path. Update it to https://web.msfgmortgage.com/schedule-consultation-reverse for this funnel when preparing Page 6. Do not infer the truncated date/time key or Zoom URL from screenshots.
