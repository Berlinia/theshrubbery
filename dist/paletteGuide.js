import {PALETTE} from './documentFormat.js';

// User-supplied excerpt, split into three-word outcomes in reading order.
const words = `We're no strangers to love
You know the rules and so do I
A full commitment's what I'm thinking of
You wouldn't get this from any other guy
I just wanna tell you how I'm feeling
Gotta make you understand
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
Never gonna make you cry
Never gonna say goodbye
Never gonna tell a lie and hurt you
We've known each other for so long
Your heart's been aching, but you're too shy to say it Inside, we both know what's been going on`.split(/\s+/);
const colors = Object.entries(PALETTE).filter(([key]) => key !== 'black');
const table = ([key, color], index) => `{{box,accent=${key}
### {{accent ${color.name} Table}}
{{table,roll
| d6 | Outcome |
|:---:|:---|
| 1–3 | ${words.slice(index * 6, index * 6 + 3).join(' ')} |
| 4–6 | ${words.slice(index * 6 + 3, index * 6 + 6).join(' ')} |
}}
}}`;
const pages = [0, 8].map(start => {
  const columns = [start, start + 4].map(offset => colors.slice(offset, offset + 4).map((color, i) => table(color, offset + i)).join('\n\n'));
  return `{{page background=plain accent=black}}
# COLORS IN PRACTICE${start ? ' · CONTINUED' : ''}
Change a box's \`accent=\` value to recolor its title, border, and enclosed table. Remove the override to inherit the page accent.

{{columns,two
${columns.join('\n\n\\column\n\n')}
}}
`;
});
export const PALETTE_GUIDE = pages.join('\n\\page\n');
