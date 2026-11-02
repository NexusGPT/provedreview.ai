// The page's nav and footer are the site's shared ones (scripts/layout.mjs): root-absolute links, the current page marked with
// aria-current, the GitHub button in .nav-r; the build rebases the links under SITE_BASE. SHELL_CSS styles that markup for
// this page, which loads no site.css (board B's own stylesheet, page.css, is its look).
import { nav as siteNav, footer as siteFooter } from '../layout.mjs';

export const MARK = '<span class="mark">' + '<i></i>'.repeat(9) + '</span>';
const GITHUB = 'https://github.com/NexusGPT/lean'; // docs/JOURNEYS.md, open question 5: the nav's GitHub button opens lean

// base: the path from the page to the site root ('../' for /benchmark/); cur: the page's own nav label
export function nav({ cur }) { return siteNav(cur); }

export function footer() { return siteFooter(); }

export const SHELL_CSS = `
.nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;font-size:14px;border-bottom:1px solid var(--line);position:relative;z-index:5}
.logo{font-weight:600;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
.logo .mark{display:grid;grid-template-columns:repeat(3,7px);gap:1px}.logo .mark i{display:block;width:7px;height:7px;background:var(--steel);border-radius:1px;opacity:.9}.logo .mark i:nth-child(2),.logo .mark i:nth-child(4),.logo .mark i:nth-child(9){opacity:.35}
.links{display:flex;gap:28px;color:var(--mut);align-items:center}.links a:hover{color:var(--fg)}
.links a[aria-current="page"]{color:var(--fg);position:relative}.links a[aria-current="page"]::after{content:"";position:absolute;left:0;right:0;bottom:-21px;height:2px;background:var(--fg)}
.nav-r{display:flex;gap:10px}
.foot{border-top:1px solid var(--line);font-size:13.5px;color:var(--mut)}
.foot{padding:40px 48px 56px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}
.foot .wm{display:flex;flex-direction:column;gap:10px}
.foot .fl{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:12px}
.foot .fl a:hover{color:var(--fg)}
@media (max-width:960px){.nav{flex-wrap:wrap;row-gap:12px}.links{order:3;width:100%;gap:22px;font-size:13.5px;overflow-x:auto}.links a[aria-current="page"]::after{bottom:-6px;height:1px}}
@media (max-width:760px){.nav{padding:14px 16px}.foot{padding:32px 16px 40px}}
`;
