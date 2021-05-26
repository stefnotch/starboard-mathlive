import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";
import copy from "rollup-plugin-copy";

const CleanCSS = require("clean-css");

// Inline plugin to load css as minified string
const css = () => {
  return {
    name: "css",
    transform(code, id) {
      if (id.endsWith(".css")) {
        const minified = new CleanCSS({ level: 2 }).minify(code);
        return `export default ${JSON.stringify(minified.styles)}`;
      }
    },
  };
};

export default [
  {
    input: `src/index.ts`,
    output: [{ dir: "dist", format: "es" }],
    plugins: [
      typescript({
        include: ["./src/*.ts"],
      }),
      resolve(),
      commonjs(),
      css(),
      copy({
        targets: [
          { src: "node_modules/mathlive/dist/fonts/*", dest: "dist/fonts" },
          { src: "index.html", dest: "dist" },
        ],
      }),
    ],
  },
  {
    input: `src/index.ts`,
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
];
