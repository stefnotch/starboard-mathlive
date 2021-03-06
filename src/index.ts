// @ts-ignore
import "mathlive/dist/mathlive-fonts.css";

import type {
  CellTypeDefinition,
  CellHandlerAttachParameters,
  CellHandler,
  CellElements,
  Cell,
  StarboardPlugin,
  Runtime,
} from "starboard-notebook/dist/src/types";
import type { MathfieldElement } from "mathlive";
import type { OutputFormat } from "mathlive/dist/public/mathfield";
import type Lit from "lit";
import {
  parse as parseMathJson,
  serialize as serializeMathJson,
} from "@cortex-js/compute-engine";
import { Style } from "mathlive/dist/public/core";

const mathlivePromise = import("mathlive");

let previouslyFocusedCell: string | null = null;
let previousCaretPoint: { x: number; y: number } | null = null;

function useContextMenu(lit: typeof Lit) {
  const styles = `
.mathlive-context-menu {
  position: fixed;
  z-index: 1000;
  display: none;
  padding: 0px;
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
}
.mathlive-context-menu li {
  padding: 0px;
  margin: 0px;
}
.mathlive-context-menu .context-menu-header {
  display: block;
  margin-bottom: 0;
  font-size: .875rem;
  color: #6c757d;
  white-space: nowrap;
  padding: .5rem 1rem;
}
.mathlive-context-menu .context-menu-button {
  display: block;
  width: 100%;
  margin: 0px;
  padding: .25rem 1rem;
  text-align: start;
  background: initial;
  border: 0px;
}
.mathlive-context-menu .context-menu-button:hover {
  cursor: pointer;
  background: #e9ecef;
}
`;

  // Context menu with focusable entries
  // https://itnext.io/how-to-create-a-custom-right-click-menu-with-javascript-9c368bb58724
  // https://stackoverflow.com/questions/152975/how-do-i-detect-a-click-outside-an-element
  const contextMenu = document.createElement("div");
  contextMenu.classList.add("mathlive-context-menu");
  contextMenu.style.minWidth = "244px";

  let copyCallback = (type: OutputFormat) => {};
  let styleCallback = (style: Style) => {};

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
  <li><h6 class="context-menu-header">Format</h6></li>
  <li>
    <button
      title="Clear Formatting"
      class="context-menu-button" 
      tabindex="0"
      @click=${() => {
        styleCallback({
          color: "",
        });
        contextMenu.classList.remove("show");
      }}
    >
     Clear
    </button>
    <button
      title="Text Color"
      class="context-menu-button" 
      tabindex="0"
      @click=${() => {
        styleCallback({
          color: "red",
        });
        contextMenu.classList.remove("show");
      }}
    >
     Color
    </button>
  </li>
  <li><h6 class="context-menu-header">Copy as</h6></li>
  <li>
    <button
      title="Kinky"
      class="context-menu-button" 
      tabindex="0"
      @click=${() => {
        copyCallback("latex-expanded");
        contextMenu.classList.remove("show");
      }}
    >
     Latex Expanded
    </button>
  </li>
  <li>
    <button
      title="Asciimath"
      class="context-menu-button" 
      tabindex="0"
      @click=${() => {
        copyCallback("ascii-math");
        contextMenu.classList.remove("show");
      }}
    >
    Asciimath
    </button>
  </li>
  <li>
    <button
      title="MathJson"
      class="context-menu-button" 
      tabindex="0"
      @click=${() => {
        copyCallback("math-json");
        contextMenu.classList.remove("show");
      }}
    >
    MathJson
    </button>
  </li>
</ul>`,
    contextMenu
  );

  function showContextMenu(opts: {
    x: number;
    y: number;
    copyCallback: (type: OutputFormat) => void;
    styleCallback: (type: Style) => void;
  }) {
    // https://itnext.io/how-to-create-a-custom-right-click-menu-with-javascript-9c368bb58724
    // Check what starboard does for some of the popup menus
    copyCallback = opts.copyCallback;
    styleCallback = opts.styleCallback;

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

function parseCellContent(textContent: string) {
  // Parse mathjson and use latex as fallback content
  // It's like this for now, because mathjson is still in beta, I guess
  const cellText = textContent;
  if (cellText.startsWith("$") && cellText.endsWith("$")) {
    return cellText.replace(/^\$+|\$+$/g, "");
  } else {
    let lines = cellText.split("\n").filter((v) => v.length > 0);
    let parsedMathJson = "";
    try {
      parsedMathJson = serializeMathJson(JSON.parse(lines[0]));
    } catch (e) {
      parsedMathJson = "";
    }
    if (parsedMathJson) {
      return parsedMathJson;
    } else if (lines.length > 1) {
      return lines[1].replace(/^\$+|\$+$/g, "");
    }
  }
  return "";
}

export function registerMathlive(runtime: Runtime) {
  /* These globals are exposed by Starboard Notebook. We can re-use them so we don't have to bundle them again. */
  const lit = runtime.exports.libraries.lit;

  const StarboardTextEditor = runtime.exports.elements.StarboardTextEditor;
  const cellControlsTemplate = runtime.exports.templates.cellControls;

  // Definitely a hack
  // @ts-ignore
  window["mathlive-to-expanded-latex"] = async function mathliveSerializer() {
    const ml = await mathlivePromise;

    const editor = new ml.MathfieldElement({
      defaultMode: "math",
      keypressSound: null,
      plonkSound: null,
      keypressVibration: false,
    });
    editor.style.opacity = "0";
    editor.style.pointerEvents = "none";
    document.body.appendChild(editor);

    function toExpandedLatex(textContent: string) {
      editor.value = parseCellContent(textContent);
      console.log(editor.getValue("latex-expanded"));
      return editor.getValue("latex-expanded");
    }

    function dispose() {
      document.body.removeChild(editor);
    }

    return {
      toExpandedLatex,
      dispose,
    };
  };

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
          plonkSound: null,
          keypressSound: null,
          onContentDidChange: (mf) => {
            this.cell.textContent =
              mf.getValue("math-json").replace(/\n/g, "") +
              "\n$" +
              mf.getValue("latex") +
              "$";
          },
          onCommit: (mf) => {
            this.run();
          },
          onMoveOutOf: (mf, direction) => {
            if (direction === "upward") {
              this.runtime.controls.emit({
                type: "FOCUS_CELL",
                id: this.cell.id,
                focus: "previous",
              });
              previouslyFocusedCell = this.cell.id;
              previousCaretPoint = editor.caretPoint;
              return false;
            } else if (direction === "downward") {
              this.runtime.controls.emit({
                type: "FOCUS_CELL",
                id: this.cell.id,
                focus: "next",
              });
              previouslyFocusedCell = this.cell.id;
              previousCaretPoint = editor.caretPoint;
              return false;
            } else if (direction === "backward") {
              editor.executeCommand("moveToMathFieldEnd");
              return false;
            } else if (direction === "forward") {
              editor.executeCommand("moveToMathFieldStart");
              return false;
            }
            return true;
          },
          onExport: (mf, latex, range) => {
            return `$\\displaystyle ${latex}$`;
          },
        });

        editor.addEventListener("pointerup", (ev) => {
          if (ev.button === 2) {
            showContextMenu({
              x: ev.clientX,
              y: ev.clientY,
              copyCallback: function (type: OutputFormat) {
                let isSelectionNone = editor.selection.ranges.every(
                  (range) => range[0] === range[1]
                );

                const selectedText = isSelectionNone
                  ? editor.getValue(type)
                  : editor.getValue(editor.selection, type);
                navigator.clipboard.writeText("" + selectedText).then(
                  function () {
                    console.log("Copied to clipboard");
                  },
                  function (e) {
                    console.log("Failed to copy to clipboard", e);
                  }
                );
              },
              styleCallback: function (style: Style) {
                let isSelectionNone = editor.selection.ranges.every(
                  (range) => range[0] === range[1]
                );
                if (!isSelectionNone) {
                  editor.applyStyle(style);
                }
              },
            });
          }
        });

        editor.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          return false;
        });

        // TODO: Fix cdot

        editor.value = parseCellContent(this.cell.textContent);

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

        this.editor = editor;
        this.elements.topElement.appendChild(editor);
      });
    }

    focusEditor(opts: { position?: "start" | "end" }) {
      this.editor?.focus?.();
      this.editor?.executeCommand?.("moveToMathFieldStart");

      const editor = this.editor;
      if (
        previouslyFocusedCell != null &&
        previousCaretPoint != null &&
        editor != null
      ) {
        let previousIndex = this.runtime.content.cells.findIndex(
          (c) => previouslyFocusedCell === c.id
        );
        let thisIndex = this.runtime.content.cells.findIndex(
          (c) => this.cell.id === c.id
        );
        if (
          previousIndex >= 0 &&
          (previousIndex + 1 === thisIndex || previousIndex - 1 === thisIndex)
        ) {
          const editorRect = editor.getBoundingClientRect();

          editor.setCaretPoint(
            previousCaretPoint.x,
            opts?.position === "end" ? editorRect.bottom : editorRect.top
          );

          previouslyFocusedCell = null;
          previousCaretPoint = null;
        }
      }
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
