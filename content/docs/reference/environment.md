---
title: Environment variables
order: 3
lede: The environment variables the sources name, and what each does.
sources: lean:README.md, lean:docs/ASSURANCE.md, lean:CHANGELOG.md, da:docs/architecture/assurance-case.md, da:research/open-code-review/d3/bench/README.md, da:docs/architecture/sandbox-allow-list.md
---
## Variables

| variable | read by | what it does |
|---|---|---|
| `LEAN_NET` | lean | `deny` closes the network at the worker process's own bindings. The unit's record names every attempt it refused |
| `LEAN_Z3` | lean | the first place lean looks for the Z3 executable |
| `LEAN_WORKER_HEAP_MB` | the DA bench harness | the heap of each lean worker, in MB. It is 6144 unless set |
| `GATE_CONTAINMENT` | the DA gate | unset is `deny`; `open` is the switch |
| `PATH` | lean, the DA sandbox | the last place lean looks for `z3`; the sandbox puts a tool's folder on it |
| `JOBS` | the lean suite | the pool size for child workers and the suite runner |

### LEAN_NET

The network and the environment variables stay open in the worker process. A probe connected to a local listener and read 32 variables. `LEAN_NET=deny` closes the network. A unit with no parent runs without the permission model today.

### LEAN_Z3

lean looks up one Z3 and names it in the certificate. The order: `LEAN_Z3`, else the Z3 bundled in a `z3/bin` folder beside the dafny executable, else the `z3` on `PATH`. Dafny is given that executable (`--solver-path`) and the doubles reading runs it. The certificate's `tools` record names which one ran.

### GATE_CONTAINMENT

The gate's containment profile. Unset is `deny`, which is lean's `LEAN_NET=deny`. `open` is the switch. Any other value, or a `LEAN_NET` that disagrees, is an error before lean runs. Under `deny`, a lean without `langs/ts/exec/net-deny.mjs` never runs lane B: the unit is `ASK` naming the missing mode. What held is recorded as `containment = {profile, leanNet, lean, held, denied, attempts}`.

### LEAN_WORKER_HEAP_MB

The bench harness gives each lean process `--max-old-space-size` of the free RAM divided by `--jobs`, never under 3 GB, and at least 12 GB for the `--big` cases. `LEAN_WORKER_HEAP_MB` is 6144 unless set.

### PATH

In a unit, `process` is a fake, so `process.env` answers fakes, never the host's variables. The host's environment variables never reach the unit or the trace. The sandboxed children run under the permission model with lean's own environment only.

In the DA sandbox, a system tool the list allows reaches the sandbox with its folder on `PATH` and its install prefix as a read root. Enforcing the tool list at run time, with a `PATH` holding only the allowed tools, is a follow-up.

### JOBS

The changelog names a `JOBS` pool for child workers under the suite runner, and reports suite times at `JOBS 12` and `JOBS 28`. The sources say no more about it.

## Not in the sources

`NODE_OPTIONS`, `HOME` and `XDG_CACHE_HOME` are not named by any pinned source.
