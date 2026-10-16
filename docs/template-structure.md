# Reference-based templates

The Templates menu inserts complete editable Markdown sets, following the supplied `Reach`, `Quickplay`, `Scenario`, `Hazard`, and `Character Element TEMPLATE.pdf` files. Placeholder prose is replaced with writing prompts. Each inserted template starts with `header=true accent=red`; subsequent pages inherit that section accent; the license footer remains automatic on every page. Covers and the Scenario credits page use the editor's existing light styling rather than reproducing full artwork or dark pages.

Reach (10 pages): cover; Main Elements (five subsections); two territories; territory and local rumours; two ports; single port; faction with quotation; faction with separate story hooks; Firefly resources (watch results, cargo, passengers, endemic hazards); hazard and character element with eight aspects.

Character element (2 pages): introduction with two subsections, questions, alternate presentations; sixteen aspects in two columns beside a quickstart kit. The aspects page is also available separately.

Hazard (2 pages): full hazard with drives, presence, resources, aspects, quirks, hooks and encounters; compact hazard and three brief alternatives.

Quickplay (2 landscape Letter pages): first act, potential moments, scene, NPC and pre-game checks; second and third acts, climax, complications and a hazard reference with encounter tracks.

Scenario (14 pages): cover; overview and preparation; core truths and framework; simple location; locals and story threads; complex location and room generator; description and threads; location variations; crescendo and aftermath; campaign continuation; four follow-up hooks; hazards and encounter guidance; quirks and tracked encounters; credits.

Templates use `{{compact` for tighter reference typography and `{{cover` for title pages. Removing the compact wrapper restores ordinary body spacing. As with other Markdown, expanding content may require additional page breaks; overflow warnings identify pages that no longer fit.
