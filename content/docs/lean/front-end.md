---
title: Front end
order: 6
lede: lean treats a React component as a machine and decides at the element-tree layer, with a finite lane, a proof over hook slots, a deeper tree and a styles layer.
sources: lean:docs/front-end.md, lean:README.md
---

Every output below is a real run. The components live under `langs/ts/tests/pairs/` (`readme_search`, `hook_slots`, `ui_tree_context`, `ui_styles`, `ui_styles_project`).

## A component is a machine

Its state is the hook slots in call order plus the props. A command is a fired handler, a settle of the effects, a tick of the clock or an unmount. Its output after each command is the element tree, the effect and request trace, and the pending work.

lean decides at the element-tree layer and says so in every front-end certificate (`observation.layer`, what was rendered, what was not observed). A `WITNESS` is printed as the patch from the parent's tree to the candidate's.

## A bug behind a click and a timer

A search box with a debounced filter behind a toggle:

```tsx
export function Search({ items, limit }: { items: string[]; limit: number }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<string[]>([]);
  useEffect(() => {
    const t = setTimeout(() => setHits(items.filter((x) => x.startsWith(q)).slice(0, limit)), 200);
    return () => clearTimeout(t);
  }, [q, items, limit]);
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      <button onClick={() => setOpen(!open)}>{open ? "hide" : "show"}</button>
      {open && <ul>{hits.map((h) => <li key={h}>{h}</li>)}</ul>}
    </div>
  );
}
```

The candidate keeps one hit too many (`slice(0, limit + 1)`). One render is identical, because the list is closed. The difference needs the show click, then the effect's timer firing on the virtual clock, then a settle.

```text
$ node langs/ts/check.mjs --parent readme_search/parent.tsx --candidate readme_search/candidate.tsx --unit Search --no-project --n 60 --dafny-seconds 30
WITNESS -> search.json
patch: 1 insert
  div[2]/ul[0] insert <li key="vefqj">"vefqj"</li>
# witness: { input: 1, sequence: ["div[1]:onClick"] }
```

A bug three steps deep is reported as the one element that differs.

## A component finite by its types

```tsx
export function Panel({ initial }: { initial: "list" | "map" }) {
  const [view, setView] = useState<"list" | "map">(initial);
  const [pinned, setPinned] = useState(false);
  return (
    <section>
      <button onClick={() => { setView(view === "list" ? "map" : "list"); if (view === "map") setPinned(true); }}>{view}</button>
      <button onClick={() => setPinned(!pinned)}>{pinned ? "pinned" : "free"}</button>
      {view === "map" && pinned && <p>pinned map</p>}
    </section>
  );
}
```

The candidate's `Panel` reorders the two setter calls inside the first handler. The proof lane cannot read a handler with a branch, so lane A says `ASK:identity`. The state is a two-literal prop, a two-literal slot and a boolean slot: finite by its types. The finite lane steps both versions together over every click order from every prop value. The verdict is `PASS-decided`:

```text
PASS-decided   renders: "every click order from every prop assignment, decided: 8 state pairs over 2 assignment(s); effects and armed timers inside each step; a function or element prop is one opaque input; handler descriptors agreed on 32 of 64 fired"
               finite: { slots: [2, 2], props: ["initial:2"], assignments: 2 }
```

The same idea on a toggle is on [How it works](/docs/lean/how-it-works/#the-finite-lane).

## A handler the proof lane reads

A counter whose handler the proof lane can read (`setN(n + 1)` against `setN(1 + n)`) gets `PASS-proved` over its hook slots. One lemma: equal props and slots give an equal tree and an equal next slot.

```text
$ node langs/ts/check.mjs --parent hook_slots/parent.tsx --candidate hook_slots/candidate.tsx --unit Counter --no-project --n 30 --dafny-seconds 30
PASS-proved   lanes.A: { lemmas: { Equal_counter: true }, dafny: "1 verified, 0 errors" }
```

## Children and context

A child component is a name in the parent's tree with its props. Under `--deep=k` the tree layer renders same-package children to depth *k*, top down where their elements are placed. Each `useContext` reads the nearest provider above it. A parent whose child reads a changed provider value is a `WITNESS` at depth 1 that the one-level render missed:

```text
$ node langs/ts/check.mjs --parent ui_tree_context/parent.tsx --candidate ui_tree_context/candidate.tsx --unit App --no-project --n 30 --dafny-seconds 30 --deep
WITNESS -> app-deep.json
patch: 1 text, 1 attribute
  C[0]/rendered/button[0] text "1" to "2"
layers.tree: { verdict: "WITNESS", depth: 1, rendered: [{ component: "Bump", depth: 1 }],
               contexts: [{ frame: "Bump#1", context: "context#2", from: "provider" }] }
```

## Styles

The styles layer reads a `className` as the declarations of its classes under a pinned Tailwind table and the project's own theme.

- `text-sm` to `text-base` is a styles `WITNESS`: another font size and line height.
- A reordering of the same classes is equal in the styles layer. The tree layer still reports the attribute's text.
- A class outside the table is reported `unknown`, never equal and never a witness.

```text
Badge   layers.styles: WITNESS        parent: { "font-size": "0.875rem", "line-height": "1.25rem", … }   candidate: { "font-size": "1rem", "line-height": "1.5rem", … }
Card    layers.styles: PASS-bounded   inputs: 30, elementsCompared: 60   (layers.tree: WITNESS, the attribute's text changed)
```

Each side's own Tailwind theme is read over the pinned table: a v3 `tailwind.config`, parsed as a literal and never run, or a v4 `@theme` block in the CSS the entry imports. The certificate names the configuration it read with its path and hash. A theme token changed to another is a styles `WITNESS` with both declarations. A theme key lean does not read, or a config whose top level runs code, leaves its classes `unknown` and says why.

```text
Banner  layers.styles: WITNESS   bg-brand-500 → bg-brand-600   parent: { "background-color": "#1f6feb", … }   candidate: { "background-color": "#1158c7", … }
```

## What lean does not judge

Pixels, layout and the accessibility tree need a browser. No proof exists for them in any field lean reads, so lean never claims one. They are the screen-analysis row of differential attestation ([Around lean](/docs/lean/around-lean/)).

Habit 8 on [Writing provable code](/docs/lean/writing-provable-code/#n8-a-component-returns-a-tree) shows how a component is written to be read as a value.
