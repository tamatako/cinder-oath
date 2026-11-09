import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const output = resolve("dist");

test("all script, stylesheet and battlefield URLs survive a repository subpath", async () => {
  const html = await readFile(resolve(output, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((match) => match[1]);
  assert.ok(scripts.length && styles.length, "built scripts and styles are present");

  const repositoryUrl = new URL("https://example.github.io/cinder-oath/");
  for (const asset of [...scripts, ...styles]) {
    assert.equal(new URL(asset, repositoryUrl).pathname.startsWith("/cinder-oath/"), true, asset);
    assert.ok((await stat(resolve(output, asset))).size > 0, asset);
  }

  const css = await readFile(resolve(output, styles[0]), "utf8");
  const battlefield = css.match(/url\((?:"|')?([^)'"\s]*battlefield[^)'"\s]*)(?:"|')?\)/)?.[1];
  assert.ok(battlefield, "battlefield is bundled");
  const cssUrl = new URL(styles[0], repositoryUrl);
  assert.equal(new URL(battlefield, cssUrl).pathname.startsWith("/cinder-oath/"), true);
  assert.ok((await stat(resolve(output, styles[0], "..", battlefield))).size > 1000);
});
