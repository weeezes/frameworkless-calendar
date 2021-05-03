#!/usr/bin/env node
const { build, watch, cliopts } = require("estrella")
const postCssPlugin = require("./esbuild-plugin-postcss.js")
const postCssConfig = require("./postcss.config.js")

const fs = require("fs-extra");
const process = require("process");
const postcss = require("postcss");
const util = require("util");
const path = require("path");
const postcssConfig = require("./postcss.config.js");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const buildTS = build({
  entry: ["src/main.ts"],
  outdir: "dist/",
  bundle: true,
  minify: true,
  plugins: [
    postCssPlugin(postCssConfig),
  ],
})

if (cliopts.watch) {
  watch(".", {}, async (changes) => {
    for (var i in changes) {
      if (changes[i].name.indexOf("dist") == 0) {
        continue
      }
      const absolutePath = path.resolve(process.cwd(), changes[i].name);
      const ext = path.parse(absolutePath).ext;
      if (ext == ".css") {
        const sourceBaseName = path.basename(absolutePath, ext);
        const toFilePath = path.resolve("dist/", `${sourceBaseName}${ext}`);
        const css = await readFile(absolutePath);
        const result = await postcss(postCssConfig.plugins).process(css, {
          from: absolutePath,
          to: toFilePath,
        });
        await writeFile(toFilePath, result.css);
      }
    }
  })
}
