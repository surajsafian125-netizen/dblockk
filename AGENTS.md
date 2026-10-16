# Project decisions

- Render the shared D'Block brand mark through `AppLogo`; keeping a single component makes future artwork replacements consistent across views.
- Use square logo artwork for the browser and installed app while retaining dedicated small and maskable icon files where required by device specifications.
- Resolve news push photos server-side from the published article linked by the notification; send them as the Web Notification image while preserving the brand icon and text fallback.