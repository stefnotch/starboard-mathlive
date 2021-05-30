// @ts-ignore
import "mathlive/dist/mathlive-fonts.css";

import {
  CellTypeDefinition,
  CellHandlerAttachParameters,
  CellHandler,
  CellElements,
  Cell,
  StarboardPlugin,
} from "starboard-notebook/dist/src/types";
import { html, render } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html";
import { Runtime } from "starboard-notebook/dist/src/types";
import type { MathfieldElement } from "mathlive";

const mathlivePromise = import("mathlive");

export function registerMathlive(runtime: Runtime) {
  /* These globals are exposed by Starboard Notebook. We can re-use them so we don't have to bundle them again. */
  const lit = runtime.exports.libraries.lit;

  const StarboardTextEditor = runtime.exports.elements.StarboardTextEditor;
  const cellControlsTemplate = runtime.exports.templates.cellControls;

  document.head.insertAdjacentHTML(
    "beforeend",
    `<style>math-field:hover,
  math-field:focus,
  math-field:focus-within {
    outline: var(--border-color-secondary) auto 1px;
  }
  math-field {
    transition: outline 0.2s ease-in-out;
  }
  </style>`
  );

  const MATHLIVE_CELL_TYPE_DEFINITION: CellTypeDefinition = {
    name: "Mathlive",
    cellType: ["mathlive", "math"],
    createHandler: (cell: Cell, runtime: Runtime) =>
      new MathLiveCellHandler(cell, runtime),
  };

  class MathLiveCellHandler implements CellHandler {
    private elements!: CellElements;
    private editor?: MathfieldElement;

    private changeListener: () => any;

    cell: Cell;
    runtime: Runtime;

    constructor(cell: Cell, runtime: Runtime) {
      this.changeListener = () => this.run();
      this.cell = cell;
      this.runtime = runtime;
    }

    clear(): void {
      // Nothing to clear, so eh
    }

    attach(params: CellHandlerAttachParameters) {
      this.elements = params.elements;

      // TODO: More of this stuff https://github.com/stefnotch/quantum-sheet/blob/master/src/ui/elements/ExpressionElement.vue
      mathlivePromise.then((ml) => {
        const editor = new ml.MathfieldElement({
          defaultMode: "math",
          // smartSuperscript: true,
          removeExtraneousParentheses: true,
          smartFence: true,
          plonkSound: null as any,
          keypressSound: null as any,
          onContentDidChange: (mf) => {
            this.cell.textContent = mf.getValue("latex");
          },
          onCommit: (mf) => {
            // TODO: Ask the CAS
          },
          onMoveOutOf: (mf, direction) => {
            if (direction === "upward" || direction === "backward") {
              this.runtime.controls.emit({
                type: "FOCUS_CELL",
                id: this.cell.id,
                focus: "previous",
              });
              return false;
            } else if (direction === "downward" || direction === "forward") {
              this.runtime.controls.emit({
                type: "FOCUS_CELL",
                id: this.cell.id,
                focus: "next",
              });
              return false;
            }
            return true;
          },
        });

        // TODO: Fix alt+enter

        editor.value = this.cell.textContent;
        editor.style.fontSize = "18px";

        // TODO: Turn off the accessible part? Or at least hide the errors?
        // `mathfield.accessibleNode.innerHTML = mathfield.options.createHTML(`

        this.editor = editor;
        this.elements.topElement.appendChild(editor);
      });

      this.runtime.controls.subscribeToCellChanges(
        this.cell.id,
        this.changeListener
      );
      this.run();
    }

    async run() {
      const content = this.cell.textContent;
      /*if (content) {
        render(
          html`${unsafeHTML("\n" + content + "\n")}`,
          this.elements.bottomElement
        );
      }*/
    }

    focusEditor() {
      this.editor?.focus?.();
      this.editor?.executeCommand?.("moveToMathFieldStart");
    }

    async dispose() {
      const editor = this.editor;
      if (editor) {
        this.elements.topElement.removeChild(editor);
      }
      this.runtime.controls.unsubscribeToCellChanges(
        this.cell.id,
        this.changeListener
      );
    }
  }

  runtime.definitions.cellTypes.register(
    MATHLIVE_CELL_TYPE_DEFINITION.cellType,
    MATHLIVE_CELL_TYPE_DEFINITION
  );
}

export const plugin: StarboardPlugin = {
  id: "starboard-mathlive",
  metadata: {
    name: "Starboard Mathlive",
  },
  exports: {},
  async register(runtime, opts = {}) {
    registerMathlive(runtime);
  },
};
