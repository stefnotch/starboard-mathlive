# [starboard-mathlive](https://stefnotch.github.io/starboard-mathlive/)

Mathlive in a starboard notebook! View it in action [here](https://stefnotch.github.io/starboard-mathlive/)

## TODO: Starboard stuff

Some quick shortcut/typing to insert a new cell type??

`Shift`+`Enter` at the last line: focuses the create cell button  
`js`: the search thingy is searching for js and suggests the Javascript cell type  
`Enter`: Inserts the Javascript cell

use starboard-editor for the demo https://github.com/stefnotch/starboard-editor

Undo and redo support for deleting/adding cells

todo: Why can you have a codemirror editor above a monaco editor? how?  
todo: use this for solving a maths exercise  
todo: don't bother with pyodide for now, instead focus on putting the maths editor on steroids  
todo: getting 'stuck' in latex mode `\R[enter]\[backspace]`? (maybe I should add some indicator for that mode? like 'hit esc to exit')  
todo: should latex mode optionally get exited when the user hits the space bar?  
todo:

> Expression prediction or just plain old autocomplete is something I'd be quite interested in. However, it might be pretty hard to cover 'everything', so, it would probably be a good idea to make it configurable.
> My use cases would be things like `lim n` and then the autocomplete suggesting `lim n -> infinity`.
> Or autocompleting according to what was written in the previous line

todo: autoalign? As in x = a = b = c = d in an aligned environment with the equals signs below each other
todo: context menu formatting (clear formatting, color, background color, bold, ..)

> here's a quick video of our Algebra diasgnostics tool now fully running on Mathlive. Note multi-selection, equation transformations animated, dynamic input box, add-to-both-sides etc > (some of which needed some pretty complex manipulatoin of the mathlive dom fragments.
> https://youtu.be/cM0SAX-7cYg

look at https://www.symbolab.com/ , since it does some useful things

advertise mathlive (+mathjson) and starboard

Import/export plugin
https://discord.com/channels/818559380827144253/818559381398487052/838187388362424331
https://starboard.gg/gz/custom-serialization-nNFrigs
https://github.com/gzuidhof/starboard-notebook/issues/2

Pyodide web worker/shared worker (comlink?)

Starboard UI improvements :thinking: (like the add cell button location, especially with an empty notebook)

publish to npm

We can probably avoid shipping the KaTeX fonts (because starboard depends on KaTeX)
