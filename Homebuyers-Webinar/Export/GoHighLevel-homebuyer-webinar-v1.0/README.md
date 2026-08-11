# GoHighLevel Homebuyer Webinar Package

Target URL: https://msfg.us/webinar/homebuyer-webinar

This package is prepared for the GoHighLevel page builder. Use the files in this order.

## 1. Upload Images

In HighLevel, go to Media Storage and upload everything in:

`/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/GoHighLevel-homebuyer-webinar-v1.0/assets-to-upload`

Then open:

`04-asset-upload-checklist.md`

Copy each HighLevel media URL and replace the matching placeholder in:

`01-ghl-custom-html-block.html`

## 2. Page Custom HTML/Javascript Element

In the page builder screenshot you showed, click the Custom HTML/Javascript block and paste the completed contents of:

`01-ghl-custom-html-block.html`

This file contains the deck markup only.

## 3. Header Tracking Code

Open the Tracking Code panel for this page. Paste the full contents of:

`02-ghl-header-tracking-code.html`

Put it in the Header code area.

## 4. Footer / Body Tracking Code

In the same Tracking Code panel, paste the full contents of:

`03-ghl-footer-tracking-code.html`

Put it in the Footer or Body code area.

Do not place this script inside the Custom HTML div.

## 5. Page Layout Settings

For the blank page section, row, and column:

- Width: 100%
- Padding: 0
- Margin: 0
- Alignment: center is fine
- Use the existing path: `/webinar/homebuyer-webinar`

## 6. Preview Before Publish

Check these before clicking Publish:

- Slide 1 shows Seth and both NMLS numbers.
- Slide 2: first Space reveals the six roadmap items.
- Slide 2: second Space advances to slide 3.
- Arrow keys move slides.
- Calculator sliders respond.
- QR code appears on the final slide.
- Equal Housing Lender mark appears lower-right.
- No image placeholders like `{{MSFG_LOGO_URL}}` are visible.

## Local Preview

Open this file locally to preview the packaged version before using GHL:

`local-preview.html`
