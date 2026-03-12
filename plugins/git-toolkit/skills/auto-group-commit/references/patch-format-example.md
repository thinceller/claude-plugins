# Patch Format Example

When extracting specific hunks from a file's diff for `git apply --cached`, the patch must be a valid unified diff.

## Scenario

`git diff src/utils.ts` produces a diff with 2 hunks:

```diff
diff --git a/src/utils.ts b/src/utils.ts
index abc1234..def5678 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -10,6 +10,12 @@ import { Logger } from './logger';

 const MAX_RETRIES = 3;

+export function validateEmail(email: string): boolean {
+  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+  return re.test(email);
+}
+
+
 export function formatDate(date: Date): string {
   return date.toISOString();
 }
@@ -45,7 +51,7 @@ export function parseConfig(raw: string): Config {
   const parsed = JSON.parse(raw);
-  return parsed;
+  return { ...DEFAULT_CONFIG, ...parsed };
 }
```

## Extracting only the first hunk (validateEmail)

To stage only the `validateEmail` addition (hunk 1), write this patch:

```diff
diff --git a/src/utils.ts b/src/utils.ts
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -10,6 +10,12 @@ import { Logger } from './logger';

 const MAX_RETRIES = 3;

+export function validateEmail(email: string): boolean {
+  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+  return re.test(email);
+}
+
+
 export function formatDate(date: Date): string {
   return date.toISOString();
 }
```

Then apply:

```bash
git apply --cached /tmp/auto-group-commit-1.patch
```

## Key rules

1. **Headers are required**: `diff --git`, `--- a/`, `+++ b/` lines must be present
2. **Copy hunk headers exactly**: The `@@ -10,6 +10,12 @@` line must have correct line numbers from the current diff
3. **Include context lines**: The unchanged lines (no `+` or `-` prefix) surrounding the change must be included
4. **One patch per group**: Each temporary patch file should contain all hunks for that commit group from a single file. Run `git apply --cached` once per file per group.
5. **Index line is optional**: The `index abc1234..def5678 100644` line can be omitted
