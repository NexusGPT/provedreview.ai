# The sandbox list: what a build may install, per project

## What the file is

Each project can keep one file, `.gate/sandbox.json`. It says what the build sandbox may install when it builds a
change to that project, and whether a build may see this machine's process list. The file is read from the **parent
commit** of the change (the merge base), never from the working tree, so a change cannot widen its own list. This is
the same rule as `.gate/pixel-diff.json`.

The file has four parts:

| field | what it says | when absent |
|---|---|---|
| `install.allow.lockfile` | `true`: every package the repository's lockfile pins may install | `true` |
| `install.allow.packages` | package names that may install even when the lockfile does not hold them | none |
| `install.allow.tools` | system tools a build may call, such as `git`, `python3`, `make` | none |
| `install.deny` | names that are always refused, even when the lockfile holds them or an allow names them | none |
| `process_list` | `"real"`: a build may list this machine's processes; `"hidden"`: it may not | `"real"` |

The schema and its example are in `research/open-code-review/d3/harness/sandbox_allow.py` (`SCHEMA`, `EXAMPLE`).
`python3 -I sandbox_allow.py schema` prints them. A file with an unknown field, a wrong type or a bad value is refused,
with every wrong field named. In that case no build runs.

## The default

With no file at the parent commit, a build gets the packages its lockfile pins, no system tool, and the real process
list. The build record says the list came from the default and why ("`.gate/sandbox.json` is not in commit ...").

A **system tool** is any program a script calls that the sandbox does not already provide. The sandbox provides its
own runtime (`sh`, `env`, `node`, `npm`, `npx`, `corepack`, `pnpm`, `yarn`) and the everyday POSIX utilities a shell
line uses (`cp`, `mkdir`, `rm`, `sed`, `grep` and the rest of `BASE_TOOLS`). A package's own installed command (anything
in `node_modules/.bin`) and a file of the repository (`./tools/gen.sh`) are not system tools either.

## One example

```json
{
  "version": 1,
  "install": {
    "allow": { "lockfile": true, "packages": ["esbuild"], "tools": ["git", "python3"] },
    "deny": ["node-ipc", "curl"]
  },
  "process_list": "real"
}
```

This project's builds install what the lockfile pins, plus `esbuild` even if the lockfile lacks it. Scripts may call
`git` and `python3`. `node-ipc` is refused even if the lockfile pins it, and so is any script that calls `curl`. Builds
see the real process list.

## What a build asks for, and the rule

Before anything is fetched, the build's packages are checked: every name the lockfile pins, and every dependency in
the `package.json` files from the script's package up to the lockfile. After the fetch (which runs no package script),
two more things are checked: every package the fetch actually installed, and every system tool that the commands to
be run start with. Those commands are the script, its `pre`/`post` hooks, the scripts it runs through the manager,
and the install scripts of the installed packages. A package with a `binding.gyp` asks for `python3`, `make` and
`c++`, because node-gyp calls them.

Each name is checked against the list in this order:

1. Named in `install.deny`: refused.
2. A package the lockfile pins, and `allow.lockfile` is true: allowed.
3. A package named in `allow.packages`: allowed.
4. A tool named in `allow.tools`: allowed.
5. Anything else: refused.

One refusal stops the whole build. No install script runs, no build script runs, and no other script is tried. A
`node_modules` folder that this build fetched is removed. A partial build never happens.

## What the record says when something is refused

The build step's record (`build_step` on the file's result in the screen row, `screen_route.build_step`) carries:

- `sandbox_list`: where the list came from (`kind` commit or default, `commit`, `path`, the file's `sha256`) and the
  `process_list` applied. This is present on every build.
- `install_refused`: one entry per refused name, `{asked, kind, by, rule, list}`. For example:
  `{"asked": "python3", "kind": "tool", "by": ["package.json script pregen"], "rule": "install.allow.tools", "list": {"kind": "commit", "commit": "4f2a…", "path": ".gate/sandbox.json", "sha256": "…"}}`.
- `cause`, one sentence: "install refused by .gate/sandbox.json: tool python3 asked by package.json script pregen,
  refused by install.allow.tools of the list of commit 4f2a…".

## The process list

- **macOS (`sandbox-exec`).** `real` lets the build reach the one system service that answers the process list
  (`com.apple.sysmond`). `hidden` denies it, together with every other service, as the profile did before this change.
- **Linux with `bwrap`.** `real` keeps this machine's process namespace and mounts its `/proc` read-only. `hidden` gives
  the build its own namespace, as before. Note for the owner: on Linux, `real` also lets the build read the command
  lines and environment variables of other processes run by the same user.
- **Linux with only `unshare --net`.** The process list is always real. `hidden` is refused, and nothing runs.

## What is not done yet (the gate side)

1. **The gate's own install.** `gate/screen-component.mjs --install` installs the component's dependencies itself,
   outside this list. It should read `.gate/sandbox.json` at `--base` and refuse the same way before it installs.
2. **The gate run record.** `gate/record.mjs` has no row for a build. A refusal would ride as a payload on a `check` row,
   or the gate would need a new `build` kind.
3. **The containment summary.** `gate/containment.mjs` `containmentOf` reports lean's network refusals (`denied`). An
   `install_refused` beside it would carry this list's refusals into the certificate.

## What the resolver does not see

The resolver reads the scripts as written. A tool called by an absolute path (`/usr/bin/curl`), or started by a
package's own code while it runs, is not seen. Such a tool still runs inside the sandbox's other rules (no network,
writes only in the tree, reads only in the tree and the toolchain). Enforcing the tool list at run time, with a `PATH`
holding only the allowed tools, is a follow-up.

## Measured on macOS, 31 October 2026

- `/bin/ps` cannot be run under any sandbox-exec profile on this macOS (even `(allow default)` alone refuses its exec), and a sandboxed process never lists its own ancestors. "real" therefore means the machine's other processes are listed (pgrep works, through libproc); "hidden" denies the list itself (`process-info`) as well as sysmond. A build that shells `ps` fails in both modes, with the cause named.
- A system tool the list allows reaches the sandbox with its folder on PATH and its install prefix as a read root; a tool found under `/usr/bin` may be an xcrun shim (python3, git, clang), so the active developer bundle (Xcode.app, or the Command Line Tools) is a read root too. On a Mac whose Xcode license is not accepted, those shims fail inside and outside the sandbox with the license text; a real install elsewhere on PATH is preferred, since tool folders precede the system folders.
