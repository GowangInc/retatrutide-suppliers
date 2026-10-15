# Retatrutide Supplier Database

Interactive supplier research directory at https://gowanginc.github.io/retatrutide-suppliers/, using the Supplier Atlas design developed in Stitch.

All 70 supplier records from the original directory are preserved in `data.js`, including pricing, documentation, contact information, source links and research notes. Records draw on the Janoshik public test registry, supplier websites, B2B platforms and recorded inquiries.

The site supports search, location and shipping filters, contact-status and source filters, sorting, grid/list views and expandable research records. Working notes keep the existing `reta_notes` and `reta_notes_updated` localStorage keys. Notes stay in the browser; JSON export/import moves them between devices. Reset filters does not clear notes. Clearing notes requires confirmation.

The workspace tools include a standalone HTML download that embeds all CSS, supplier data and JavaScript. Export working notes separately. The existing `retatrutide-suppliers.html` URL remains available as an alias of `index.html`.

GitHub Pages serves the root of `main`. No build step or external runtime dependencies are required. `index.html` and `retatrutide-suppliers.html` contain the same page markup; update both together. The visual system lives in `tokens.css` and `styles.css`, with behavior in `app.js`. Bump the asset query version in both HTML files when publishing asset changes.

The companion Paraxanthine reference shares the Supplier Atlas styles and runtime. See `DESIGN.md` for design provenance.
