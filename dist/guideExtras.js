import {SNIPPETS} from './snippets.js';
const columns=(...parts)=>`{{columns,${parts.length===3?'three':'two'}\n${parts.join('\n\\column\n')}\n}}`;
export const GUIDE_EXTRAS=[
`{{page background=plain accent=raspberry}}
# PICK THE RIGHT TABLE
Open **Tables**, then hover over an option to see it before inserting. Keyboard focus also shows the preview. These examples are real editable blocks: change a row and watch its appearance update.

${columns(`## Plain and ruled
Use **Plain table** for a quiet reference with no shaded rows. Its source wraps a Markdown table in \`{{table,plain\`.

${SNIPPETS.plainTable.text}
Use **Ruled table** when horizontal lines help separate entries. Change the wrapper to \`{{table,ruled\`.

${SNIPPETS.ruledTable.text}
### Edit a table
Keep the header and separator rows. Add a body row by copying a line beginning with a pipe. Alignment markers belong in the separator: \`:---\` left-aligns, \`:---:\` centers, and \`---:\` right-aligns.`, `## Compact and roll
**Compact reference** reduces cell spacing for a denser list. Use it when the content is short rather than squeezing a paragraph into every cell.

${SNIPPETS.compactTable.text}
**Roll table** gives the first column a narrow, centered dice result. Change both the range and result text to suit your table.

${SNIPPETS.rollTable.text}
### Fields or tables?
Use **Striped fields** for one labelled fact per row. Use a table when entries must align across multiple columns. **Enclosed roll table** places a heading and results inside a box.`)}

{{box
### Try it
Change a table's \`accent=black\` to \`accent=blue\` to recolor it. Remove that option to inherit this page's raspberry accent.
}}
`,
`{{page background=canopy accent=malachite}}
# BUILD A PAGE FROM BLOCKS
Choose a column layout first, then place the cursor in one column and insert a box, list, or table. Each block ends with its own closing \`}}\` line. Close the inner block before the outer layout.

{{box
## One wide introduction
This box sits before the columns block, so it spans the full page. To make this arrangement, insert an **Enclosed box**, close it, then insert **Three equal columns** below it.
}}

${columns(`## Equal columns
This layout starts with \`{{columns,three\`. Two standalone column-break lines separate its three sections.

${SNIPPETS.box.text}
### Keep the structure
Put each column's content between its separators. A page break belongs after all open blocks have been closed.`, `## Lists and notes
Ordinary dash lists receive the Wildsea leaf bullet automatically.

${SNIPPETS.list.text}
${SNIPPETS.note.text}`, `## Tracks and quotations
Change the group lengths to set the number of circles and break positions.

**Unbroken:** {{track 6}}

**Two stages:** {{track 3|2}}

**Three stages:** {{track 3|2|5}}

${SNIPPETS.flavor.text}`)}

## Choose the proportions
**Two equal columns** divides the space evenly. **Wide left, narrow right** uses \`two-one\`; **Narrow left, wide right** uses \`one-two\`. **Two columns + sidebar** nests two columns inside the wider section, with a shared heading above them. Hover over each option in **Columns** to compare the arrangements.
`,
`{{page background=reach accent=red}}
# FROM TEMPLATE TO FINISHED DOCUMENT
Templates are editable starting structures, not fixed forms. One click can insert a complete reach or scenario. Start a blank draft to try one without adding it to this guide.

${columns(`## 1 · Choose a template
Open **Templates → Reach**. It inserts ten pages: a cover, Main Elements, territories, ports, factions, Firefly resources, and a combined hazard/character page.

The first content page has five Main Elements subsections. The next page has two territories with factoids and three features each. Replace the prompts with your own material; remove pages or repeat sections as needed.

{{fields
**Character element:** 2 pages, introduction and aspects/quickstart kit.
**Hazard:** 2 pages, full and compact entries.
**Quickplay:** 2 Letter pages with three acts and a hazard reference.
**Scenario:** 14 pages, from overview to locations, finale, and credits.
}}

### Where does it go?
A template fills an empty current page, or is added after the current page. It does not replace existing writing. The menu tells you how many pages it adds.`, `## 2 · Set the section style
Each inserted template begins with \`header=true accent=red\`. Choose **Page style → Current section** to change the whole section's color.

You can also edit its first page directive, for example \`{{page header=true accent=willow}}\`. The accent carries forward until a new header. Covers count as headers; ordinary headings do not.

### Page overrides
An accent on an ordinary later page changes only that page. Background and paper-size settings are also per-page. The next header without an accent returns to the document default.

### Properties
Set the title and author before sharing: both appear in the license footer. Description, tags, and language travel with your Markdown file. The title field names the file; it does not rewrite headings on the pages.`, `## 3 · Reuse and refine
### Style tab
Try the **Insert typography example** button. The rule \`.sheet h1 { font-size: 46px; }\` changes main headings. CSS affects the preview and PDF, and is stored with this document.

### Snippets tab
Click **Add example snippet**. Each definition starts with \`\\snippet Name\`, followed by its reusable Markdown. Click its name to insert it at your saved Text cursor. Custom snippets belong to the current document.

### Save and publish
Download Markdown to keep text, CSS, snippets, and properties together. Browser drafts save automatically; Drive saves are explicit and need your dedicated Google connection.

For a PDF, fix warnings first. Print at 100%, enable background graphics, and disable browser headers and footers. Check the final PDF before sharing it.

**Try it:** rename a snippet, insert it twice, then edit only one inserted copy. Each insertion is independent text.`)}
`
].join('\n\\page\n');
