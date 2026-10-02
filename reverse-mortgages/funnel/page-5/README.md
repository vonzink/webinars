# Page 5 — /webinar-live-reverse

Paste all of 05-live.css into the page Custom CSS field (no style tags). Paste all of 05-live.html into one Custom HTML block, replacing the previous block. The script stays with the HTML. Set the containing GHL section/row to full width with no extra padding if needed.

Custom values: logo_image_url, webinar_title, webinar_host, next_webinar_date, webinar_start_time, timezone, zoom_link, webinarconsultation, webinar_host_email.

Set zoom_link to the complete actual Zoom meeting URL, including any required passcode. Set webinarconsultation to https://web.msfgmortgage.com/schedule-consultation-reverse.

Preview uses the supplied event and host details. It intentionally leaves Zoom blank because the supplied screenshot truncated the meeting URL; it demonstrates the contact fallback. Production uses zoom_link. No fabricated meeting link is included. Invalid/missing URLs disable that button and direct visitors to the contact email.

The local production HTML cannot resolve GHL custom values. Use preview.html for local visual review. After pasting both files, publish and verify substitutions on the GHL public page. These files have not been published. No new custom values are needed.

Preserves the supplied single centered Zoom card layout. Does not add timing redirects or detect Zoom meeting status. No meeting was joined or consultation booked during verification.
