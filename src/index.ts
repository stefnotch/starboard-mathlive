// @ts-ignore
import "mathlive/dist/mathlive-fonts.css";

import {
  CellTypeDefinition,
  CellHandlerAttachParameters,
  CellElements,
  Cell,
  StarboardPlugin,
} from "starboard-notebook/dist/src/types";
import { html, render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import { Runtime } from "starboard-notebook/dist/src/types";
import type { StarboardTextEditor as StarboardTextEditorType } from "starboard-notebook/dist/src/components/textEditor";

declare global {
  interface Window {
    runtime: Runtime;
  }
}

export function registerMathlive() {
  /* These globals are exposed by Starboard Notebook. We can re-use them so we don't have to bundle them again. */
  const runtime = window.runtime;
  const lithtml = runtime.exports.libraries.LitHtml;

  const StarboardTextEditor = runtime.exports.elements.StarboardTextEditor;
  const cellControlsTemplate = runtime.exports.templates.cellControls;
  const icons = runtime.exports.templates.icons;

  const PYTHON_CELL_TYPE_DEFINITION: CellTypeDefinition = {
    name: "Mathlive",
    cellType: ["mathlive", "math"],
    createHandler: (cell: Cell, runtime: Runtime) =>
      new MathLiveCellHandler(cell, runtime),
  };

  class MathLiveCellHandler {
    private elements!: CellElements;
    private editor!: StarboardTextEditorType;

    private changeListener: () => any;

    cell: Cell;
    runtime: Runtime;

    constructor(cell: Cell, runtime: Runtime) {
      this.changeListener = () => this.run();
      this.cell = cell;
      this.runtime = runtime;
    }

    attach(params: CellHandlerAttachParameters) {
      this.elements = params.elements;

      this.editor = new StarboardTextEditor(this.cell, this.runtime, {
        language: "css",
      });
      this.elements.topElement.appendChild(this.editor);
      this.runtime.controls.subscribeToCellChanges(
        this.cell.id,
        this.changeListener
      );
      this.run();
    }

    async run() {
      const content = this.cell.textContent;
      if (content) {
        render(
          html`${unsafeHTML("\n" + content + "\n")}`,
          this.elements.bottomElement
        );
      }
    }

    focusEditor() {
      if (this.editor) {
        this.editor.focus();
      }
    }

    async dispose() {
      if (this.editor) {
        this.editor.dispose();
      }
      this.runtime.controls.unsubscribeToCellChanges(
        this.cell.id,
        this.changeListener
      );
    }
  }

  runtime.definitions.cellTypes.register(
    PYTHON_CELL_TYPE_DEFINITION.cellType,
    PYTHON_CELL_TYPE_DEFINITION
  );
}

export const plugin: StarboardPlugin = {
  id: "starboard-mathlive",
  metadata: {
    name: "Starboard Mathlive",
  },
  exports: {},
  async register(opts = {}) {
    registerMathlive();
  },
};
