# TO_PORT (git submodule)

This directory holds **JavaScript reference implementations** of minigames to port into Godot. It is **not** shipped with the game.

## Add the submodule

From the repo root:

```bash
git submodule add <URL-TO-JS-REPO> TO_PORT
git submodule update --init --recursive
```

## Clone a repo that already uses this submodule

```bash
git clone --recurse-submodules <REPO-URL>
```

Or after a normal clone:

```bash
git submodule update --init --recursive
```

See **AGENTS.md** for the current submodule URL and branch when configured.
