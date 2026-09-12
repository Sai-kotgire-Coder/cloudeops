# Vault Lab

Vault is the industry-standard tool for secrets management: storing passwords, API keys, and certificates in one controlled place — instead of scattered across config files and chat messages — with real, enforced access control over who (or what) can read each one.

> Reaching **5 access attempts** completes this module and earns you a certificate — check your progress on the [Certificates](app:/certificates) page.

## What you can do here

- **Enable a secrets engine** at a mount path — the plugin that handles a specific kind of secret.
- **Write versioned secrets** and roll back to any previous version.
- **Write HCL policies** that grant specific capabilities on specific paths.
- **Create tokens** and attach policies to them.
- **Attempt to read a secret as a given token**, and see a real allow or a real "permission denied" based on whether the attached policy actually covers it.

## Core concepts

### Secrets engines: a plugin per kind of secret

A secrets engine handles one specific kind of secret. **KV** (key-value) is the simplest and most common — it just stores whatever you give it. Others, like a database engine, actively *generate* brand-new, short-lived credentials on demand rather than storing something static. An engine is mounted at a path (e.g. `secret/`), and everything under that path is governed by that engine's own logic. Dynamic credentials come with a "lease" — a time-to-live after which they automatically stop working — so a leaked dynamic credential quietly self-destructs, while a leaked static password lives forever unless someone happens to notice and rotate it.

### KV versioning: nothing is silently overwritten

Writing to an existing path with the KV v2 engine doesn't overwrite the old value — it creates a new version and keeps every previous one intact. Reading returns the latest version by default, but any specific historical version stays retrievable. A bad rotation ("wrong password pushed by mistake") becomes trivially recoverable — roll back to the previous version, which itself just becomes a new version on top, rather than history ever being destroyed by a routine write.

### Policies: nothing is accessible by default

A policy is an HCL document naming specific paths and the capabilities (read, write, list, delete) allowed on each. There is no default access anywhere — if no policy grants a capability on a given path, the request is denied, full stop. This turns "who can see this secret" into an explicit, reviewable document instead of tribal knowledge, and it's what makes the Principle of Least Privilege enforceable in practice: write the narrowest path pattern that actually works, not a broad wildcard "just in case."

### Tokens: proof of identity, everywhere

A token is Vault's core mechanism of identity — every single request, human or machine, is made with one, and its attached policies are the only thing standing between "allowed" and "denied." Other real-world auth methods (AppRole for machines, LDAP for humans) all ultimately resolve down to a token carrying policies — this is the one universal mechanism underneath everything else. Revoking a single compromised token doesn't touch anyone else's access, which is exactly why scoping each service or pipeline to its own narrow token — rather than sharing one broad one everywhere — meaningfully limits how much damage a single leak can cause.

## Common beginner mistakes

- **Attaching no policy and being confused why every read is denied.** No policy means no access — Vault has no implicit "probably fine" fallback.
- **Writing an overly broad path pattern.** `secret/*` technically works, but it defeats the entire point of least-privilege access — narrow patterns are the actual discipline worth building.
- **Forgetting `list` is a separate capability from `read`.** A token can be allowed to see that secrets exist at a path without being able to read their actual values — that's often intentional, not a bug.

## Try it yourself

1. Enable a KV secrets engine and write a secret to it.
2. Write it again with a different value, then check its version history and roll back to the earlier version.
3. Write a policy granting access to exactly one path, attach it to a new token, and attempt a read as that token — then try reading a *different* path as the same token and confirm it's denied.
4. Reach 5 total access attempts to complete this module and check [Certificates](app:/certificates).
