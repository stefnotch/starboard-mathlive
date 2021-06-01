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
import { Runtime } from "starboard-notebook/dist/src/types";
import type { MathfieldElement } from "mathlive";
import type Lit from "lit";

const mathlivePromise = import("mathlive");

function useContextMenu(lit: typeof Lit) {
  const styles = `
.mathlive-context-menu {
  position: fixed;
  z-index: 1000;
  display: none;
  padding: .5rem 1rem;
  margin: 0;
  font-size: 1rem;
  color: #212529;
  text-align: left;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0,0,0,.15);
  border-radius: var(--border-radius);
  opacity: 1;
}
.mathlive-context-menu .dropdown-item:hover {
  cursor: pointer;
}
.mathlive-context-menu.show {
  display: block;
}
.mathlive-context-menu.transparent {
  opacity: 0;
}
.mathlive-context-menu ul {
  padding: 0;
  margin: 0;
  list-style: none;
}`;

  // Context menu with focusable entries
  // https://itnext.io/how-to-create-a-custom-right-click-menu-with-javascript-9c368bb58724
  // https://stackoverflow.com/questions/152975/how-do-i-detect-a-click-outside-an-element
  const contextMenu = document.createElement("div");
  contextMenu.classList.add("mathlive-context-menu");
  contextMenu.style.minWidth = "244px";
  let contextMenuCloseTimeout: number | null = null;
  contextMenu.addEventListener("focusin", (ev) => {
    if (contextMenuCloseTimeout !== null) clearTimeout(contextMenuCloseTimeout);
  });
  contextMenu.addEventListener("focusout", (ev) => {
    contextMenuCloseTimeout = setTimeout(
      (() => {
        contextMenu.classList.remove("show");
      }) as TimerHandler,
      0
    );
  });
  contextMenu.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      contextMenu.classList.remove("show");
    }
  });
  lit.render(
    lit.html`<ul>
  <li><h6 class="dropdown-header">Copy as</h6></li>
  <li class="first-focusable dropdown-item" tabindex="0">
    <button
      title="Cat"
      class="dropdown-item${"active"}"
      @click=${() => {}}
    >
     cattto <span
        style="opacity: 0.6; float: right; font-size: 11px; font-family: var(--font-mono)"
        >Cat</span>
    </button>
  </li>
</ul>`,
    contextMenu
  );

  function showContextMenu(opts: { x: number; y: number }) {
    // TODO: Show context menu
    // https://itnext.io/how-to-create-a-custom-right-click-menu-with-javascript-9c368bb58724
    // Check what starboard does for some of the popup menus
    // editor.getValue(editor.selection, )
    contextMenu.classList.add("transparent");
    contextMenu.classList.add("show");

    const boundingRect = contextMenu.getBoundingClientRect();

    // document.documentElement.clientHeight
    if (opts.x + boundingRect.width <= document.documentElement.clientWidth) {
      contextMenu.style.left = opts.x + "px";
    } else {
      contextMenu.style.left =
        document.documentElement.clientWidth - boundingRect.width + "px";
    }
    contextMenu.style.top = opts.y + "px";

    setTimeout(() => {
      contextMenu.classList.remove("transparent");
      contextMenu.querySelector<HTMLElement>(".first-focusable")?.focus();
    });
  }
  return { styles, contextMenu, showContextMenu };
}

export function registerMathlive(runtime: Runtime) {
  /* These globals are exposed by Starboard Notebook. We can re-use them so we don't have to bundle them again. */
  const lit = runtime.exports.libraries.lit;

  const StarboardTextEditor = runtime.exports.elements.StarboardTextEditor;
  const cellControlsTemplate = runtime.exports.templates.cellControls;

  const {
    styles: contextMenuStyles,
    contextMenu,
    showContextMenu,
  } = useContextMenu(lit);

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
  ${contextMenuStyles}
  </style>`
  );

  document.body.appendChild(contextMenu);

  const MATHLIVE_CELL_TYPE_DEFINITION: CellTypeDefinition = {
    name: "Mathlive",
    cellType: ["mathlive"],
    createHandler: (cell: Cell, runtime: Runtime) =>
      new MathLiveCellHandler(cell, runtime),
  };

  class MathLiveCellHandler implements CellHandler {
    private elements!: CellElements;
    private editor?: MathfieldElement;

    cell: Cell;
    runtime: Runtime;

    constructor(cell: Cell, runtime: Runtime) {
      this.cell = cell;
      this.runtime = runtime;
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
            this.run();
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

        editor.addEventListener("pointerup", (ev) => {
          if (ev.button === 2) {
            showContextMenu({
              x: ev.clientX,
              y: ev.clientY,
            });
          }
        });

        editor.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          return false;
        });

        // TODO: Fix alt+enter

        editor.value = this.cell.textContent;
        editor.style.fontSize = "18px";

        // Later down the road we can use "adoptedStyleSheets"
        const caretCustomStyle = document.createElement("style");
        caretCustomStyle.innerHTML = `.ML__caret:after {
          border-right-width: 0px !important;
          margin-right: 0px !important;
          width: 0px !important;
          box-shadow: 0px 0px 0px 1px var(--caret,hsl(var(--hue,212),40%,49%));
         }`;
        editor.shadowRoot?.appendChild?.(caretCustomStyle);

        // editor._mathfield.model.getValue could be overriden/wrapped to tweak the copying

        this.editor = editor;
        this.elements.topElement.appendChild(editor);
      });
    }

    focusEditor() {
      this.editor?.focus?.();
      this.editor?.executeCommand?.("moveToMathFieldStart");
    }

    async run() {
      // TODO: Ask the CAS
    }

    clear(): void {
      // Nothing to to do, so eh
    }

    async dispose() {
      const editor = this.editor;
      if (editor) {
        this.elements.topElement.removeChild(editor);
      }
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
