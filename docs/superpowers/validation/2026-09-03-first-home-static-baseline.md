# First Home Static Deck Baseline

Date verified: 2026-09-04

This document checkpoints the source for **Your first home, without the mystery.** It is source checkpointing only. It does not deploy, publish, route traffic, modify production, or change the current live webinar.

## Live reference

- Current live audience URL: `https://msfgmortgage.com/webinars/first-home-without-mystery/`

## Source comparison

The dirty root source and isolated-worktree source were compared recursively before any checkpoint edit:

- Root: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/`
- Isolated: `/Users/zacharyzink/MSFG/Webinars/.worktrees/webinar-studio/first-home-without-mystery/deck/`
- Excluded only: `.DS_Store`, `node_modules`, `.playwright-cli`, `output/playwright`, and `migration/runtime`
- Command: `rsync -rcnli --delete --itemize-changes --out-format='%i %n%L' --exclude='.DS_Store' --exclude='node_modules/' --exclude='.playwright-cli/' --exclude='output/playwright/' --exclude='migration/runtime/' ROOT/ ISOLATED/`
- Result: exit `0`, no output. Every non-generated file matched; neither side had an unmatched non-generated path.

## Repository states before checkpoint

### Dirty root checkout

- Branch: `main`
- Commit: `db98a0ae93d4391d6706f79b5c06376565d7bec1`
- Tracking state: `main...origin/main [ahead 2]`
- Status:

```text
 M .DS_Store
 M Homebuyers-Webinar/.DS_Store
 M Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0
 M first-time-homebuyer/.DS_Store
 M first-time-homebuyer/images/.DS_Store
?? .playwright-cli/
?? .superpowers/
?? .tmp-first-home-Rq0cL1/
?? Homebuyers-Webinar/Export/site-deploy-2026-08-31.zip
?? Homebuyers-Webinar/Export/site-deploy-2026-09-01-first-home-v1.zip
?? Homebuyers-Webinar/Export/site-deploy-2026-09-02-presenter-session-isolation.zip
?? Homebuyers-Webinar/Export/site-deploy-2026-09-02-presenter-settings.zip
?? first-home-without-mystery/
?? first-time-homebuyer/versions/.DS_Store
?? homebuyer-slide-enhancements-prompt.md
?? msfg-site-deploy.zip
?? va-loans-webinar-prompt.md
?? webinar-api/
```

The root checkout was not modified.

### Isolated worktree

- Branch: `codex/webinar-studio`
- Commit: `8aa46918ff43b4efa605413ea96ac39d782b9a8e`
- Status before the checkpoint edits:

```text
?? first-home-without-mystery/
?? webinar-api/
```

`webinar-api/` is outside this checkpoint and remains untouched.

## Deck inventory

### Fifteen stable slide anchors

1. `opening`
2. `confident-number`
3. `three-questions`
4. `credit-report`
5. `credit-habits`
6. `loan-programs`
7. `low-down-payment`
8. `cash-ingredients`
9. `cash-example`
10. `costs-vs-prepaids`
11. `complete-payment`
12. `protect-preapproval`
13. `document-story`
14. `five-step-plan`
15. `wrap`

### Four educational popouts

1. `prog-conventional`
2. `prog-fha`
3. `prog-va`
4. `prog-usda`

### Named interaction surfaces

- Calculator surfaces: the on-slide cash-to-close builder and the shared mortgage-payment calculator dialog, including open, close, drag, resize, term selection, advanced inputs, breakdown, and total states.
- Annotation surfaces: draw toggle, pencil, highlighter, rectangle, text, spotlight, colors, clear, undo, redo, auto-off, and on-slide toolbar visibility.
- Presenter surfaces: presenter selection, slide/target/pace/elapsed timers, current slide guidance, next-slide preview, position, popout and graphics libraries, fullscreen, navigation visibility, back/next, and timer controls.
- Animation surfaces: previous build, play, pause, next build, and current/total animation status.
- Notes surfaces: shared speaker notes and per-presenter My Notes add, save, edit, and delete controls.
- Settings surfaces: keyboard-shortcut dialog, seven presenter actions, key capture, validation, reset defaults, save, database status, and browser-cache fallback.

## Baseline gates

All commands ran from `/Users/zacharyzink/MSFG/Webinars/.worktrees/webinar-studio/first-home-without-mystery/deck`.

### Node contract suite

Command: `npm test`

```text
tests 45
suites 0
pass 45
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 62.986041
```

Result: pass. The suite covered deck content, the worked cash-to-close example, surface-fit clipping, modal fit and focus behavior, overlay geometry, presenter shortcuts, and fixed 1920-by-1080 slide fitting.

### UI browser contract

Command: `./tests/run-ui-browser-contract.sh`

```json
{"status":"pass","failures":[],"pageErrors":[]}
```

- Browser page URL: `http://127.0.0.1:4197/#opening`
- Browser page title: `Your first home, without the mystery. — Mountain State Financial Group`

Result: pass with no page errors.

### Fit browser audit

Command: `./tests/run-fit-browser-audit.sh`

```json
{"status":"pass","matrix":{"status":"pass","errors":[],"fixtures":{"clippedRejected":true,"textRejected":true,"transformedAccepted":true},"matrix":[{"viewport":"1920x1080","slideAudits":15,"cashBuilderAudits":1,"popoutAudits":4},{"viewport":"1280x720","slideAudits":15,"cashBuilderAudits":1,"popoutAudits":4},{"viewport":"480x800","slideAudits":15,"cashBuilderAudits":1,"popoutAudits":4},{"viewport":"800x480","slideAudits":15,"cashBuilderAudits":1,"popoutAudits":4},{"viewport":"240x180","slideAudits":15,"cashBuilderAudits":1,"popoutAudits":4}],"totals":{"slideAudits":75,"cashBuilderAudits":5,"popoutAudits":20}},"console":{"errors":0,"warnings":0},"network":{"requests":57,"failedResponses":0}}
```

Result: pass across five viewport sizes. Totals were 75 slide audits, 5 cash-builder audits, and 20 popout audits, with zero console errors, zero console warnings, and zero failed responses across 57 network requests.

## SHA-256 manifest

The manifest contains all 70 non-generated files under `first-home-without-mystery/deck`. It excludes only `.DS_Store`, `node_modules`, `.playwright-cli`, `output/playwright`, and `migration/runtime`.

```text
4caa51dfb7949f87105953ebf64de8537fe6d9cf2d8cf44429f4c71e340ede52  first-home-without-mystery/deck/assets/brand/EQUAL HOUSING LENDER.png
5393005156a5ffe1b2143943402c5f6ed216b7518be8024633e53a1ea4d09856  first-home-without-mystery/deck/assets/brand/logo-horizontal-knockout.svg
c17fcdf8d870e4a305503d5d1c3608ec50623c392c4c32ee9ed5632e7d6e2ac0  first-home-without-mystery/deck/assets/brand/logo-horizontal.png
f4c0c5a30020b5d18a278385188679345b5dfb34b27862fb7a5acf38d252cac2  first-home-without-mystery/deck/assets/brand/logo-horizontal.svg
796e1bcf273119d44bef4c7d4f29b650c49a5f3a816be046c93f6ddbba1d6bf6  first-home-without-mystery/deck/assets/brand/logo-knockout.svg
3225629301d308fbd5ada24c5c29b8e8aac3d9db576cf600b69848b9b31a3b94  first-home-without-mystery/deck/assets/brand/logo-mark-only-knockout.svg
3076b078e832d25c7c6652111e2bed87715338933a9bd30ab521698da72045fe  first-home-without-mystery/deck/assets/brand/logo-mark-only.svg
c741ba008d3ce24f19a8ddfa04139473b55a9e3e703b2b623040dbf6c74c7015  first-home-without-mystery/deck/assets/brand/logo-stacked.png
5036b4946ffcf771d65f7e96b7c4605abf3416446217b74ae17ee4a2c8a4da00  first-home-without-mystery/deck/assets/brand/logo-stacked.svg
dbbbbe20f54a56adabffaa5fbf1e0cb1bbd31102b31a75ec6024e297f5403d80  first-home-without-mystery/deck/assets/brand/presentation-qr.png
9d5c7dcd878d80d40d69455837f15b95d323e72366c8b4d7c963cf37d6154f5f  first-home-without-mystery/deck/assets/brand/presentation-qr.svg
a1699a57eff4af6f2d77c4fe0e70df874c76c4164eb1654f0dcefdd2a894818a  first-home-without-mystery/deck/assets/brand/qr-seth.png
1c9b783ac7bdfe1bfd862498f186966c7903ade2895e0ab8a85a3226d5d35255  first-home-without-mystery/deck/assets/brand/webinar-qr.png
3501daf1b48693d709fb091eaccfcd218d42d9c7424b463800348c75696db1cf  first-home-without-mystery/deck/assets/portraits/seth-angell.png
100873ebdc7e751caa5e8c90613d6de813d1d0023b9dd3d880a94278d63d0477  first-home-without-mystery/deck/content/modals.js
17a183c5e9f6b23287d8b77f652a1fdc807a93217fb34033182d51e0f31239fb  first-home-without-mystery/deck/content/presenter-media.js
18846d38df8384d9f2b5390c5a7041aff24836783bfd847bdc8a0192f603cf0c  first-home-without-mystery/deck/content/presenters.js
605c6f4fa6af4aa4b5fedc5608e33b933125c72bec6981b7bad4ee770a282682  first-home-without-mystery/deck/content/slides.js
900010fe30197d617f44d96cb16280523cdbd4058648960e994c651ac7320bbe  first-home-without-mystery/deck/content/webinar-config.js
d9313619c6d9c74d099e9de6e52669ca89370888a0a4f63164a98449e16c5f32  first-home-without-mystery/deck/css/base.css
42aa7adba00cb1e5c3271b2673fd7551769e0059acf7a67b017d68779f7ab00e  first-home-without-mystery/deck/css/calculator.css
6a1bb14562a057f453b0ae581db12ce88ff3f1eeb3ad53fb4d11d25898d6b910  first-home-without-mystery/deck/css/cash-to-close.css
de10ac235415ef4505f30186d70769d5f95ab71a4e17f0414ce306a24cf7574f  first-home-without-mystery/deck/css/components.css
c9567efb8200c98c1aa5f3e1a63af49730edd49cce185cb92237c277c66b0639  first-home-without-mystery/deck/css/slides.css
4e901a7696f183b1ed4275bb139dcd74aba74d59e735c96adcba45511440758e  first-home-without-mystery/deck/css/tokens.css
b51288fee7f6c9c7efe655ed4144b8e868d5328a0565290ed94df33e70ad8148  first-home-without-mystery/deck/index.html
4755f390c57ead755cce4f93315f7837a385b6872aa35b9cd5b20df51f78830f  first-home-without-mystery/deck/js/annotate.js
8f47b14e0b15f988d9410cd7c79a410191b4ba8f4e181a13b51146cae27a2af8  first-home-without-mystery/deck/js/buydown-calculator.js
5e2551038a8c075103a5dc33f6084b9bf2380f0fd56f26a3f8e2d394e0b1b1ab  first-home-without-mystery/deck/js/calculator-math.js
a6ee4b9acb7fe023414f0d5478af4b2fc3c6b1b6df286935177cebd477104e28  first-home-without-mystery/deck/js/calculator.js
afdd2705cf7da66560d0f5a6a79c550add2f08e1fdd4b2c85b1b70d935a91de5  first-home-without-mystery/deck/js/card.js
5c21016e100f3d984c8183e5afc5a2f2cb68b582386fb306cacd8b7d52e2c4be  first-home-without-mystery/deck/js/cash-to-close-calculator.js
9cb2bebe6e7400eec4e090a1efa0aeda7155e38fe637ecc2b6c023df0b525484  first-home-without-mystery/deck/js/cash-to-close-math.js
48131b3963ba1fc2c5f833060434550e3f4ae107121a294debddfb858e0af80b  first-home-without-mystery/deck/js/deck.js
b850b27b3f0b38505b3f1fa6e90b8036ae95623221bedef1ded2009646c74794  first-home-without-mystery/deck/js/figures.js
5393c38f499ec63e923390a44b62934f775de4b178babe5602d9f919a8847a30  first-home-without-mystery/deck/js/modal.js
18d568252ec7f3a23806a50d92c3ea176c94a2cb369a83259226eeea3cbadd58  first-home-without-mystery/deck/js/notes-store.js
523b86e81dc9e6dda1d05703ae68db8cb19098ec3c4a99662fe3c511d372e3b4  first-home-without-mystery/deck/js/overlay-geometry.js
d29b0f9dfa43757ddb35b7e9c6ba3188e015221491a6e9fe6766d62fab6c5ed9  first-home-without-mystery/deck/js/presenter-settings-store.js
f5d9c288515cc84682601df8b2320c8e1451d84a3e04d1881048bb316c3cde82  first-home-without-mystery/deck/js/presenter-shortcut-panel.js
027e0c492e80df81c094e0a13bd8d555a2fdfe9931df07e84fac6e6f6b56d1dd  first-home-without-mystery/deck/js/presenter-shortcuts.js
0f3f1bd9a519a7a785a0b68cb5ad011bdc38d2fef0bf443a3b6fa22b8e58b15f  first-home-without-mystery/deck/js/presenter.js
e7ad27fb4738795e8bae6f591837f2e8f70cfe334d2a2c7c090d10dd4bc548b5  first-home-without-mystery/deck/js/roster.js
b76f2f224c13d0b055c49f32b29de4d501ef2d910e167c4da3f30440a2657735  first-home-without-mystery/deck/js/surface-fit.js
0311ae014f042b563f417cb56ca442b5b6cc873efa1a8393230187b58d775cbe  first-home-without-mystery/deck/package.json
f9994c8b3bb1f361ca9182006b729cabd13c42728fd90485ffd5bdf2b8b2fd42  first-home-without-mystery/deck/presenter.html
888dc3dc3c61507ee1fde76e7e905413f1030f38c56fca37dca01cb89e9bbc29  first-home-without-mystery/deck/tests/cash-to-close-math.test.mjs
5f8fca43051be99f02d14252202f925c45dc312bc667158dd60876ad1c5f006a  first-home-without-mystery/deck/tests/deck-content.test.mjs
ed08ecab735d9a007c536100608f351402052aa944905722530828d56da245a3  first-home-without-mystery/deck/tests/fit-browser-audit-fixture.html
f34c92537d29eea79126a74f41f371cb49a50402b4e7dfcd95a91167c5d78575  first-home-without-mystery/deck/tests/fit-browser-audit.js
b7e82ed9a68d292ef5b46632363245e432c55602fc88d9f192be1551eb14a8f7  first-home-without-mystery/deck/tests/fit-browser-audit.test.mjs
82a7b4c898ead83dd60f36363e5364934c215a7ccb4dc7a65f82542b3b8d5a30  first-home-without-mystery/deck/tests/fit-browser-matrix.run.js
e461286062876391dc4bccc3c8c559c2a0ec97c4a2f57e5d03c60e1dde2340de  first-home-without-mystery/deck/tests/modal-fit-contract.test.mjs
7bfa13e5b17077a23bd5dc6cd76988cfe90b17cabd2bdc6dc9de179969b89e81  first-home-without-mystery/deck/tests/overlay-geometry.test.mjs
c87d5f151b6b06ce4a4188a82f11d7e5b1141e4154405dfd6b4a67cf1acf8a29  first-home-without-mystery/deck/tests/presenter-animation-controls.run.js
3ad1aa922ee4877b0948b1ef4160bffbe83c4f9697aec8ff313cf829ffb387fe  first-home-without-mystery/deck/tests/presenter-channel-isolation.run.js
9afbd0fc4ddbb9c479c84f679c5b7c948dfb38dca8a7df4ef72bf337210f72ae  first-home-without-mystery/deck/tests/presenter-note-controls.run.js
960ab5897eca31820211065c5dacb9724256334b620f346f7e3b816ca620cacd  first-home-without-mystery/deck/tests/presenter-shortcut-settings.run.js
1bc13a4f8e8dec9f44dd360b23b3998de8eff26ca66709027febf3c5be297133  first-home-without-mystery/deck/tests/presenter-shortcuts.test.mjs
355bc43174a06e98f99a998bcb5a60026c03e6ad4baf49086a1969ecd3a4939c  first-home-without-mystery/deck/tests/render-slides.run.js
b06e9ad4a1f786054dd451c530e777fd9310ba62130e5b61c79d5351d155c5a8  first-home-without-mystery/deck/tests/render-slides.sh
92394063d57104319323ef3ae0a757286e19d5f84f8bd85f52f0e2f54d3fcd95  first-home-without-mystery/deck/tests/run-fit-browser-audit.sh
5136804dc861f6a24d20167bb5c1f172841870299c5a93ce5a9a2feb14bb1c60  first-home-without-mystery/deck/tests/run-presenter-animation-controls.sh
8fd9cbd63e0038119964d4ca784444050a8742655b55108bd8bb4d76da61973d  first-home-without-mystery/deck/tests/run-presenter-channel-isolation.sh
acf2a32258fe0223abe105af8ffdbbd3b7988f9820ff78d43571e9bbad3c8798  first-home-without-mystery/deck/tests/run-presenter-note-controls.sh
11a864cb48d85808a2559f45b71f65b7ca1a483b7eb7528b15f7d774e72814ee  first-home-without-mystery/deck/tests/run-presenter-shortcut-settings.sh
76eb41262678650d8adcf60998485fc54d9fda6c376b3100f768f2246faba613  first-home-without-mystery/deck/tests/run-ui-browser-contract.sh
e2be2d2263cc66957df0aa3b69d91dfecd9d1e0f9cb1af88a6b42af6eaffb23e  first-home-without-mystery/deck/tests/slide-fit-contract.test.mjs
536be7e1f6c5b499e8caca1c6932600fd65927fa7df1c1272e21086f09932a8b  first-home-without-mystery/deck/tests/surface-fit-contract.test.mjs
247ec3029ab17f12283f6a10178cd7f93dfd92023ae8660f3f4a7310da3d26de  first-home-without-mystery/deck/tests/ui-browser.run.js
```

`index.html` SHA-256: `b51288fee7f6c9c7efe655ed4144b8e868d5328a0565290ed94df33e70ad8148`

`presenter.html` SHA-256: `f9994c8b3bb1f361ca9182006b729cabd13c42728fd90485ffd5bdf2b8b2fd42`

These two HTML files are checkpointed byte-for-byte and were not edited.
