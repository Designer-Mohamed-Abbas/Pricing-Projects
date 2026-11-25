# Implementation notes
- Source design: the first published pricing page (own design, no external mockup). No visual redesign: palette, type and layout kept; motion and interaction added on request.
- Pricing data comes from the client's price list (docs unchanged); "+" in packages = "starts from".
- WhatsApp order: wa.me/201080892215 with prefilled text (name, packages, total, notes). The customer taps send in WhatsApp; no backend.
- Quote builder is client-side only. No backend: sending is via copy + LinkedIn link. Contact phone/email not supplied.
- Skill scripts/templates/references (scaffold, validate, check-assets) were not present in this environment; structure, headers and docs were created by hand.
- Robot: inline SVG, six parts; pointer tracking, click/tap/fast-shake explode then spring back. Disabled motion under prefers-reduced-motion.
