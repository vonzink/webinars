# Page 4 — /expired-webinar-reverse

Replace expired-page Custom CSS with 04-expired.css and the Custom HTML block with 04-expired.html. These files have not been published.

Existing custom values from supplied HTML: webinar_replay, webinar_registration, webinar_survey. Supply real destination URLs to show each card; leave blank to hide it. Do not use the presentation deck URL as a recording. Do not advertise the expired October 8 registration as the next event.

Set webinarconsultation to https://web.msfgmortgage.com/schedule-consultation-reverse. The screenshot's webinar_survey value was http://msfg.us: replace it with the actual survey URL or clear it. Valid URL syntax cannot identify whether a destination is the correct survey or replay.

Other values: logo_image_url, webinar_title, webinar_host, webinar_host_email, company_nmls. Missing optional URLs are hidden without hard-coded fallback destinations. Contact email remains available.

Preview uses confirmed identity details and consultation URL, with replay/next-event/survey blank because actual destinations have not been provided. No recording or future event is assumed. Production HTML retains all three cards for when those URLs are configured.
