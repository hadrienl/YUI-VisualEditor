Presentation
============

VisualEditor is a Rich Text Editor wrote by MediaWiki. **It's the better RTE ever** !
Don't work with crappy content editable based html wysiwyg editors working making
different tag soup depending on browser.
This editor is full javascript and produce clean text data without any html tag.

Its only problem is jQuery. I have to implement it in an
[Yoshioka.js](https://github.com/hadrienl/yoshioka.js "Yoshioka.js project")
application and loading 300Ko of jQuery is unproductive. I have to rewrite all
this code with YUI3 library instead of jQuery. And why not, enhance it :o

