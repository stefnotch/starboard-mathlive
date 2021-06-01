# [starboard-mathlive](https://stefnotch.github.io/starboard-mathlive/)

Mathlive in a starboard notebook! View it in action [here](https://stefnotch.github.io/starboard-mathlive/)

## TODO: Starboard stuff

Undo and redo support for deleting/adding cells

focused cell

Fix alt+enter

todo: use this for solving a maths exercise  
todo: mathlive highlighting behaviour?  
todo: don't bother with pyodide for now, instead focus on putting the maths editor on steroids  
todo: is getting 'stuck' in text mode a bug `\R[enter]\[backspace]`?  
todo: should latex mode optionally get exited when the user hits the space bar?  
todo: 
> Expression prediction or just plain old autocomplete is something I'd be quite interested in. However, it might be pretty hard to cover 'everything', so, it would probably be a good idea to make it configurable.
> My use cases would be things like `lim n` and then the autocomplete suggesting `lim n -> infinity`.
> Or autocompleting according to what was written in the previous line

look at https://www.symbolab.com/ , since it does some useful things

advertise mathlive (+mathjson) and starboard

Import/export plugin
https://discord.com/channels/818559380827144253/818559381398487052/838187388362424331
https://starboard.gg/gz/custom-serialization-nNFrigs
https://github.com/gzuidhof/starboard-notebook/issues/2

Pyodide web worker/shared worker (comlink?)

Starboard UI improvements :thinking: (like the add cell button location, especially with an empty notebook)

Notebook in URL :thinking:

publish to npm

Some quick shortcut/typing to insert a new cell type??

`Shift`+`Enter` at the last line: focuses the create cell button  
`js`: the search thingy is searching for js and suggests the Javascript cell type  
`Enter`: Inserts the Javascript cell

use starboard-wrap for the demo

[native filesystem](https://web.dev/file-system-access/), including opening an entire directory (persist in indexeddb and use this library https://web.dev/browser-fs-access/ )

We can probably avoid shipping the KaTeX fonts (because starboard depends on KaTeX)
