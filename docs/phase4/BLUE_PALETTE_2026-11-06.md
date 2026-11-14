# Replacement blue palette — colour step

Historical palette experiment; superseded by the owner-selected muted ocean palette in [BRAND_GUIDE.md](BRAND_GUIDE.md).

Date: 2026-11-06 (Asia/Dhaka). Owner reference: `Screenshot 2026-11-05 at 21.42.56.png`. This replaces the earlier blue/cyan/lime/mint selection.

| Exact colour | Token | Role |
| --- | --- | --- |
| `#050C9C` | `--palette-deep` | Header/footer, primary actions and selected pagination |
| `#3572EF` | `--palette-royal` | Emphasis, interactive borders and focus |
| `#3ABEF9` | `--palette-sky` | Hover states and offers |
| `#A7E6FF` | `--palette-ice` | Supporting highlights and selected states |

White/light-blue surfaces and dark supporting text retain readability. Deep-blue buttons use white text; lighter hover states use deep-blue text. Original logo artwork/colours are unchanged. Layout, copy, typography, photographs and behaviour were not changed in this colour step.

Validation: frontend production build passed; **22/22 Chromium groups passed**, including exact four-token/header-colour assertions, primary-button text contrast >=4.5:1 and existing responsive/interaction checks at 390/768/1440px. No page/console errors. Logo hashes, script syntax and diff checks passed. Browser evidence now uses the supplied work date or Asia/Dhaka date rather than a fixed report date.

[Results](evidence/blue-palette-2026-11-06/design-browser-results-2026-11-06.json) · [Desktop](evidence/blue-palette-2026-11-06/design-search-desktop.png) · [Phone](evidence/blue-palette-2026-11-06/design-search-phone.png). Earlier evidence remains intact.

Local UI: `http://127.0.0.1:3000/phase4-preview?review=blue-palette`. Continue one step at a time; review colours before other design changes. Full Phase 4 integration remains pending. No backend/private environment/database/email or deployment changes.
