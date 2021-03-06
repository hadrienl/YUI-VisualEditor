/* Perform post-processing steps on an already-built HTML DOM. */

var isBlock = function isBlock (name) {
	switch (name.toLowerCase()) {
		case 'div':
		case 'table':
		case 'td':
		case 'tr':
		case 'tbody':
		case 'p':
		case 'ul':
		case 'ol':
		case 'li':
		case 'dl':
		case 'dt':
		case 'dd':
		case 'img': // hmm!
		case 'pre':
		case 'center':
		case 'blockquote':
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			return true;
		default:
			return false;
	}
};

// Quick HACK: define Node constants
// https://developer.mozilla.org/en/nodeType
var Node = {
	TEXT_NODE: 3,
	COMMENT_NODE: 8
};

// Wrap all top-level inline elements in paragraphs. This should also be
// applied inside block-level elements, but in that case the first paragraph
// usually remains plain inline.
var process_inlines_in_p = function ( document ) {
	var body = document.body,
		newP = document.createElement('p'),
		cnodes = body.childNodes,
		haveInlines = false,
		deleted = 0;

	function isElementContentWhitespace ( e ) {
		return (e.data.match(/^[ \r\n\t]*$/) !== null);
	}

	for(var i = 0, length = cnodes.length; i < length; i++) {
		var child = cnodes[i - deleted],
			ctype = child.nodeType;
		//console.log(child + ctype);
		if ((ctype === 3 && (haveInlines || !isElementContentWhitespace(child))) || 
				(ctype !== Node.TEXT_NODE &&
				 ctype !== Node.COMMENT_NODE &&
				 !isBlock(child.nodeName))) {
			// text node
			newP.appendChild(child);
			haveInlines = true;
			deleted++;
		} else if (haveInlines) {
			body.insertBefore(newP, child);
			newP = document.createElement('p');
			haveInlines = false;
		}	
	}

	if (haveInlines) {
		body.appendChild(newP);
	}
};

function DOMPostProcessor () {
	this.processors = [process_inlines_in_p];
}

DOMPostProcessor.prototype.doPostProcess = function ( document ) {
	for(var i = 0; i < this.processors.length; i++) {
		this.processors[i](document);
	}
};


if (typeof module == "object") {
	module.exports.DOMPostProcessor = DOMPostProcessor;
}
