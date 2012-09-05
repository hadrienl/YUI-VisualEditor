/**
 * EditSurface namespace.
 * 
 * All classes and functions will be attached to this object to keep the global namespace clean.
 */
window.es = {};

/* Functions */

/**
 * Extends a constructor with the prototype of another.
 * 
 * When using this, it's required to include a call to the constructor of the parent class as the
 * first code in the child class's constructor.
 * 
 * @example
 *     // Define parent class
 *     function Foo() {
 *         // code here
 *     }
 *     // Define child class
 *     function Bar() {
 *         // Call parent constructor
 *         Foo.call( this );
 *     }
 *     // Extend prototype
 *     es.extendClass( Bar, Foo );
 * 
 * @static
 * @method
 * @param {Function} dst Class to extend
 * @param {Function} src Base class to use methods from
 */
es.extendClass = function( dst, src ) {
	var base = new src();
	for ( var method in base ) {
		if ( typeof base[method] === 'function' && !( method in dst.prototype ) ) {
			dst.prototype[method] = base[method];
		}
	}
};

es.extendObject = $.extend;

es.isPlainObject = $.isPlainObject;

es.isEmptyObject = $.isEmptyObject;

es.isArray = $.isArray;

/**
 * Wrapper for Array.prototype.indexOf
 * 
 * @param {Mixed} value Element to search for
 * @param {Array} array Array to search in
 * @param {Integer} [fromIndex=0] Index to being searching from
 * @return {Number} Index of value in array, or -1 if not found. Comparisons are done with ===
 */
es.inArray = $.inArray;

/**
 * Recursively compares string and number property between two objects.
 * 
 * A false result may be caused by property inequality or by properties in one object missing from
 * the other. An asymmetrical test may also be performed, which checks only that properties in the
 * first object are present in the second object, but not the inverse.
 * 
 * @static
 * @method
 * @param {Object} a First object to compare
 * @param {Object} b Second object to compare
 * @param {Boolean} [asymmetrical] Whether to check only that b contains values from a
 * @returns {Boolean} If the objects contain the same values as each other
 */
es.compareObjects = function( a, b, asymmetrical ) {
	var aValue, bValue, aType, bType;
	var k;
	for ( k in a ) {
		aValue = a[k];
		bValue = b[k];
		aType = typeof aValue;
		bType = typeof bValue;
		if ( aType !== bType ||
			( ( aType === 'string' || aType === 'number' ) && aValue !== bValue ) ||
			( es.isPlainObject( aValue ) && !es.compareObjects( aValue, bValue ) ) ) {
			return false;
		}
	}
	// If the check is not asymmetrical, recursing with the arguments swapped will verify our result
	return asymmetrical ? true : es.compareObjects( b, a, true );
};

/**
 * Recursively compare two arrays.
 * 
 * @static
 * @method
 * @param {Array} a First array to compare
 * @param {Array} b Second array to compare
 * @param {Boolean} [compareObjects] If true, use es.compareObjects() to compare objects, otherwise use ===
 */
es.compareArrays = function( a, b, compareObjects ) {
	var i, aValue, bValue, aType, bType;
	if ( a.length !== b.length ) {
		return false;
	}
	for ( i = 0; i < a.length; i++ ) {
		aValue = a[i];
		bValue = b[i];
		aType = typeof aValue;
		bType = typeof bValue;
		if ( aType !== bType || !(
			( es.isArray( aValue ) && es.isArray( bValue ) && es.compareArrays( aValue, bValue ) ) ||
			( compareObjects && es.isPlainObject( aValue ) && es.compareObjects( aValue, bValue ) ) ||
			aValue === bValue
		) ) {
			return false;
		}
	}
	return true;
};

/**
 * Gets a deep copy of an array's string, number, array and plain-object contents.
 * 
 * @static
 * @method
 * @param {Array} source Array to copy
 * @returns {Array} Copy of source array
 */
es.copyArray = function( source ) {
	var destination = [];
	for ( var i = 0; i < source.length; i++ ) {
		var sourceValue = source[i],
			sourceType = typeof sourceValue;
		if ( sourceType === 'string' || sourceType === 'number' ) {
			destination.push( sourceValue );
		} else if ( es.isPlainObject( sourceValue ) ) {
			destination.push( es.copyObject( sourceValue ) );
		} else if ( es.isArray( sourceValue ) ) {
			destination.push( es.copyArray( sourceValue ) );
		}
	}
	return destination;
};

/**
 * Gets a deep copy of an object's string, number, array and plain-object properties.
 * 
 * @static
 * @method
 * @param {Object} source Object to copy
 * @returns {Object} Copy of source object
 */
es.copyObject = function( source ) {
	var destination = {};
	for ( var key in source ) {
		var sourceValue = source[key],
			sourceType = typeof sourceValue;
		if ( sourceType === 'string' || sourceType === 'number' ) {
			destination[key] = sourceValue;
		} else if ( es.isPlainObject( sourceValue ) ) {
			destination[key] = es.copyObject( sourceValue );
		} else if ( es.isArray( sourceValue ) ) {
			destination[key] = es.copyArray( sourceValue );
		}
	}
	return destination;
};

/**
 * Splice one array into another. This is the equivalent of arr.splice( offset, 0, i1, i2, i3, ... )
 * except that i1, i2, i3, ... are specified as an array rather than separate parameters.
 * 
 * @static
 * @method
 * @param {Array} dst Array to splice insertion into. Will be modified
 * @param {Number} offset Offset in arr to splice insertion in at. May be negative; see the 'index'
 * parameter for Array.prototype.splice()
 * @param {Array} src Array of items to insert
 */
es.insertIntoArray = function( dst, offset, src ) {
	// We need to splice insertion in in batches, because of parameter list length limits which vary
	// cross-browser - 1024 seems to be a safe batch size on all browsers
	var index = 0, batchSize = 1024;
	while ( index < src.length ) {
		// Call arr.splice( offset, 0, i0, i1, i2, ..., i1023 );
		dst.splice.apply(
			dst, [index + offset, 0].concat( src.slice( index, index + batchSize ) )
		);
		index += batchSize;
	}
};

/**
 * Gets a string with a pattern repeated a given number of times.
 * 
 * @static
 * @method
 * @param {String} pattern Pattern to repeat
 * @param {Integer} count Number of times to repeat pattern
 * @returns {String} String of repeated pattern
 */
es.repeatString = function( pattern, count ) {
	if ( count < 1 ) {
		return '';
	}
	var result = '';
	while ( count > 0 ) {
		if ( count & 1 ) { result += pattern; }
		count >>= 1;
		pattern += pattern;
	}
	return result;
};
/**
 * Static object with HTML generation helpers.
 */
es.Html = {
	'escapeText': function( text ) {
		return text
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#039;' );
	},
	'makeAttributeList': function( attributes, prespace ) {
		var attr = [];
		var name;
		if ( attributes ) {
			for ( name in attributes ) {
				attr.push( name + '="' + attributes[name] + '"' );
			}
		}
		return ( prespace && attr.length ? ' ' : '' ) + attr.join( ' ' );
	},
	'makeOpeningTag': function( name, attributes ) {
		return '<' + name + es.Html.makeAttributeList( attributes, true ) + '>';
	},
	'makeClosingTag': function( name ) {
		return '</' + name + '>';
	},
	'makeTag': function( name, attributes, value, escape ) {
		if ( value === false ) {
			return '<' + name + es.Html.makeAttributeList( attributes, true ) + ' />';
		} else {
			if ( escape ) {
				value = wiki.util.xml.esc( value );
			}
			return '<' + name + es.Html.makeAttributeList( attributes, true ) + '>' +
				value + '</' + name + '>';
		}
	}
};
/**
 * Pixel position.
 * 
 * This can also support an optional bottom field, to represent a vertical line, such as a cursor.
 * 
 * @class
 * @constructor
 * @param left {Integer} Horizontal position
 * @param top {Integer} Vertical top position
 * @param bottom {Integer} Vertical bottom position of bottom (optional, default: top)
 * @property left {Integer} Horizontal position
 * @property top {Integer} Vertical top position
 * @property bottom {Integer} Vertical bottom position of bottom
 */
es.Position = function( left, top, bottom ) {
	this.left = left || 0;
	this.top = top || 0;
	this.bottom = bottom || this.top;
};

/* Static Methods */

/**
 * Creates position object from the page position of an element.
 * 
 * @static
 * @method
 * @param $element {jQuery} Element to get offset from
 * @returns {es.Position} Position with element data applied
 */
es.Position.newFromElementPagePosition = function( $element ) {
	var offset = $element.offset();
	return new es.Position( offset.left, offset.top );
};

/**
 * Creates position object from the layer position of an element.
 * 
 * @static
 * @method
 * @param $element {jQuery} Element to get position from
 * @returns {es.Position} Position with element data applied
 */
es.Position.newFromElementLayerPosition = function( $element ) {
	var position = $element.position();
	return new es.Position( position.left, position.top );
};

/**
 * Creates position object from the screen position data in an Event object.
 * 
 * @static
 * @method
 * @param event {Event} Event to get position data from
 * @returns {es.Position} Position with event data applied
 */
es.Position.newFromEventScreenPosition = function( event ) {
	return new es.Position( event.screenX, event.screenY );
};

/**
 * Creates position object from the page position data in an Event object.
 * 
 * @static
 * @method
 * @param event {Event} Event to get position data from
 * @returns {es.Position} Position with event data applied
 */
es.Position.newFromEventPagePosition = function( event ) {
	return new es.Position( event.pageX, event.pageY );
};

/**
 * Creates position object from the layer position data in an Event object.
 * 
 * @static
 * @method
 * @param event {Event} Event to get position data from
 * @returns {es.Position} Position with event data applied
 */
es.Position.newFromEventLayerPosition = function( event ) {
	return new es.Position( event.layerX, event.layerY );
};

/* Methods */

/**
 * Adds the values of a given position to this one.
 * 
 * @method
 * @param position {es.Position} Position to add values from
 */
es.Position.prototype.add = function( position ) {
	this.top += position.top;
	this.bottom += position.bottom;
	this.left += position.left;
};

/**
 * Subtracts the values of a given position to this one.
 * 
 * @method
 * @param position {es.Position} Position to subtract values from
 */
es.Position.prototype.subtract = function( position ) {
	this.top -= position.top;
	this.bottom -= position.bottom;
	this.left -= position.left;
};

/**
 * Checks if this position is the same as another one.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If positions have the same left and top values
 */
es.Position.prototype.at = function( position ) {
	return this.left === position.left && this.top === position.top;
};

/**
 * Checks if this position perpendicular with another one, sharing either a top or left value.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If positions share a top or a left value
 */
es.Position.prototype.perpendicularWith = function( position ) {
	return this.left === position.left || this.top === position.top;
};

/**
 * Checks if this position is level with another one, having the same top value.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If positions have the same top value
 */
es.Position.prototype.levelWith = function( position ) {
	return this.top === position.top;
};

/**
 * Checks if this position is plumb with another one, having the same left value.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If positions have the same left value
 */
es.Position.prototype.plumbWith = function( position ) {
	return this.left === position.left;
};

/**
 * Checks if this position is nearby another one.
 * 
 * Distance is measured radially.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @param radius {Integer} Pixel distance from this position to consider "near-by"
 * @returns {Boolean} If positions are near-by each other
 */
es.Position.prototype.near = function( position, radius ) {
	return Math.sqrt(
		Math.pow( this.left - position.left, 2 ),
		Math.pow( this.top - position.top )
	) <= radius;
};

/**
 * Checks if this position is above another one.
 * 
 * This method utilizes the bottom property.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If this position is above the other
 */
es.Position.prototype.above = function( position ) {
	return this.bottom < position.top;
};

/**
 * Checks if this position is below another one.
 * 
 * This method utilizes the bottom property.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If this position is below the other
 */
es.Position.prototype.below = function( position ) {
	return this.top > position.bottom;
};

/**
 * Checks if this position is to the left of another one.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If this position is the left the other
 */
es.Position.prototype.leftOf = function( left ) {
	return this.left < left;
};

/**
 * Checks if this position is to the right of another one.
 * 
 * @method
 * @param position {es.Position} Position to compare with
 * @returns {Boolean} If this position is the right the other
 */
es.Position.prototype.rightOf = function( left ) {
	return this.left > left;
};
/**
 * Range of content.
 * 
 * @class
 * @constructor
 * @param from {Integer} Starting offset
 * @param to {Integer} Ending offset
 * @property from {Integer} Starting offset
 * @property to {Integer} Ending offset
 * @property start {Integer} Normalized starting offset
 * @property end {Integer} Normalized ending offset
 */
es.Range = function( from, to ) {
	this.from = from || 0;
	this.to = typeof to === 'undefined' ? this.from : to;
	this.normalize();
};

/**
 * Creates a new es.Range object that's a translated version of another.
 * 
 * @method
 * @param {es.Range} range Range to base new range on
 * @param {Integer} distance Distance to move range by
 * @returns {es.Range} New translated range
 */
es.Range.newFromTranslatedRange = function( range, distance ) {
	return new es.Range( range.from + distance, range.to + distance );
};

/* Methods */

/**
 * Gets a clone of this object.
 * 
 * @method
 * @returns {es.Range} Clone of range
 */
es.Range.prototype.clone = function() {
	return new es.Range( this.from, this.to );
};

/**
 * Checks if an offset is within this range.
 * 
 * @method
 * @param offset {Integer} Offset to check
 * @returns {Boolean} If offset is within this range
 */
es.Range.prototype.containsOffset = function( offset ) {
	this.normalize();
	return offset >= this.start && offset < this.end;
};

/**
 * Gets the length of the range.
 * 
 * @method
 * @returns {Integer} Length of range
 */
es.Range.prototype.getLength = function() {
	return Math.abs( this.from - this.to );
};

/**
 * Sets start and end properties, ensuring start is always before end.
 * 
 * This should always be called before using the start or end properties. Do not call this unless
 * you are about to use these properties.
 * 
 * @method
 */
es.Range.prototype.normalize = function() {
	if ( this.from < this.to ) {
		this.start = this.from;
		this.end = this.to;
	} else {
		this.start = this.to;
		this.end = this.from;
	}
};

/**
 * Determines if two Ranges are equal. Direction counts.
 *
 * @method
 * @param {es.Range}
 * @returns {Boolean}
 */
es.Range.prototype.equals = function( other ) {
	return this.from === other.from && this.to === other.to;
};
/**
 * Creates an es.TransactionProcessor object.
 * 
 * @class
 * @constructor
 */
es.TransactionProcessor = function( model, transaction ) {
	this.model = model;
	this.transaction = transaction;
	this.cursor = 0;
	this.set = [];
	this.clear = [];
};

/* Static Members */

es.TransactionProcessor.operationMap = {
	// Retain
	'retain': {
		'commit': function( op ) {
			this.retain( op );
		},
		'rollback': function( op ) {
			this.retain( op );
		}
	},
	// Insert
	'insert': {
		'commit': function( op ) {
			this.insert( op );
		},
		'rollback': function( op ) {
			this.remove( op );
		}
	},
	// Remove
	'remove': {
		'commit': function( op ) {
			this.remove( op );
		},
		'rollback': function( op ) {
			this.insert( op );
		}
	},
	// Change element attributes
	'attribute': {
		'commit': function( op ) {
			this.attribute( op, false );
		},
		'rollback': function( op ) {
			this.attribute( op, true );
		}
	},
	// Change content annotations
	'annotate': {
		'commit': function( op ) {
			this.mark( op, false );
		},
		'rollback': function( op ) {
			this.mark( op, true );
		}
	}
};

/* Static Methods */

es.TransactionProcessor.commit = function( doc, transaction ) {
	var tp = new es.TransactionProcessor( doc, transaction );
	tp.process( 'commit' );
};

es.TransactionProcessor.rollback = function( doc, transaction ) {
	var tp = new es.TransactionProcessor( doc, transaction );
	tp.process( 'rollback' );
};

/* Methods */

es.TransactionProcessor.prototype.process = function( method ) {
	var operations = this.transaction.getOperations();
	for ( var i = 0, length = operations.length; i < length; i++ ) {
		var operation = operations[i];
		if ( operation.type in es.TransactionProcessor.operationMap ) {
			es.TransactionProcessor.operationMap[operation.type][method].call( this, operation );
		} else {
			throw 'Invalid operation error. Operation type is not supported: ' + operation.type;
		}
	}
};

// TODO: document this. Various arguments are optional or nonoptional in different cases, that's confusing
// so it needs to be documented well.
es.TransactionProcessor.prototype.rebuildNodes = function( newData, oldNodes, parent, index ) {
	var newNodes = es.DocumentModel.createNodesFromData( newData ),
		remove = 0;
	if ( oldNodes ) {
		// Determine parent and index if not given
		if ( oldNodes[0] === oldNodes[0].getRoot() ) {
			// We know the values for parent and index in this case
			// and don't have to compute them. Override any parent
			// or index parameter passed.
			parent = oldNodes[0];
			index = 0;
			remove = parent.getChildren().length;
		} else {
			parent = parent || oldNodes[0].getParent();
			index = index || parent.indexOf( oldNodes[0] );
			remove = oldNodes.length;
		}
		// Try to preserve the first node
		if (
			// There must be an old and new node to preserve
			newNodes.length &&
			oldNodes.length &&
			// Node types need to match
			newNodes[0].type === oldNodes[0].type &&
			// Only for leaf nodes
			!newNodes[0].hasChildren()
		) {
			var newNode = newNodes.shift(),
				oldNode = oldNodes.shift();
			// Let's just leave this first node in place and adjust it's length
			var newAttributes = newNode.getElement().attributes,
				oldAttributes = oldNode.getElement().attributes;
			if ( oldAttributes || newAttributes ) {
				oldNode.getElement().attributes = newAttributes;
			}
			oldNode.adjustContentLength( newNode.getContentLength() - oldNode.getContentLength() );
			index++;
			remove--;
		}
	}
	// Try to perform this in a single operation if possible, this reduces the number of UI updates
	// TODO: Introduce a global for max argument length - 1024 is also assumed in es.insertIntoArray
	if ( newNodes.length < 1024 ) {
		parent.splice.apply( parent, [index, remove].concat( newNodes ) );
	} else if ( newNodes.length ) {
		parent.splice.apply( parent, [index, remove] );
		// Safe to call with arbitrary length of newNodes
		es.insertIntoArray( parent, index, newNodes );
	}
};

/**
 * Get the parent node that would be affected by inserting given data into it's child.
 * 
 * This is used when inserting data that closes and reopens one or more parent nodes into a child
 * node, which requires rebuilding at a higher level.
 * 
 * @method
 * @param {es.DocumentNode} node Child node to start from
 * @param {Array} data Data to inspect for closings
 * @returns {es.DocumentNode} Lowest level parent node being affected
 */
es.TransactionProcessor.prototype.getScope = function( node, data ) {
	var i,
		length,
		level = 0,
		max = 0;
	for ( i = 0, length = data.length; i < length; i++ ) {
		if ( typeof data[i].type === 'string' ) {
			level += data[i].type.charAt( 0 ) === '/' ? 1 : -1;
			max = Math.max( max, level );
		}
	}
	if ( max > 0 ) {
		for ( i = 0; i < max - 1; i++ ) {
			node = node.getParent();
		}
	}
	return node;
};

es.TransactionProcessor.prototype.applyAnnotations = function( to, update ) {
	var i,
		j,
		k,
		length,
		annotation,
		changes = 0,
		index;
	// Handle annotations
	if ( this.set.length ) {
		for ( i = 0, length = this.set.length; i < length; i++ ) {
			annotation = this.set[i];
			// Auto-build annotation hash
			if ( annotation.hash === undefined ) {
				annotation.hash = es.DocumentModel.getHash( annotation );
			}
			for ( j = this.cursor; j < to; j++ ) {
				// Auto-convert to array
				if ( es.isArray( this.model.data[j] ) ) {
					this.model.data[j].push( annotation );
				} else {
					this.model.data[j] = [this.model.data[j], annotation];
				}
			}
		}
		changes++;
	}
	if ( this.clear.length ) {
		for ( i = 0, length = this.clear.length; i < length; i++ ) {
			annotation = this.clear[i];
			if ( annotation instanceof RegExp ) {
				for ( j = this.cursor; j < to; j++ ) {
					var matches = es.DocumentModel.getMatchingAnnotations(
						this.model.data[j], annotation
					);
					for ( k = 0; k < matches.length; k++ ) {
						index = this.model.data[j].indexOf( matches[k] );
						if ( index !== -1 ) {
							this.model.data[j].splice( index, 1 );
						}
					}
					// Auto-convert to string
					if ( this.model.data[j].length === 1 ) {
						this.model.data[j] = this.model.data[j][0];
					}
				}
			} else {
				// Auto-build annotation hash
				if ( annotation.hash === undefined ) {
					annotation.hash = es.DocumentModel.getHash( annotation );
				}
				for ( j = this.cursor; j < to; j++ ) {
					index = es.DocumentModel.getIndexOfAnnotation(
						this.model.data[j], annotation
					);
					if ( index !== -1 ) {
						this.model.data[j].splice( index, 1 );
					}
					// Auto-convert to string
					if ( this.model.data[j].length === 1 ) {
						this.model.data[j] = this.model.data[j][0];
					}
				}
			}
		}
		changes++;
	}
	if ( update && changes ) {
		var fromNode = this.model.getNodeFromOffset( this.cursor ),
			toNode = this.model.getNodeFromOffset( to );
		this.model.traverseLeafNodes( function( node ) {
			node.emit( 'update' );
			if ( node === toNode ) {
				return false;
			}
		}, fromNode );
	}
};

es.TransactionProcessor.prototype.retain = function( op ) {
	this.applyAnnotations( this.cursor + op.length, true );
	this.cursor += op.length;
};

es.TransactionProcessor.prototype.insert = function( op ) {
	var node,
		index,
		offset;

	if ( es.DocumentModel.isStructuralOffset( this.model.data, this.cursor ) && this.cursor != this.model.data.length ) {
		// FIXME: This fails when inserting something like </list><list> between 2 list items
		// @see test #30 in es.TransactionProcessor.test.js
		es.insertIntoArray( this.model.data, this.cursor, op.data );
		this.applyAnnotations( this.cursor + op.data.length );
		node = this.model.getNodeFromOffset( this.cursor );
		offset = this.model.getOffsetFromNode( node );
		index = node.getIndexFromOffset( this.cursor - offset );
		this.rebuildNodes( op.data, null, node, index );
	} else {
		node = this.model.getNodeFromOffset( this.cursor );
		if ( node.getParent() === this.model ) {
			offset = this.model.getOffsetFromNode( node );
		} else {
			node = this.getScope( node, op.data );
			offset = this.model.getOffsetFromNode( node );
		}
		if ( es.DocumentModel.containsElementData( op.data ) ) {
			// Perform insert on linear data model
			es.insertIntoArray( this.model.data, this.cursor, op.data );
			this.applyAnnotations( this.cursor + op.data.length );
			// Synchronize model tree
			if ( offset === -1 ) {
				throw 'Invalid offset error. Node is not in model tree';
			}
			this.rebuildNodes(
				this.model.data.slice( offset, offset + node.getElementLength() + op.data.length ),
				[node]
			);
		} else {
			// Perform insert on linear data model
			// TODO this is duplicated from above
			es.insertIntoArray( this.model.data, this.cursor, op.data );
			this.applyAnnotations( this.cursor + op.data.length );
			// Update model tree
			node.adjustContentLength( op.data.length, true );
			node.emit( 'update', this.cursor - offset );
		}
	}
	this.cursor += op.data.length;
};

es.TransactionProcessor.prototype.remove = function( op ) {
	if ( es.DocumentModel.containsElementData( op.data ) ) {
		// Figure out which nodes are covered by the removal
		var ranges = this.model.selectNodes( new es.Range( this.cursor, this.cursor + op.data.length ) );
		
		// Build the list of nodes to rebuild and the data to keep
		var oldNodes = [],
			newData = [],
			parent = null,
			index = null,
			firstKeptNode,
			lastKeptNode,
			i;
		for ( i = 0; i < ranges.length; i++ ) {
			oldNodes.push( ranges[i].node );
			if ( ranges[i].range !== undefined ) {
				// We have to keep part of this node
				if ( firstKeptNode === undefined ) {
					// This is the first node we're keeping
					firstKeptNode = ranges[i].node;
				}
				// Compute the start and end offset of this node
				// We could do that with getOffsetFromNode() but
				// we already have all the numbers we need so why would we
				var	startOffset = ranges[i].globalRange.start - ranges[i].range.start,
					endOffset = startOffset + ranges[i].node.getContentLength(),
					// Get this node's data
					nodeData = this.model.data.slice( startOffset, endOffset );
				// Remove data covered by the range from nodeData
				nodeData.splice( ranges[i].range.start, ranges[i].range.end - ranges[i].range.start );
				// What remains in nodeData is the data we need to keep
				// Append it to newData
				newData = newData.concat( nodeData );
				
				lastKeptNode = ranges[i].node;
			}
		}
		
		// Surround newData with the right openings and closings if needed
		if ( firstKeptNode !== undefined ) {
			// There are a number of conceptually different cases here,
			// but the algorithm for dealing with them is the same.
			// 1. Removal within one node: firstKeptNode === lastKeptNode
			// 2. Merge of siblings: firstKeptNode.getParent() === lastKeptNode.getParent()
			// 3. Merge of arbitrary depth: firstKeptNode and lastKeptNode have a common ancestor
			// Because #1 and #2 are special cases of #3 (merges with depth=0 and depth=1, respectively),
			// the code below that deals with the general case (#3) and automatically covers
			// #1 and #2 that way as well.
			
			// Simultaneously traverse upwards from firstKeptNode and lastKeptNode
			// to find the common ancestor. On our way up, keep the element of each
			// node we visit and verify that the transaction is a valid merge (i.e. it satisfies
			// the merge criteria in prepareRemoval()'s canMerge()).
			// FIXME: The code is essentially the same as canMerge(), merge these algorithms
			var	openings = [],
				closings = [],
				paths = es.DocumentNode.getCommonAncestorPaths( firstKeptNode, lastKeptNode ),
				prevN1,
				prevN2;
			
			if ( !paths ) {
				throw 'Removal is not a valid merge: nodes do not have a common ancestor or are not at the same depth';
			}
			for ( i = 0; i < paths.node1Path.length; i++ ) { 
				// Verify the element types are equal
				if ( paths.node1Path[i].getElementType() !== paths.node2Path[i].getElementType() ) {
					throw 'Removal is not a valid merge: corresponding parents have different types ( ' +
						paths.node1Path[i].getElementType() + ' vs ' + paths.node2Path[i].getElementType() + ' )';
				}
				// Record the opening of n1 and the closing of n2
				openings.push( paths.node1Path[i].getElement() );
				closings.push( { 'type': '/' + paths.node2Path[i].getElementType() } );
			}
			
			// Surround newData with the openings and closings
			newData = openings.reverse().concat( newData, closings );
			
			// Rebuild oldNodes if needed
			// This only happens for merges with depth > 1
			prevN1 = paths.node1Path.length ? paths.node1Path[paths.node1Path.length - 1] : null;
			prevN2 = paths.node2Path.length ? paths.node2Path[paths.node2Path.length - 1] : null;
			if ( prevN1 && prevN1 !== oldNodes[0] ) {
				oldNodes = [ prevN1 ];
				parent = paths.commonAncestor;
				index = parent.indexOf( prevN1 ); // Pass to rebuildNodes() so it's not recomputed
				if ( index === -1 ) {
					throw "Tree corruption detected: node isn't in its parent's children array";
				}
				var foundPrevN2 = false;
				for ( var j = index + 1; !foundPrevN2 && j < parent.getChildren().length; j++ ) {
					oldNodes.push( parent.getChildren()[j] );
					foundPrevN2 = parent.getChildren()[j] === prevN2;
				}
				if ( !foundPrevN2 ) {
					throw "Tree corruption detected: node isn't in its parent's children array";
				}
			}
		}
		
		// Update the linear model
		this.model.data.splice( this.cursor, op.data.length );
		// Perform the rebuild. This updates the model tree
		this.rebuildNodes( newData, oldNodes, parent, index );
	} else {
		// We're removing content only. Take a shortcut
		// Get the node we are removing content from
		var node = this.model.getNodeFromOffset( this.cursor );
		// Update model tree
		node.adjustContentLength( -op.data.length, true );
		// Update the linear model
		this.model.data.splice( this.cursor, op.data.length );
		// Emit an update so things sync up
		var offset = this.model.getOffsetFromNode( node );
		node.emit( 'update', this.cursor - offset );
	}
};

es.TransactionProcessor.prototype.attribute = function( op, invert ) {
	var element = this.model.data[this.cursor];
	if ( element.type === undefined ) {
		throw 'Invalid element error. Can not set attributes on non-element data.';
	}
	if ( ( op.method === 'set' && !invert ) || ( op.method === 'clear' && invert ) ) {
		// Automatically initialize attributes object
		if ( !element.attributes ) {
			element.attributes = {};
		}
		element.attributes[op.key] = op.value;
	} else if ( ( op.method === 'clear' && !invert ) || ( op.method === 'set' && invert ) ) {
		if ( element.attributes ) {
			delete element.attributes[op.key];
		}
		// Automatically clean up attributes object
		var empty = true;
		for ( var key in element.attributes ) {
			empty = false;
			break;
		}
		if ( empty ) {
			delete element.attributes;
		}
	} else {
		throw 'Invalid method error. Can not operate attributes this way: ' + method;
	}
	var node = this.model.getNodeFromOffset( this.cursor + 1 );
	node.traverseLeafNodes( function( leafNode ) {
		leafNode.emit( 'update' );
	} );
};

es.TransactionProcessor.prototype.mark = function( op, invert ) {
	var target;
	if ( ( op.method === 'set' && !invert ) || ( op.method === 'clear' && invert ) ) {
		target = this.set;
	} else if ( ( op.method === 'clear' && !invert ) || ( op.method === 'set' && invert ) ) {
		target = this.clear;
	} else {
		throw 'Invalid method error. Can not operate attributes this way: ' + method;
	}
	if ( op.bias === 'start' ) {
		target.push( op.annotation );
	} else if ( op.bias === 'stop' ) {
		var index;
		if ( op.annotation instanceof RegExp ) {
			index = target.indexOf( op.annotation );
		} else {
			index = es.DocumentModel.getIndexOfAnnotation( target, op.annotation );
		}
		if ( index === -1 ) {
			throw 'Annotation stack error. Annotation is missing.';
		}
		target.splice( index, 1 );
	}
};
/**
 * Creates an annotation renderer object.
 * 
 * @class
 * @constructor
 * @property annotations {Object} List of annotations to be applied
 */
es.AnnotationSerializer = function() {
	this.annotations = {};
};

/* Static Methods */

/**
 * Adds a set of annotations to be inserted around a range of text.
 * 
 * Insertions for the same range will be nested in order of declaration.
 * @example
 *     stack = new es.AnnotationSerializer();
 *     stack.add( new es.Range( 1, 2 ), '[', ']' );
 *     stack.add( new es.Range( 1, 2 ), '{', '}' );
 *     // Outputs: "a[{b}]c"
 *     console.log( stack.render( 'abc' ) );
 * 
 * @method
 * @param {es.Range} range Range to insert text around
 * @param {String} pre Text to insert before range
 * @param {String} post Text to insert after range
 */
es.AnnotationSerializer.prototype.add = function( range, pre, post ) {
	// Normalize the range if it can be normalized
	if ( typeof range.normalize === 'function' ) {
		range.normalize();
	}
	if ( !( range.start in this.annotations ) ) {
		this.annotations[range.start] = [pre];
	} else {
		this.annotations[range.start].push( pre );
	}
	if ( !( range.end in this.annotations ) ) {
		this.annotations[range.end] = [post];
	} else {
		this.annotations[range.end].unshift( post );
	}
};

/**
 * Adds a set of HTML tags to be inserted around a range of text.
 * 
 * @method
 * @param {es.Range} range Range to insert text around
 * @param {String} type Tag name
 * @param {Object} [attributes] List of HTML attributes
 */
es.AnnotationSerializer.prototype.addTags = function( range, type, attributes ) {
	this.add( range, es.Html.makeOpeningTag( type, attributes ), es.Html.makeClosingTag( type ) );
};

/**
 * Renders annotations into text.
 * 
 * @method
 * @param {String} text Text to apply annotations to
 * @returns {String} Wrapped text
 */
es.AnnotationSerializer.prototype.render = function( text ) {
	var out = '';
	for ( var i = 0, length = text.length; i <= length; i++ ) {
		if ( i in this.annotations ) {
			out += this.annotations[i].join( '' );
		}
		if ( i < length ) {
			out += text[i];
		}
	}
	return out;
};
/**
 * Serializes a WikiDom plain object into an HTML string.
 * 
 * @class
 * @constructor
 * @param {Object} options List of options for serialization
 */
es.HtmlSerializer = function( options ) {
	this.options = $.extend( {
		// defaults
	}, options || {} );
};

/* Static Methods */

/**
 * Get a serialized version of data.
 * 
 * @static
 * @method
 * @param {Object} data Data to serialize
 * @param {Object} options Options to use, @see {es.WikitextSerializer} for details
 * @returns {String} Serialized version of data
 */
es.HtmlSerializer.stringify = function( data, options ) {
	return ( new es.HtmlSerializer( options ) ).document( data );
};

es.HtmlSerializer.getHtmlAttributes = function( attributes ) {
	var htmlAttributes = {},
		count = 0;
	for ( var key in attributes ) {
		if ( key.indexOf( 'html/' ) === 0 ) {
			htmlAttributes[key.substr( 5 )] = attributes[key];
			count++;
		}
	}
	return count ? htmlAttributes : null;
};

/* Methods */

es.HtmlSerializer.prototype.document = function( node, rawFirstParagraph ) {
	var lines = [];
	for ( var i = 0, length = node.children.length; i < length; i++ ) {
		var childNode = node.children[i];
		if ( childNode.type in this ) {
			// Special case for paragraphs which have particular wrapping needs
			if ( childNode.type === 'paragraph' ) {
				lines.push( this.paragraph( childNode, rawFirstParagraph && i === 0 ) );
			} else {
				lines.push( this[childNode.type].call( this, childNode ) );
			}
		}
	}
	return lines.join( '\n' );
};

es.HtmlSerializer.prototype.comment = function( node ) {
	return '<!--(' + node.text + ')-->';
};

es.HtmlSerializer.prototype.pre = function( node ) {
	return es.Html.makeTag(
		'pre', {}, this.content( node.content, true )
	);
};

es.HtmlSerializer.prototype.horizontalRule = function( node ) {
	return es.Html.makeTag( 'hr', {}, false );
};

es.HtmlSerializer.prototype.heading = function( node ) {
	return es.Html.makeTag(
		'h' + node.attributes.level, {}, this.content( node.content )
	);
};

es.HtmlSerializer.prototype.paragraph = function( node, raw ) {
	if ( raw ) {
		return this.content( node.content );
	} else {
		return es.Html.makeTag( 'p', {}, this.content( node.content ) );
	}
};

es.HtmlSerializer.prototype.list = function( node ) {
	var out = [],    // List of list nodes
		bstack = [], // Bullet stack, previous element's listStyles
		bnext  = [], // Next element's listStyles
		closeTags  = []; // Stack of close tags for currently active lists

	function commonPrefixLength( x, y ) {
		var minLength = Math.min(x.length, y.length);
		for(var i = 0; i < minLength; i++) {
			if (x[i] !== y[i]) {
				// Both description and term are
				// inside dls, so consider them equivalent here.
				var diffs =  [x[i], y[i]].sort();
				if (diffs[0] !== 'description' &&
						diffs[1] !== 'term' ) {
							break;
						}
			}
		}
		return i;
	}

	function popTags( n ) {
		for (var i = 0; i < n; i++ ) {
			out.push(closeTags.pop());
		}
	}

	function openLists( bs, bn, attribs ) {
		var prefix = commonPrefixLength (bs, bn);
		// pop close tags from stack
		popTags(closeTags.length - prefix);
		for(var i = prefix; i < bn.length; i++) {
			var c = bn[i];
			switch (c) {
				case 'bullet':
					out.push(es.Html.makeOpeningTag('ul', attribs));
					closeTags.push(es.Html.makeClosingTag('ul'));
					break;
				case 'number':
					out.push(es.Html.makeOpeningTag('ol', attribs));
					closeTags.push(es.Html.makeClosingTag('ol'));
					break;
				case 'term':
				case 'description':
					out.push(es.Html.makeOpeningTag('dl', attribs));
					closeTags.push(es.Html.makeClosingTag('dl'));
					break;
				default:
					throw("Unknown node prefix " + c);
			}
		}
	}

	for (var i = 0, length = node.children.length; i < length; i++) {
		var e = node.children[i];
		bnext = e.attributes.styles;
		delete e.attributes.styles;
		openLists( bstack, bnext, e.attributes );
		var tag;
		switch(bnext[bnext.length - 1]) {
			case 'term':
				tag = 'dt'; break;
			case 'description':
				tag = 'dd'; break;
			default:
				tag = 'li'; break;
		}
		out.push( es.Html.makeTag(tag, e.attributes, this.document( e ) ) );
		bstack = bnext;
	}
	popTags(closeTags.length);
	return out.join("\n");
};

es.HtmlSerializer.prototype.table = function( node ) {
	var lines = [],
		attributes = es.HtmlSerializer.getHtmlAttributes( node.attributes );
	lines.push( es.Html.makeOpeningTag( 'table', attributes ) );
	for ( var i = 0, length = node.children.length; i < length; i++ ) {
		var child = node.children[i];
		lines.push( this[child.type]( child ) );
	}
	lines.push( es.Html.makeClosingTag( 'table' ) );
	return lines.join( '\n' );
};

es.HtmlSerializer.prototype.tableRow = function( node ) {
	var lines = [],
		attributes = es.HtmlSerializer.getHtmlAttributes( node.attributes );
	lines.push( es.Html.makeOpeningTag( 'tr', attributes ) );
	for ( var i = 0, length = node.children.length; i < length; i++ ) {
		lines.push( this.tableCell( node.children[i] ) );
	}
	lines.push( es.Html.makeClosingTag( 'tr' ) );
	return lines.join( '\n' );
};

es.HtmlSerializer.prototype.tableCell = function( node ) {
	var symbolTable = {
			'tableHeading': 'th',
			'tableCell': 'td'
		},
		attributes = es.HtmlSerializer.getHtmlAttributes( node.attributes );
	return es.Html.makeTag( symbolTable[node.type], attributes, this.document( node, true ) );
};

es.HtmlSerializer.prototype.tableCaption = function( node ) {
	attributes = es.HtmlSerializer.getHtmlAttributes( node.attributes );
	return es.Html.makeTag( 'caption', attributes, this.content( node.content ) );
};

es.HtmlSerializer.prototype.transclusion = function( node ) {
	var title = [];
	if ( node.namespace !== 'Main' ) {
		title.push( node.namespace );
	}
	title.push( node.title );
	title = title.join( ':' );
	return es.Html.makeTag( 'a', { 'href': '/wiki/' + title }, title );
};

es.HtmlSerializer.prototype.parameter = function( node ) {
	return '{{{' + node.name + '}}}';
};

es.HtmlSerializer.prototype.content = function( node ) {
	if ( 'annotations' in node && node.annotations.length ) {
		var annotationSerializer = new es.AnnotationSerializer(),
			tagTable = {
				'textStyle/bold': 'b',
				'textStyle/italic': 'i',
				'textStyle/strong': 'strong',
				'textStyle/emphasize': 'em',
				'textStyle/big': 'big',
				'textStyle/small': 'small',
				'textStyle/superScript': 'sup',
				'textStyle/subScript': 'sub'
			};
		for ( var i = 0, length = node.annotations.length; i < length; i++ ) {
			var annotation = node.annotations[i];
			if ( annotation.type in tagTable ) {
				annotationSerializer.addTags( annotation.range, tagTable[annotation.type] );
			} else {
				switch ( annotation.type ) {
					case 'link/external':
						annotationSerializer.addTags(
							annotation.range, 'a', { 'href': annotation.data.url }
						);
						break;
					case 'link/internal':
						annotationSerializer.addTags(
							annotation.range, 'a', { 'href': '/wiki/' + annotation.data.title }
						);
						break;
					case 'object/template':
					case 'object/hook':
						annotationSerializer.add( annotation.range, annotation.data.html, '' );
						break;
				}
			}
		}
		return annotationSerializer.render( node.text );
	} else {
		return node.text;
	}
};
/**
 * Serializes a WikiDom plain object into a JSON string.
 * 
 * @class
 * @constructor
 * @param {Object} options List of options for serialization
 * @param {String} options.indentWith Text to use as indentation, such as \t or 4 spaces
 * @param {String} options.joinWith Text to use as line joiner, such as \n or '' (empty string)
 */
es.JsonSerializer = function( options ) {
	this.options = $.extend( {
		'indentWith': '\t',
		'joinWith': '\n'
	}, options || {} );
};

/* Static Methods */

/**
 * Get a serialized version of data.
 * 
 * @static
 * @method
 * @param {Object} data Data to serialize
 * @param {Object} options Options to use, @see {es.JsonSerializer} for details
 * @returns {String} Serialized version of data
 */
es.JsonSerializer.stringify = function( data, options ) {
	return ( new es.JsonSerializer( options ) ).stringify( data );
};

/**
 * Gets the type of a given value.
 * 
 * @static
 * @method
 * @param {Mixed} value Value to get type of
 * @returns {String} Symbolic name of type
 */
es.JsonSerializer.typeOf = function( value ) {
	if ( typeof value === 'object' ) {
		if ( value === null ) {
			return 'null';
		}
		switch ( value.constructor ) {
			case [].constructor:
				return 'array';
			case ( new Date() ).constructor:
				return 'date';
			case ( new RegExp() ).constructor:
				return 'regex';
			default:
				return 'object';
		}
	}
	return typeof value;
};

/* Methods */

/**
 * Get a serialized version of data.
 * 
 * @method
 * @param {Object} data Data to serialize
 * @param {String} indentation String to prepend each line with (used internally with recursion)
 * @returns {String} Serialized version of data
 */
es.JsonSerializer.prototype.stringify = function( data, indention ) {
	if ( indention === undefined ) {
		indention = '';
	}
	var type = es.JsonSerializer.typeOf( data ),
		key;
	
	// Open object/array
	var json = '';
	if ( type === 'array' ) {
		if (data.length === 0) {
			// Empty array
			return '[]';
		}
		json += '[';
	} else {
		var empty = true;
		for ( key in data ) {
			if ( data.hasOwnProperty( key ) ) {
				empty = false;
				break;
			}
		}
		if ( empty ) {
			return '{}';
		}
		json += '{';
	}
	
	// Iterate over items
	var comma = false;
	for ( key in data ) {
		if ( data.hasOwnProperty( key ) ) {
			json += ( comma ? ',' : '' ) + this.options.joinWith + indention +
				this.options.indentWith + ( type === 'array' ? '' : '"' + key + '"' + ': ' );
			switch ( es.JsonSerializer.typeOf( data[key] ) ) {
				case 'array':
				case 'object':
					json += this.stringify( data[key], indention + this.options.indentWith );
					break;
				case 'boolean':
				case 'number':
					json += data[key].toString();
					break;
				case 'null':
					json += 'null';
					break;
				case 'string':
					json += '"' + data[key].replace(/[\n]/g, '\\n').replace(/[\t]/g, '\\t') + '"';
					break;
				// Skip other types
			}
			comma = true;
		}
	}
	
	// Close object/array
	json += this.options.joinWith + indention + ( type === 'array' ? ']' : '}' );
	
	return json;
};
/**
 * Serializes a WikiDom plain object into a Wikitext string.
 * 
 * @class
 * @constructor
 * @param options {Object} List of options for serialization
 */
es.WikitextSerializer = function( options ) {
	this.options = $.extend( {
		// defaults
	}, options || {} );
};

/* Static Methods */

/**
 * Get a serialized version of data.
 * 
 * @static
 * @method
 * @param {Object} data Data to serialize
 * @param {Object} options Options to use, @see {es.WikitextSerializer} for details
 * @returns {String} Serialized version of data
 */
es.WikitextSerializer.stringify = function( data, options ) {
	return ( new es.WikitextSerializer( options ) ).document( data );
};

es.WikitextSerializer.getHtmlAttributes = function( attributes ) {
	var htmlAttributes = {},
		count = 0;
	for ( var key in attributes ) {
		if ( key.indexOf( 'html/' ) === 0 ) {
			htmlAttributes[key.substr( 5 )] = attributes[key];
			count++;
		}
	}
	return count ? htmlAttributes : null;
};

/* Methods */

es.WikitextSerializer.prototype.document = function( node, rawFirstParagraph ) {
	var lines = [];
	for ( var i = 0, length = node.children.length; i < length; i++ ) {
		var childNode = node.children[i];
		if ( childNode.type in this ) {
			// Special case for paragraphs which have particular spacing needs
			if ( childNode.type === 'paragraph' ) {
				lines.push( this.paragraph( childNode, rawFirstParagraph && i === 0 ) );
				if ( i + 1 < length /* && node.children[i + 1].type === 'paragraph' */ ) {
					lines.push( '' );
				}
			} else {
				lines.push( this[childNode.type].call( this, childNode ) );
			}
		}
	}
	return lines.join( '\n' );
};

es.WikitextSerializer.prototype.comment = function( node ) {
	return '<!--' + node.text + '-->';
};

es.WikitextSerializer.prototype.horizontalRule = function( node ) {
	return '----';
};

es.WikitextSerializer.prototype.heading = function( node ) {
	var symbols = es.repeatString( '=', node.attributes.level );
	return symbols + this.content( node.content ) + symbols;
};

es.WikitextSerializer.prototype.paragraph = function( node ) {
	return this.content( node.content );
};

es.WikitextSerializer.prototype.pre = function( node ) {
	return ' ' + this.content( node.content ).replace( '\n', '\n ' );
};

es.WikitextSerializer.prototype.list = function( node ) {
	var symbolTable = {
		'bullet': '*',
		'number': '#',
		'term': ';',
		'description': ':'
	};
	function convertStyles( styles ) {
		var symbols = '';
		for ( var i = 0, length = styles.length; i < length; i++ ) {
			symbols += styles[i] in symbolTable ? symbolTable[styles[i]] : '';
		}
		return symbols;
	}
	var lines = [];
	for ( var i = 0, length = node.children.length; i < length; i++ ) {
		var childNode = node.children[i];
		lines.push(
			convertStyles( childNode.attributes.styles ) + ' ' +
				this.document( childNode )
		);
	}
	return lines.join( '\n' ) + '\n';
};

es.WikitextSerializer.prototype.table = function( node ) {
	var lines = [],
		attributes = es.WikitextSerializer.getHtmlAttributes( node.attributes );
	if ( attributes ) {
		attributes = es.Html.makeAttributeList( attributes );
	}
	lines.push( '{|' + attributes );
	for ( var i = 0, length = node.children.length; i < length; i++ ) {
		lines.push( this.tableRow( node.children[i], i === 0 ) );
	}
	lines.push( '|}' );
	return lines.join( '\n' );
};

es.WikitextSerializer.prototype.tableRow = function( node, first ) {
	var lines = [],
		attributes = es.WikitextSerializer.getHtmlAttributes( node.attributes );
	if ( attributes ) {
		attributes = es.Html.makeAttributeList( attributes );
	}
	if ( !first || attributes ) {
		lines.push( '|-' + attributes );
	}
	for ( var i = 0, length = node.children.length; i < length; i++ ) {
		lines.push( this.tableCell( node.children[i] ) );
	}
	return lines.join( '\n' );
};

es.WikitextSerializer.prototype.tableCell = function( node ) {
	var symbolTable = {
		'tableHeading': '!',
		'tableCell': '|'
	};
	var attributes = es.WikitextSerializer.getHtmlAttributes( node.attributes );
	if ( attributes ) {
		attributes = es.Html.makeAttributeList( attributes ) + '|';
	}
	return symbolTable[node.type] + attributes + this.document( node, true );
};

es.WikitextSerializer.prototype.transclusion = function( node ) {
	var title = [];
	if ( node.namespace === 'Main' ) {
		title.push( '' );
	} else if ( node.namespace !== 'Template' ) {
		title.push( node.namespace );
	}
	title.push( node.title );
	return '{{' + title.join( ':' ) + '}}';
};

es.WikitextSerializer.prototype.parameter = function( node ) {
	return '{{{' + node.name + '}}}';
};

es.WikitextSerializer.prototype.content = function( node ) {
	if ( 'annotations' in node && node.annotations.length ) {
		var annotationSerializer = new es.AnnotationSerializer(),
			tagTable = {
				'textStyle/strong': 'strong',
				'textStyle/emphasize': 'em',
				'textStyle/big': 'big',
				'textStyle/small': 'small',
				'textStyle/superScript': 'sup',
				'textStyle/subScript': 'sub'
			},
			markupTable = {
				'textStyle/bold': "'''",
				'textStyle/italic': "''"
			};
		for ( var i = 0, length = node.annotations.length; i < length; i++ ) {
			var annotation = node.annotations[i];
			if ( annotation.type in tagTable ) {
				annotationSerializer.addTags( annotation.range, tagTable[annotation.type] );
			} else if ( annotation.type in markupTable ) {
				annotationSerializer.add(
					annotation.range, markupTable[annotation.type], markupTable[annotation.type]
				);
			} else {
				switch ( annotation.type ) {
					case 'link/external':
						annotationSerializer.add(
							annotation.range, '[' + annotation.data.href + ' ', ']'
						);
						break;
					case 'link/internal':
						annotationSerializer.add(
							annotation.range, '[[' + annotation.data.title + '|', ']]'
						);
						break;
				}
			}
		}
		return annotationSerializer.render( node.text );
	} else {
		return node.text;
	}
};
/**
 * Event emitter.
 * 
 * @class
 * @abstract
 * @constructor
 * @property events {Object}
 */
es.EventEmitter = function() {
	this.events = {};
};

/* Methods */

/**
 * Emits an event.
 * 
 * @method
 * @param type {String} Type of event
 * @param args {Mixed} First in a list of variadic arguments passed to event handler (optional)
 * @returns {Boolean} If event was handled by at least one listener
 */
es.EventEmitter.prototype.emit = function( type ) {
	if ( type === 'error' && !( 'error' in this.events ) ) {
		throw 'Missing error handler error.';
	}
	if ( !( type in this.events ) ) {
		return false;
	}
	var listeners = this.events[type].slice();
	var args = Array.prototype.slice.call( arguments, 1 );
	for ( var i = 0; i < listeners.length; i++ ) {
		listeners[i].apply( this, args );
	}
	return true;
};

/**
 * Adds a listener to events of a specific type.
 * 
 * @method
 * @param type {String} Type of event to listen to
 * @param listener {Function} Listener to call when event occurs
 * @returns {es.EventEmitter} This object
 * @throws "Invalid listener error" if listener argument is not a function
 */
es.EventEmitter.prototype.addListener = function( type, listener ) {
	if ( typeof listener !== 'function' ) {
		throw 'Invalid listener error. Function expected.';
	}
	this.emit( 'newListener', type, listener );
	if ( type in this.events ) {
		this.events[type].push( listener );
	} else {
		this.events[type] = [listener];
	}
	return this;
};

/**
 * Add multiple listeners at once.
 * 
 * @method
 * @param listeners {Object} List of event/callback pairs
 * @returns {es.EventEmitter} This object
 */
es.EventEmitter.prototype.addListeners = function( listeners ) {
	for ( var event in listeners ) {
		this.addListener( event, listeners[event] );
	}
	return this;
};

/**
 * Add a listener, mapped to a method on a target object.
 * 
 * @method
 * @param target {Object} Object to call methods on when events occur
 * @param event {String} Name of event to trigger on
 * @param method {String} Name of method to call
 * @returns {es.EventEmitter} This object
 */
es.EventEmitter.prototype.addListenerMethod = function( target, event, method ) {
	return this.addListener( event, function() {
		if ( typeof target[method] === 'function' ) {
			target[method].apply( target, Array.prototype.slice.call( arguments, 0 ) );
		} else {
			throw 'Listener method error. Target has no such method: ' + method;
		}
	} );
};

/**
 * Add multiple listeners, each mapped to a method on a target object.
 * 
 * @method
 * @param target {Object} Object to call methods on when events occur
 * @param methods {Object} List of event/method name pairs
 * @returns {es.EventEmitter} This object
 */
es.EventEmitter.prototype.addListenerMethods = function( target, methods ) {
	for ( var event in methods ) {
		this.addListenerMethod( target, event, methods[event] );
	}
	return this;
};

/**
 * Alias for addListener
 * 
 * @method
 */
es.EventEmitter.prototype.on = es.EventEmitter.prototype.addListener;

/**
 * Adds a one-time listener to a specific event.
 * 
 * @method
 * @param type {String} Type of event to listen to
 * @param listener {Function} Listener to call when event occurs
 * @returns {es.EventEmitter} This object
 */
es.EventEmitter.prototype.once = function( type, listener ) {
	var eventEmitter = this;
	return this.addListener( type, function listenerWrapper() {
		eventEmitter.removeListener( type, listenerWrapper );
		listener.apply( eventEmitter, Array.prototype.slice.call( arguments, 0 ) );
	} );
};

/**
 * Removes a specific listener from a specific event.
 * 
 * @method
 * @param type {String} Type of event to remove listener from
 * @param listener {Function} Listener to remove
 * @returns {es.EventEmitter} This object
 * @throws "Invalid listener error" if listener argument is not a function
 */
es.EventEmitter.prototype.removeListener = function( type, listener ) {
	if ( typeof listener !== 'function' ) {
		throw 'Invalid listener error. Function expected.';
	}
	if ( !( type in this.events ) || !this.events[type].length ) {
		return this;
	}
	var handlers = this.events[type];
	if ( handlers.length === 1 && handlers[0] === listener ) {
		delete this.events[type];
	} else {
		var i = es.inArray( listener, handlers );
		if ( i < 0 ) {
			return this;
		}
		handlers.splice( i, 1 );
		if ( handlers.length === 0 ) {
			delete this.events[type];
		}
	}
	return this;
};

/**
 * Removes all listeners from a specific event.
 * 
 * @method
 * @param type {String} Type of event to remove listeners from
 * @returns {es.EventEmitter} This object
 */
es.EventEmitter.prototype.removeAllListeners = function( type ) {
	if ( type in this.events ) {
		delete this.events[type];
	}
	return this;
};

/**
 * Gets a list of listeners attached to a specific event.
 * 
 * @method
 * @param type {String} Type of event to get listeners for
 * @returns {Array} List of listeners to an event
 */
es.EventEmitter.prototype.listeners = function( type ) {
	return type in this.events ? this.events[type] : [];
};
/**
 * Creates an es.DocumentNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @extends {es.EventEmitter}
 */
es.DocumentNode = function() {
	// Inheritance
	es.EventEmitter.call( this );

	// Reusable function for passing update events upstream
	var _this = this;
	this.emitUpdate = function() {
		_this.emit( 'update' );
	};
};

/* Methods */

/**
 * Gets the content length.
 * 
 * @method
 * @abstract
 * @returns {Integer} Length of content
 */
es.DocumentNode.prototype.getContentLength = function() {
	throw 'DocumentNode.getContentLength not implemented in this subclass:' + this.constructor;
};

/**
 * Gets the element length.
 * 
 * @method
 * @abstract
 * @returns {Integer} Length of content
 */
es.DocumentNode.prototype.getElementLength = function() {
	throw 'DocumentNode.getElementLength not implemented in this subclass:' + this.constructor;
};

/**
 * Checks if this node has child nodes.
 * 
 * @method
 * @abstract
 * @returns {Boolean} Whether this node has children
 */
es.DocumentNode.prototype.hasChildren = function() {
	throw 'DocumentNode.hasChildren not implemented in this subclass:' + this.constructor;
};

/**
 * Traverse tree of nodes (model or view) upstream and for each traversed node call callback function passing traversed node as a parameter.
 * Callback function is called for node passed as node paramter as well.
 * 
 * @param {es.DocumentNode} node Node from which to start traversing
 * @param {function} callback Callback method to be called for every traversed node
 * @method
 */
es.DocumentNode.traverseUpstream = function( node, callback ) {
	while ( node ) {
		if ( callback ( node ) === false ) {
			break;
		}
		node = node.getParent();
	}
};

/**
 * Find the common ancestor of two equal-depth nodes, and return the
 * path from each node to the common ancestor.
 * @param {es.DocumentNode} node1
 * @param {es.DocumentNode} node2
 * @returns {Object|Boolean} Object with keys 'commonAncestor', 'node1Path' and 'node2Path',
 *  or false if there is no common ancestor or if the nodes have unequal depth
 */
es.DocumentNode.getCommonAncestorPaths = function( node1, node2 ) {
	var	path1 = [],
		path2 = [],
		n1 = node1,
		n2 = node2;
	
	// Move up from n1 and n2 simultaneously until we find the
	// common ancestor
	while ( n1 !== n2 ) {
		// Add these nodes to their respective paths
		path1.push( n1 );
		path2.push( n2 );
		// Move up
		n1 = n1.getParent();
		n2 = n2.getParent();
		if ( n1 === null || n2 === null ) {
			// Reached a root, so no common ancestor or unequal depth
			return false;
		}
	}
	
	// If we got here, we've found the common ancestor, and because we did
	// simultaneous traversal we also know node1 and node2 have the same depth.
	return { 'commonAncestor': n1, 'node1Path': path1, 'node2Path': path2 };
};

/* Inheritance */

es.extendClass( es.DocumentNode, es.EventEmitter );
/**
 * Creates an es.DocumentModelNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @extends {es.DocumentNode}
 * @param {String} type Symbolic name of node type
 * @param {Object} element Element object in document data
 * @param {Integer} [length] Length of content data in document
 */
es.DocumentModelNode = function( type, element, length ) {
	// Inheritance
	es.DocumentNode.call( this );

	// Properties
	this.type = type;
	this.parent = null;
	this.root = this;
	this.element = element || null;
	this.contentLength = length || 0;
};

/* Abstract Methods */

/**
 * Creates a view for this node.
 * 
 * @abstract
 * @method
 * @returns {es.DocumentViewNode} New item view associated with this model
 */
es.DocumentModelNode.prototype.createView = function() {
	throw 'DocumentModelNode.createView not implemented in this subclass:' + this.constructor;
};

/**
 * Gets a plain object representation of the document's data.
 * 
 * @method
 * @returns {Object} Plain object representation
 */
es.DocumentModelNode.prototype.getPlainObject = function() {
	throw 'DocumentModelNode.getPlainObject not implemented in this subclass:' + this.constructor;
};

/* Methods */

/**
 * Gets the content length.
 * 
 * @method
 * @see {es.DocumentNode.prototype.getContentLength}
 * @returns {Integer} Length of content
 */
es.DocumentModelNode.prototype.getContentLength = function() {
	return this.contentLength;
};

/**
 * Gets the element length.
 * 
 * @method
 * @see {es.DocumentNode.prototype.getElementLength}
 * @returns {Integer} Length of content
 */
es.DocumentModelNode.prototype.getElementLength = function() {
	return this.contentLength + 2;
};

/**
 * Sets the content length.
 * 
 * @method
 * @param {Integer} contentLength Length of content
 * @throws Invalid content length error if contentLength is less than 0
 */
es.DocumentModelNode.prototype.setContentLength = function( contentLength ) {
	if ( contentLength < 0 ) {
		throw 'Invalid content length error. Content length can not be less than 0.';
	}
	var diff = contentLength - this.contentLength;
	this.contentLength = contentLength;
	if ( this.parent ) {
		this.parent.adjustContentLength( diff );
	}
};

/**
 * Adjust the content length.
 * 
 * @method
 * @param {Integer} adjustment Amount to adjust content length by
 * @throws Invalid adjustment error if resulting length is less than 0
 */
es.DocumentModelNode.prototype.adjustContentLength = function( adjustment, quiet ) {
	this.contentLength += adjustment;
	// Make sure the adjustment was sane
	if ( this.contentLength < 0 ) {
		// Reverse the adjustment
		this.contentLength -= adjustment;
		// Complain about it
		throw 'Invalid adjustment error. Content length can not be less than 0.';
	}
	if ( this.parent ) {
		this.parent.adjustContentLength( adjustment, true );
	}
	if ( !quiet ) {
		this.emit( 'update' );
	}
};

/**
 * Attaches this node to another as a child.
 * 
 * @method
 * @param {es.DocumentModelNode} parent Node to attach to
 * @emits attach (parent)
 */
es.DocumentModelNode.prototype.attach = function( parent ) {
	this.emit( 'beforeAttach', parent );
	this.parent = parent;
	this.setRoot( parent.getRoot() );
	this.emit( 'afterAttach', parent );
};

/**
 * Detaches this node from it's parent.
 * 
 * @method
 * @emits detach
 */
es.DocumentModelNode.prototype.detach = function() {
	this.emit( 'beforeDetach' );
	this.parent = null;
	this.clearRoot();
	this.emit( 'afterDetach' );
};

/**
 * Gets a reference to this node's parent.
 * 
 * @method
 * @returns {es.DocumentModelNode} Reference to this node's parent
 */
es.DocumentModelNode.prototype.getParent = function() {
	return this.parent;
};

/**
 * Gets the root node in the tree this node is currently attached to.
 * 
 * @method
 * @returns {es.DocumentModelNode} Root node
 */
es.DocumentModelNode.prototype.getRoot = function() {
	return this.root;
};

/**
 * Sets the root node to this and all of it's children.
 * 
 * This method is overridden by nodes with children.
 * 
 * @method
 * @param {es.DocumentModelNode} root Node to use as root
 */
es.DocumentModelNode.prototype.setRoot = function( root ) {
	this.root = root;
};

/**
 * Clears the root node from this and all of it's children.
 * 
 * This method is overridden by nodes with children.
 * 
 * @method
 */
es.DocumentModelNode.prototype.clearRoot = function() {
	this.root = null;
};

/**
 * Gets the element object.
 * 
 * @method
 * @returns {Object} Element object in linear data model
 */
es.DocumentModelNode.prototype.getElement = function() {
	return this.element;
};

/**
 * Gets the symbolic element type name.
 * 
 * @method
 * @returns {String} Symbolic name of element type
 */
es.DocumentModelNode.prototype.getElementType = function() {
	//return this.element.type;
	// We can't use this.element.type because this.element may be null
	// So this function now returns this.type and should really be called
	// getType()
	// TODO: Do we care?
	return this.type;
};

/**
 * Gets an element attribute value.
 * 
 * @method
 * @returns {Mixed} Value of attribute, or null if no such attribute exists
 */
es.DocumentModelNode.prototype.getElementAttribute = function( key ) {
	if ( this.element && this.element.attributes && key in this.element.attributes ) {
		return this.element.attributes[key];
	}
	return null;
};

/**
 * Gets all element data, including the element opening, closing and it's contents.
 * 
 * @method
 * @returns {Array} Element data
 */
es.DocumentModelNode.prototype.getElementData = function() {
	// Get reference to the document, which might be this node but otherwise should be this.root
	var root = this.type === 'document' ?
		this : ( this.root && this.root.type === 'document' ? this.root : null );
	if ( root ) {
		return root.getElementDataFromNode( this );
	}
	return [];
};

/**
 * Gets content data within a given range.
 * 
 * @method
 * @param {es.Range} [range] Range of content to get
 * @returns {Array} Content data
 */
es.DocumentModelNode.prototype.getContentData = function( range ) {
	// Get reference to the document, which might be this node but otherwise should be this.root
	var root = this.type === 'document' ?
		this : ( this.root && this.root.type === 'document' ? this.root : null );
	if ( root ) {
		return root.getContentDataFromNode( this, range );
	}
	return [];
};

/**
 * Gets plain text version of the content within a specific range.
 * 
 * Two newlines are inserted between leaf nodes.
 * 
 * TODO: Maybe do something more adaptive with newlines
 * 
 * @method
 * @param {es.Range} [range] Range of text to get
 * @returns {String} Text within given range
 */
es.DocumentModelNode.prototype.getContentText = function( range ) {
	var content = this.getContentData( range );
	// Copy characters
	var text = '',
		element = false;
	for ( var i = 0, length = content.length; i < length; i++ ) {
		if ( typeof content[i].type === 'string' ) {
			if ( i ) {
				element = true;
			}
		} else {
			if ( element ) {
				text += '\n\n';
				element = false;
			}
			text += typeof content[i] === 'string' ? content[i] : content[i][0];
		}
	}
	return text;
};

/* Inheritance */

es.extendClass( es.DocumentModelNode, es.DocumentNode );
/**
 * Creates an es.DocumentBranchNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @param {es.DocumentNode[]} nodes List of document nodes to add
 */
es.DocumentBranchNode = function( nodes ) {
	this.children = es.isArray( nodes ) ? nodes : [];
};

/* Methods */

/**
 * Checks if this node has child nodes.
 * 
 * @method
 * @see {es.DocumentNode.prototype.hasChildren}
 * @returns {Boolean} Whether this node has children
 */
es.DocumentBranchNode.prototype.hasChildren = function() {
	return true;
};

/**
 * Gets a list of child nodes.
 * 
 * @abstract
 * @method
 * @returns {es.DocumentNode[]} List of document nodes
 */
es.DocumentBranchNode.prototype.getChildren = function() {
	return this.children;
};

/**
 * Gets the index of a given child node.
 * 
 * @method
 * @param {es.DocumentModelNode} node Child node to find index of
 * @returns {Integer} Index of child node or -1 if node was not found
 */
es.DocumentBranchNode.prototype.indexOf = function( node ) {
	return es.inArray( node, this.children );
};

/**
 * Traverse leaf nodes depth first.
 * 
 * Callback functions are expected to accept a node and index argument. If a callback returns false,
 * iteration will stop.
 * 
 * @param {Function} callback Function to execute for each leaf node
 * @param {es.DocumentNode} [from] Node to start at. Must be a descendant of this node
 * @param {Boolean} [reverse] Whether to iterate backwards
 */
es.DocumentBranchNode.prototype.traverseLeafNodes = function( callback, from, reverse ) {
		// Stack of indices that lead from this to node
	var	indexStack = [],
		// Node whose children we're currently traversing
		node = this,
		// Index of the child node we're currently visiting
		index = reverse ? node.children.length - 1 : 0,
		// Shortcut for node.children[index]
		childNode,
		// Result of the last invocation of the callback
		callbackResult,
		// Variables for the loop that builds indexStack if from is specified
		n, p, i;
	
	if ( from !== undefined ) {
		// Reverse-engineer the index stack by starting at from and
		// working our way up until we reach this
		n = from;
		while ( n !== this ) {
			p = n.getParent();
			if ( !p ) {
				// n is a root node and we haven't reached this
				// That means from isn't a descendant of this
				throw "from parameter passed to traverseLeafNodes() must be a descendant";
			}
			// Find the index of n in p
			i = p.indexOf( n );
			if ( i === -1 ) {
				// This isn't supposed to be possible
				throw "Tree corruption detected: node isn't in its parent's children array";
			}
			indexStack.push( i );
			// Move up
			n = p;
		}
		// We've built the indexStack in reverse order, so reverse it
		indexStack = indexStack.reverse();
		
		// Set up the variables such that from will be visited next
		index = indexStack.pop();
		node = from.getParent(); // from is a descendant of this so its parent exists
		
		// If we're going in reverse, then we still need to visit from if it's
		// a leaf node, but we should not descend into it
		// So if from is not a leaf node, skip it now
		if ( reverse && from.hasChildren() ) {
			index--;
		}
	}
	
	while ( true ) {
		childNode = node.children[index];
		if ( childNode === undefined ) {
			if ( indexStack.length > 0 ) {
				// We're done traversing the current node, move back out of it
				node = node.getParent();
				index = indexStack.pop();
				// Move to the next child
				index += reverse ? -1 : 1;
				continue;
			} else {
				// We can't move up any more, so we're done
				return;
			}
		}
		
		if ( childNode.hasChildren() ) {
			// Descend into this node
			node = childNode;
			// Push our current index onto the stack
			indexStack.push( index );
			// Set the current index to the first element we're visiting
			index = reverse ? node.children.length - 1 : 0;
		} else {
			// This is a leaf node, visit it
			callbackResult = callback( childNode ); // TODO what is index?
			if ( callbackResult === false ) {
				// The callback is telling us to stop
				return;
			}
			// Move to the next child
			index += reverse ? -1 : 1;
		}
	}
};

/**
 * Gets the range within this node that a given child node covers.
 * 
 * @method
 * @param {es.ModelNode} node Node to get range for
 * @param {Boolean} [shallow] Do not iterate into child nodes of child nodes
 * @returns {es.Range|null} Range of node or null if node was not found
 */
es.DocumentBranchNode.prototype.getRangeFromNode = function( node, shallow ) {
	if ( this.children.length ) {
		var childNode;
		for ( var i = 0, length = this.children.length, left = 0; i < length; i++ ) {
			childNode = this.children[i];
			if ( childNode === node ) {
				return new es.Range( left, left + childNode.getElementLength() );
			}
			if ( !shallow && childNode.hasChildren() && childNode.getChildren().length ) {
				var range = childNode.getRangeFromNode( node );
				if ( range !== null ) {
					// Include opening of parent
					left++;
					return es.Range.newFromTranslatedRange( range, left );
				}
			}
			left += childNode.getElementLength();
		}
	}
	return null;
};

/**
 * Gets the content offset of a node.
 * 
 * This method is pretty expensive. If you need to get different slices of the same content, get
 * the content first, then slice it up locally.
 * 
 * TODO: Rewrite this method to not use recursion, because the function call overhead is expensive
 * 
 * @method
 * @param {es.DocumentNode} node Node to get offset of
 * @param {Boolean} [shallow] Do not iterate into child nodes of child nodes
 * @returns {Integer} Offset of node or -1 of node was not found
 */
es.DocumentBranchNode.prototype.getOffsetFromNode = function( node, shallow ) {
	if ( node === this ) {
		return 0;
	}
	if ( this.children.length ) {
		var offset = 0,
			childNode;
		for ( var i = 0, length = this.children.length; i < length; i++ ) {
			childNode = this.children[i];
			if ( childNode === node ) {
				return offset;
			}
			if ( !shallow && childNode.hasChildren() && childNode.getChildren().length ) {
				var childOffset = this.getOffsetFromNode.call( childNode, node );
				if ( childOffset !== -1 ) {
					return offset + 1 + childOffset;
				}
			}
			offset += childNode.getElementLength();
		}
	}
	return -1;
};

/**
 * Gets the node at a given offset.
 * 
 * This method is pretty expensive. If you need to get different slices of the same content, get
 * the content first, then slice it up locally.
 * 
 * TODO: Rewrite this method to not use recursion, because the function call overhead is expensive
 * 
 * @method
 * @param {Integer} offset Offset get node for
 * @param {Boolean} [shallow] Do not iterate into child nodes of child nodes
 * @returns {es.DocumentNode|null} Node at offset, or null if non was found
 */
es.DocumentBranchNode.prototype.getNodeFromOffset = function( offset, shallow ) {
	if ( offset === 0 ) {
		return this;
	}
	// TODO a lot of logic is duplicated in selectNodes(), abstract that into a traverser or something
	if ( this.children.length ) {
		var nodeOffset = 0,
			nodeLength,
			childNode;
		for ( var i = 0, length = this.children.length; i < length; i++ ) {
			childNode = this.children[i];
			if ( offset == nodeOffset ) {
				// The requested offset is right before childNode,
				// so it's not inside any of this's children, but inside this
				return this;
			}
			nodeLength = childNode.getElementLength();
			if ( offset >= nodeOffset && offset < nodeOffset + nodeLength ) {
				if ( !shallow && childNode.hasChildren() && childNode.getChildren().length ) {
					return this.getNodeFromOffset.call( childNode, offset - nodeOffset - 1 );
				} else {
					return childNode;
				}
			}
			nodeOffset += nodeLength;
		}
		if ( offset == nodeOffset ) {
			// The requested offset is right before this.children[i],
			// so it's not inside any of this's children, but inside this
			return this;
		}
	}
	return null;
};

/**
 * Gets the index of a child node from a given offset.
 * 
 * @method
 * @param {Integer} offset Offset to find index of
 * @returns {Integer} Index of child node at offset or -1 if offset was out of range
 */
es.DocumentBranchNode.prototype.getIndexFromOffset = function( offset ) {
	var left = 0,
		elementLength;
	for ( var i = 0; i < this.children.length; i++ ) {
		elementLength = this.children[i].getElementLength();
		if ( offset >= left && offset < left + elementLength ) {
			return i;
		}
		left += elementLength;
	}
	return -1;
};

/**
 * Gets a list of nodes and their sub-ranges which are covered by a given range.
 * 
 * @method
 * @param {es.Range} range Range to select nodes within
 * @param {Boolean} [shallow] Do not recurse into child nodes of child nodes
 * @param {Number} [offset] Used for recursive invocations. Callers should not pass this parameter
 * @returns {Array} List of objects with 'node', 'range' and 'globalRange' properties describing nodes which are
 * covered by the range and the range within the node that is covered. If an entire node is covered, 'range' is
 * absent but 'globalRange' is still set
 */
es.DocumentBranchNode.prototype.selectNodes = function( range, shallow, offset ) {
	if ( typeof range === 'undefined' ) {
		range = new es.Range( 0, this.model.getContentLength() );
	} else {
		range.normalize();
	}
	var nodes = [],
		i,
		j,
		left,
		right,
		start = range.start,
		end = range.end,
		startInside,
		endInside,
		childNode;
	offset = offset || 0;
	
	if ( start < 0 ) {
		throw 'The start offset of the range is negative';
	}
	
	if ( this.children.length === 0 ) {
		// Special case: this node doesn't have any children
		// The return value is simply the range itself, if it is not out of bounds
		if ( end > this.getContentLength() ) {
			throw 'The end offset of the range is past the end of the node';
		}
		return [{ 'node': this, 'range': new es.Range( start, end ), 'globalRange': new es.Range( start + offset, end + offset ) }];
	}
	
	// This node has children, loop over them
	left = 1; // First offset inside the first child. Offset 0 is before the first child
	for ( i = 0; i < this.children.length; i++ ) {
		childNode = this.children[i];
		// left <= any offset inside childNode <= right
		right = left + childNode.getContentLength();
		
		if ( start == end && ( start == left - 1 || start == right + 1 ) ) {
			// Empty range outside of any node
			return [{ 'node': this, 'range': new es.Range( start, end ), 'globalRange': new es.Range( start + offset, end + offset ) }];
		}
		
		startInside = start >= left && start <= right; // is the start inside childNode?
		endInside = end >= left && end <= right; // is the end inside childNode?
		
		if ( startInside && endInside ) {
			// The range is entirely inside childNode
			if ( shallow || !childNode.children ) {
				// For leaf nodes, use the same behavior as for shallow calls.
				// A proper recursive function would let the recursion handle this,
				// but the leaves don't have .selectNodes() because they're not DocumentBranchNodes
				// FIXME get rid of this crazy branch-specificity
				// TODO should probably rewrite this recursive function as an iterative function anyway, probably faster
				nodes = [
					{
						'node': childNode,
						'range': new es.Range( start - left, end - left ),
						'globalRange': new es.Range( start + offset, end + offset )
					}
				];
			} else {
				// Recurse into childNode
				nodes = childNode.selectNodes( new es.Range( start - left, end - left ), false, left + offset );
			}
			// Since the start and end are both inside childNode, we know for sure that we're
			// done, so return
			return nodes;
		} else if ( startInside ) {
			// The start is inside childNode but the end isn't
			if ( shallow || !childNode.children ) {
				// Add a range from the start of the range to the end of childNode
				nodes.push( {
					'node': childNode,
					'range': new es.Range( start - left, right - left ),
					'globalRange': new es.Range( start + offset, right + offset )
				} );
			} else {
				nodes = nodes.concat( childNode.selectNodes( new es.Range( start - left, right - left ), false, left + offset ) );
			}
		} else if ( endInside ) {
			// The end is inside childNode but the start isn't
			if ( shallow || !childNode.children ) {
				// Add a range from the start of childNode to the end of the range
				nodes.push( {
					'node': childNode,
					'range': new es.Range( 0, end - left ),
					'globalRange': new es.Range( left + offset, end + offset )
				} );
			} else {
				nodes = nodes.concat( childNode.selectNodes( new es.Range( 0, end - left ), false, left + offset ) );
			}
			// We've found the end, so we're done
			return nodes;
		} else if ( end == right + 1 ) {
			// end is between childNode and this.children[i+1]
			// start is not inside childNode, so the selection covers
			// all of childNode, then ends
			nodes.push( { 'node': childNode, 'globalRange': new es.Range( left - 1 + offset, right + 1 + offset ) } );
			// We've reached the end so we're done
			return nodes;
		} else if ( start == left - 1 ) {
			// start is between this.children[i-1] and childNode
			// end is not inside childNode, so the selection covers
			// all of childNode and more
			nodes.push( { 'node': childNode, 'globalRange': new es.Range( left - 1 + offset, right + 1 + offset ) } );
		} else if ( nodes.length > 0 ) {
			// Neither the start nor the end is inside childNode, but nodes is non-empty,
			// so childNode must be between the start and the end
			// Add the entire node, so no range property
			nodes.push( { 'node': childNode, 'globalRange': new es.Range( left - 1 + offset, right + 1 + offset ) } );
		}
		
		// Move left to the start of this.children[i+1] for the next iteration
		// We use +2 because we need to jump over the offset between childNode and
		// this.children[i+1]
		left = right + 2;
		if ( end < left ) {
			// We've skipped over the end, so we're done
			return nodes;
		}
	}
	
	// If we got here, that means that at least some part of the range is out of bounds
	// This is an error
	if ( start > right + 1 ) {
		throw 'The start offset of the range is past the end of the node';
	} else {
		// Apparently the start was inside this node, but the end wasn't
		throw 'The end offset of the range is past the end of the node';
	}
	return nodes;
};
/**
 * Creates an es.DocumentLeafNode object.
 * 
 * @class
 * @abstract
 * @constructor
 */
es.DocumentLeafNode = function() {
	//
};

/* Methods */

/**
 * Checks if this node has child nodes.
 * 
 * @method
 * @see {es.DocumentNode.prototype.hasChildren}
 * @returns {Boolean} Whether this node has children
 */
es.DocumentLeafNode.prototype.hasChildren = function() {
	return false;
};
/**
 * Creates an es.DocumentModelBranchNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @extends {es.DocumentBranchNode}
 * @extends {es.DocumentModelNode}
 * @param {String} type Symbolic name of node type
 * @param {Object} element Element object in document data
 * @param {es.DocumentModelBranchNode[]} [contents] List of child nodes to append
 */
es.DocumentModelBranchNode = function( type, element, contents ) {
	// Inheritance
	es.DocumentBranchNode.call( this );
	es.DocumentModelNode.call( this, type, element, 0 );

	// Child nodes
	if ( es.isArray( contents ) ) {
		for ( var i = 0; i < contents.length; i++ ) {
			this.push( contents[i] );
		}
	}
};

/* Methods */

/**
 * Gets a plain object representation of the document's data.
 * 
 * @method
 * @see {es.DocumentModelNode.getPlainObject}
 * @see {es.DocumentModel.newFromPlainObject}
 * @returns {Object} Plain object representation
 */
es.DocumentModelBranchNode.prototype.getPlainObject = function() {
	var obj = { 'type': this.type };
	if ( this.element && this.element.attributes ) {
		obj.attributes = es.copyObject( this.element.attributes );
	}
	obj.children = [];
	for ( var i = 0; i < this.children.length; i++ ) {
		obj.children.push( this.children[i].getPlainObject() );
	}
	return obj;
};

/**
 * Adds a node to the end of this node's children.
 * 
 * @method
 * @param {es.DocumentModelBranchNode} childModel Item to add
 * @returns {Integer} New number of children
 * @emits beforePush (childModel)
 * @emits afterPush (childModel)
 * @emits update
 */
es.DocumentModelBranchNode.prototype.push = function( childModel ) {
	this.emit( 'beforePush', childModel );
	childModel.attach( this );
	childModel.on( 'update', this.emitUpdate );
	this.children.push( childModel );
	this.adjustContentLength( childModel.getElementLength(), true );
	this.emit( 'afterPush', childModel );
	this.emit( 'update' );
	return this.children.length;
};

/**
 * Adds a node to the beginning of this node's children.
 * 
 * @method
 * @param {es.DocumentModelBranchNode} childModel Item to add
 * @returns {Integer} New number of children
 * @emits beforeUnshift (childModel)
 * @emits afterUnshift (childModel)
 * @emits update
 */
es.DocumentModelBranchNode.prototype.unshift = function( childModel ) {
	this.emit( 'beforeUnshift', childModel );
	childModel.attach( this );
	childModel.on( 'update', this.emitUpdate );
	this.children.unshift( childModel );
	this.adjustContentLength( childModel.getElementLength(), true );
	this.emit( 'afterUnshift', childModel );
	this.emit( 'update' );
	return this.children.length;
};

/**
 * Removes a node from the end of this node's children
 * 
 * @method
 * @returns {es.DocumentModelBranchNode} Removed childModel
 * @emits beforePop
 * @emits afterPop
 * @emits update
 */
es.DocumentModelBranchNode.prototype.pop = function() {
	if ( this.children.length ) {
		this.emit( 'beforePop' );
		var childModel = this.children[this.children.length - 1];
		childModel.detach();
		childModel.removeListener( 'update', this.emitUpdate );
		this.children.pop();
		this.adjustContentLength( -childModel.getElementLength(), true );
		this.emit( 'afterPop' );
		this.emit( 'update' );
		return childModel;
	}
};

/**
 * Removes a node from the beginning of this node's children
 * 
 * @method
 * @returns {es.DocumentModelBranchNode} Removed childModel
 * @emits beforeShift
 * @emits afterShift
 * @emits update
 */
es.DocumentModelBranchNode.prototype.shift = function() {
	if ( this.children.length ) {
		this.emit( 'beforeShift' );
		var childModel = this.children[0];
		childModel.detach();
		childModel.removeListener( 'update', this.emitUpdate );
		this.children.shift();
		this.adjustContentLength( -childModel.getElementLength(), true );
		this.emit( 'afterShift' );
		this.emit( 'update' );
		return childModel;
	}
};

/**
 * Adds and removes nodes from this node's children.
 * 
 * @method
 * @param {Integer} index Index to remove and or insert nodes at
 * @param {Integer} howmany Number of nodes to remove
 * @param {es.DocumentModelBranchNode} [...] Variadic list of nodes to insert
 * @returns {es.DocumentModelBranchNode[]} Removed nodes
 * @emits beforeSplice (index, howmany, [...])
 * @emits afterSplice (index, howmany, [...])
 * @emits update
 */
es.DocumentModelBranchNode.prototype.splice = function( index, howmany ) {
	var i,
		length,
		args = Array.prototype.slice.call( arguments, 0 ),
		diff = 0;
	this.emit.apply( this, ['beforeSplice'].concat( args ) );
	if ( args.length >= 3 ) {
		for ( i = 2, length = args.length; i < length; i++ ) {
			args[i].attach( this );
			args[i].on( 'update', this.emitUpdate );
			diff += args[i].getElementLength();
		}
	}
	var removals = this.children.splice.apply( this.children, args );
	for ( i = 0, length = removals.length; i < length; i++ ) {
		removals[i].detach();
		removals[i].removeListener( 'update', this.emitUpdate );
		diff -= removals[i].getElementLength();
	}
	this.adjustContentLength( diff, true );
	this.emit.apply( this, ['afterSplice'].concat( args ) );
	this.emit( 'update' );
	return removals;
};

/**
 * Sorts this node's children.
 * 
 * @method
 * @param {Function} sortfunc Function to use when sorting
 * @emits beforeSort (sortfunc)
 * @emits afterSort (sortfunc)
 * @emits update
 */
es.DocumentModelBranchNode.prototype.sort = function( sortfunc ) {
	this.emit( 'beforeSort', sortfunc );
	this.children.sort( sortfunc );
	this.emit( 'afterSort', sortfunc );
	this.emit( 'update' );
};

/**
 * Reverses the order of this node's children.
 * 
 * @method
 * @emits beforeReverse
 * @emits afterReverse
 * @emits update
 */
es.DocumentModelBranchNode.prototype.reverse = function() {
	this.emit( 'beforeReverse' );
	this.children.reverse();
	this.emit( 'afterReverse' );
	this.emit( 'update' );
};

/**
 * Sets the root node to this and all of it's children.
 * 
 * @method
 * @see {es.DocumentModelNode.prototype.setRoot}
 * @param {es.DocumentModelNode} root Node to use as root
 */
es.DocumentModelBranchNode.prototype.setRoot = function( root ) {
	this.root = root;
	for ( var i = 0; i < this.children.length; i++ ) {
		this.children[i].setRoot( root );
	}
};

/**
 * Clears the root node from this and all of it's children.
 * 
 * @method
 * @see {es.DocumentModelNode.prototype.clearRoot}
 */
es.DocumentModelBranchNode.prototype.clearRoot = function() {
	this.root = null;
	for ( var i = 0; i < this.children.length; i++ ) {
		this.children[i].clearRoot();
	}
};

/* Inheritance */

es.extendClass( es.DocumentModelBranchNode, es.DocumentBranchNode );
es.extendClass( es.DocumentModelBranchNode, es.DocumentModelNode );
/**
 * Creates an es.DocumentModelLeafNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @extends {es.DocumentLeafNode}
 * @extends {es.DocumentModelNode}
 * @param {String} type Symbolic name of node type
 * @param {Object} element Element object in document data
 * @param {Integer} [length] Length of content data in document
 */
es.DocumentModelLeafNode = function( type, element, length ) {
	// Inheritance
	es.DocumentLeafNode.call( this );
	es.DocumentModelNode.call( this, type, element, length );

	// Properties
	this.contentLength = length || 0;
};

/* Methods */

/**
 * Gets a plain object representation of the document's data.
 * 
 * @method
 * @see {es.DocumentModelNode.getPlainObject}
 * @see {es.DocumentModel.newFromPlainObject}
 * @returns {Object} Plain object representation, 
 */
es.DocumentModelLeafNode.prototype.getPlainObject = function() {
	var obj = { 'type': this.type };
	if ( this.element && this.element.attributes ) {
		obj.attributes = es.copyObject( this.element.attributes );
	}
	obj.content = es.DocumentModel.getExpandedContentData( this.getContentData() );
	return obj;
};

/* Inheritance */

es.extendClass( es.DocumentModelLeafNode, es.DocumentLeafNode );
es.extendClass( es.DocumentModelLeafNode, es.DocumentModelNode );
/**
 * Creates an es.DocumentViewNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @extends {es.DocumentNode}
 * @param {es.DocumentModelNode} model Model to observe
 * @param {jQuery} [$element=$( '<div></div>' )] Element to use as a container
 */
es.DocumentViewNode = function( model, $element ) {
	// Inheritance
	es.DocumentNode.call( this );
	
	// Properties
	this.model = model;
	this.parent = null;
	this.$ = $element || $( '<div/>' );
};

/* Methods */

/**
 * Gets the length of the element in the model.
 * 
 * @method
 * @see {es.DocumentNode.prototype.getElementLength}
 * @returns {Integer} Length of content
 */
es.DocumentViewNode.prototype.getElementLength = function() {
	return this.model.getElementLength();
};

/**
 * Gets the length of the content in the model.
 * 
 * @method
 * @see {es.DocumentNode.prototype.getContentLength}
 * @returns {Integer} Length of content
 */
es.DocumentViewNode.prototype.getContentLength = function() {
	return this.model.getContentLength();
};

/**
 * Attaches node as a child to another node.
 * 
 * @method
 * @param {es.DocumentViewNode} parent Node to attach to
 * @emits attach (parent)
 */
es.DocumentViewNode.prototype.attach = function( parent ) {
	this.parent = parent;
	this.emit( 'attach', parent );
};

/**
 * Detaches node from it's parent.
 * 
 * @method
 * @emits detach (parent)
 */
es.DocumentViewNode.prototype.detach = function() {
	var parent = this.parent;
	this.parent = null;
	this.emit( 'detach', parent );
};

/**
 * Gets a reference to this node's parent.
 * 
 * @method
 * @returns {es.DocumentViewNode} Reference to this node's parent
 */
es.DocumentViewNode.prototype.getParent = function() {
	return this.parent;
};

/**
 * Gets a reference to the model this node observes.
 * 
 * @method
 * @returns {es.DocumentModelNode} Reference to the model this node observes
 */
es.DocumentViewNode.prototype.getModel = function() {
	return this.model;
};

es.DocumentViewNode.getSplitableNode = function( node ) {
	var splitableNode = null;

	es.DocumentNode.traverseUpstream( node, function( node ) {
		var elementType = node.model.getElementType();
		if ( splitableNode != null && es.DocumentView.splitRules[ elementType ].children === true ) {
			return false;
		}
		splitableNode = es.DocumentView.splitRules[ elementType ].self ? node : null
	} );
	return splitableNode;
};

/* Inheritance */

es.extendClass( es.DocumentViewNode, es.DocumentNode );
/**
 * Creates an es.DocumentViewBranchNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @extends {es.DocumentBranchNode}
 * @extends {es.DocumentViewNode}
 * @param model {es.ModelNode} Model to observe
 * @param {jQuery} [$element] Element to use as a container
 */
es.DocumentViewBranchNode = function( model, $element, horizontal ) {
	// Inheritance
	es.DocumentBranchNode.call( this );
	es.DocumentViewNode.call( this, model, $element );

	// Properties
	this.horizontal = horizontal || false;

	if ( model ) {
		// Append existing model children
		var childModels = model.getChildren();
		for ( var i = 0; i < childModels.length; i++ ) {
			this.onAfterPush( childModels[i] );
		}

		// Observe and mimic changes on model
		this.model.addListenerMethods( this, {
			'afterPush': 'onAfterPush',
			'afterUnshift': 'onAfterUnshift',
			'afterPop': 'onAfterPop',
			'afterShift': 'onAfterShift',
			'afterSplice': 'onAfterSplice',
			'afterSort': 'onAfterSort',
			'afterReverse': 'onAfterReverse'
		} );
	}
};

/* Methods */

es.DocumentViewBranchNode.prototype.onAfterPush = function( childModel ) {
	var childView = childModel.createView();
	this.emit( 'beforePush', childView );
	childView.attach( this );
	childView.on( 'update', this.emitUpdate );
	// Update children
	this.children.push( childView );
	// Update DOM
	this.$.append( childView.$ );
	// TODO: adding and deleting classes has to be implemented for unshift, shift, splice, sort
	// and reverse as well
	if ( this.children.length === 1 ) {
		childView.$.addClass('es-viewBranchNode-firstChild');
	}
	this.emit( 'afterPush', childView );
	this.emit( 'update' );
};

es.DocumentViewBranchNode.prototype.onAfterUnshift = function( childModel ) {
	var childView = childModel.createView();
	this.emit( 'beforeUnshift', childView );
	childView.attach( this );
	childView.on( 'update', this.emitUpdate );
	// Update children
	this.children.unshift( childView );
	// Update DOM
	this.$.prepend( childView.$ );
	this.emit( 'afterUnshift', childView );
	this.emit( 'update' );
};

es.DocumentViewBranchNode.prototype.onAfterPop = function() {
	this.emit( 'beforePop' );
	// Update children
	var childView = this.children.pop();
	childView.detach();
	childView.removeEventListener( 'update', this.emitUpdate );
	// Update DOM
	childView.$.detach();
	this.emit( 'afterPop' );
	this.emit( 'update' );
};

es.DocumentViewBranchNode.prototype.onAfterShift = function() {
	this.emit( 'beforeShift' );
	// Update children
	var childView = this.children.shift();
	childView.detach();
	childView.removeEventListener( 'update', this.emitUpdate );
	// Update DOM
	childView.$.detach();
	this.emit( 'afterShift' );
	this.emit( 'update' );
};

es.DocumentViewBranchNode.prototype.onAfterSplice = function( index, howmany ) {
	var i,
		length,
		args = Array.prototype.slice.call( arguments, 0 );
	// Convert models to views and attach them to this node
	if ( args.length >= 3 ) {
		for ( i = 2, length = args.length; i < length; i++ ) {
			args[i] = args[i].createView();
		}
	}
	this.emit.apply( this, ['beforeSplice'].concat( args ) );
	var removals = this.children.splice.apply( this.children, args );
	for ( i = 0, length = removals.length; i < length; i++ ) {
		removals[i].detach();
		removals[i].removeListener( 'update', this.emitUpdate );
		// Update DOM
		removals[i].$.detach();
	}
	if ( args.length >= 3 ) {
		var $target;
		if ( index ) {
			// Get the element before the insertion point
			$anchor = this.$.children().eq( index - 1 );
		}
		for ( i = args.length - 1; i >= 2; i-- ) {
			args[i].attach( this );
			args[i].on( 'update', this.emitUpdate );
			if ( index ) {
				$anchor.after( args[i].$ );
			} else {
				this.$.prepend( args[i].$ );
			}
		}
	}
	this.emit.apply( this, ['afterSplice'].concat( args ) );
	if ( args.length >= 3 ) {
		for ( i = 2, length = args.length; i < length; i++ ) {
			args[i].renderContent();
		}
	}
	this.emit( 'update' );
};

es.DocumentViewBranchNode.prototype.onAfterSort = function() {
	this.emit( 'beforeSort' );
	var childModels = this.model.getChildren();
	for ( var i = 0; i < childModels.length; i++ ) {
		for ( var j = 0; j < this.children.length; j++ ) {
			if ( this.children[j].getModel() === childModels[i] ) {
				var childView = this.children[j];
				// Update children
				this.children.splice( j, 1 );
				this.children.push( childView );
				// Update DOM
				this.$.append( childView.$ );
			}
		}
	}
	this.emit( 'afterSort' );
	this.emit( 'update' );
	this.renderContent();
};

es.DocumentViewBranchNode.prototype.onAfterReverse = function() {
	this.emit( 'beforeReverse' );
	// Update children
	this.reverse();
	// Update DOM
	this.$.children().each( function() {
		$(this).prependTo( $(this).parent() );
	} );
	this.emit( 'afterReverse' );
	this.emit( 'update' );
	this.renderContent();
};

/**
 * Render content.
 * 
 * @method
 */
es.DocumentViewBranchNode.prototype.renderContent = function() {
	for ( var i = 0; i < this.children.length; i++ ) {
		this.children[i].renderContent();
	}
};

/**
 * Draw selection around a given range.
 * 
 * @method
 * @param {es.Range} range Range of content to draw selection around
 */
es.DocumentViewBranchNode.prototype.drawSelection = function( range ) {
	var selectedNodes = this.selectNodes( range, true );
	for ( var i = 0; i < this.children.length; i++ ) {
		if ( selectedNodes.length && this.children[i] === selectedNodes[0].node ) {
			for ( var j = 0; j < selectedNodes.length; j++ ) {
				selectedNodes[j].node.drawSelection( selectedNodes[j].range );
			}
			i += selectedNodes.length - 1;
		} else {
			this.children[i].clearSelection();
		}
	}
};

/**
 * Clear selection.
 * 
 * @method
 */
es.DocumentViewBranchNode.prototype.clearSelection = function() {
	for ( var i = 0; i < this.children.length; i++ ) {
		this.children[i].clearSelection();
	}
};

/**
 * Gets the nearest offset of a rendered position.
 * 
 * @method
 * @param {es.Position} position Position to get offset for
 * @returns {Integer} Offset of position
 */
es.DocumentViewBranchNode.prototype.getOffsetFromRenderedPosition = function( position ) {
	if ( this.children.length === 0 ) {
		return 0;
	}
	var node = this.children[0];
	for ( var i = 1; i < this.children.length; i++ ) {
		if ( this.horizontal && this.children[i].$.offset().left > position.left ) {
			break;
		} else if ( !this.horizontal && this.children[i].$.offset().top > position.top ) {
			break;			
		}
		node = this.children[i];
	}
	return node.getParent().getOffsetFromNode( node, true ) +
		node.getOffsetFromRenderedPosition( position ) + 1;
};

/**
 * Gets rendered position of offset within content.
 * 
 * @method
 * @param {Integer} offset Offset to get position for
 * @returns {es.Position} Position of offset
 */
es.DocumentViewBranchNode.prototype.getRenderedPositionFromOffset = function( offset, leftBias ) {
	var node = this.getNodeFromOffset( offset, true );
	if ( node !== null ) {
		return node.getRenderedPositionFromOffset(
			offset - this.getOffsetFromNode( node, true ) - 1,
			leftBias
		);
	}
	return null;
};

es.DocumentViewBranchNode.prototype.getRenderedLineRangeFromOffset = function( offset ) {
	var node = this.getNodeFromOffset( offset, true );
	if ( node !== null ) {
		var nodeOffset = this.getOffsetFromNode( node, true );
		return es.Range.newFromTranslatedRange(
			node.getRenderedLineRangeFromOffset( offset - nodeOffset - 1 ),
			nodeOffset + 1
		);
	}
	return null;
};

/* Inheritance */

es.extendClass( es.DocumentViewBranchNode, es.DocumentBranchNode );
es.extendClass( es.DocumentViewBranchNode, es.DocumentViewNode );
/**
 * Creates an es.DocumentViewLeafNode object.
 * 
 * @class
 * @abstract
 * @constructor
 * @extends {es.DocumentLeafNode}
 * @extends {es.DocumentViewNode}
 * @param model {es.ModelNode} Model to observe
 * @param {jQuery} [$element] Element to use as a container
 */
es.DocumentViewLeafNode = function( model, $element ) {
	// Inheritance
	es.DocumentLeafNode.call( this );
	es.DocumentViewNode.call( this, model, $element );

	// Properties
	this.$content = $( '<div class="es-contentView"></div>' ).appendTo( this.$ );
	this.contentView = new es.ContentView( this.$content, model );

	// Events
	this.contentView.on( 'update', this.emitUpdate );
};

/* Methods */

/**
 * Render content.
 * 
 * @method
 */
es.DocumentViewLeafNode.prototype.renderContent = function() {
	this.contentView.render();
};

/**
 * Draw selection around a given range.
 * 
 * @method
 * @param {es.Range} range Range of content to draw selection around
 */
es.DocumentViewLeafNode.prototype.drawSelection = function( range ) {
	this.contentView.drawSelection( range );
};

/**
 * Clear selection.
 * 
 * @method
 */
es.DocumentViewLeafNode.prototype.clearSelection = function() {
	this.contentView.clearSelection();
};

/**
 * Gets the nearest offset of a rendered position.
 * 
 * @method
 * @param {es.Position} position Position to get offset for
 * @returns {Integer} Offset of position
 */
es.DocumentViewLeafNode.prototype.getOffsetFromRenderedPosition = function( position ) {
	return this.contentView.getOffsetFromRenderedPosition( position );
};

/**
 * Gets rendered position of offset within content.
 * 
 * @method
 * @param {Integer} offset Offset to get position for
 * @returns {es.Position} Position of offset
 */
es.DocumentViewLeafNode.prototype.getRenderedPositionFromOffset = function( offset, leftBias ) {
	var	position = this.contentView.getRenderedPositionFromOffset( offset, leftBias ),
		contentPosition = this.$content.offset();
	position.top += contentPosition.top;
	position.left += contentPosition.left;
	position.bottom += contentPosition.top;
	return position;
};

es.DocumentViewLeafNode.prototype.getRenderedLineRangeFromOffset = function( offset ) {
	return this.contentView.getRenderedLineRangeFromOffset( offset );
};

/* Inheritance */

es.extendClass( es.DocumentViewLeafNode, es.DocumentLeafNode );
es.extendClass( es.DocumentViewLeafNode, es.DocumentViewNode );
/**
 * Creates an es.Inspector object.
 * 
 * @class
 * @constructor
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 */
es.Inspector = function( toolbar, context ) {
	// Inheritance
	es.EventEmitter.call( this );
	if ( !toolbar || !context ) {
		return;
	}

	// Properties
	this.toolbar = toolbar;
	this.context = context;
	this.$ = $( '<div class="es-inspector"></div>' );
	this.$closeButton = $( '<div class="es-inspector-button es-inspector-closeButton"></div>' )
		.appendTo( this.$ );
	this.$acceptButton = $( '<div class="es-inspector-button es-inspector-acceptButton"></div>' )
		.appendTo( this.$ );
	this.$form = $( '<form></form>' ).appendTo( this.$ );

	// Events
	var _this = this;
	this.$closeButton.click( function() {
		_this.context.closeInspector( false );
	} );
	this.$acceptButton.click( function() {
		if ( !$(this).is( '.es-inspector-button-disabled' ) ) {
			_this.context.closeInspector( true );
		}
	} );
	this.$form.submit( function( e ) {
		_this.context.closeInspector( true );
		e.preventDefault();
		return false;
	} );
	this.$form.keydown( function( e ) {
		// Escape
		if ( e.which === 27 ) {
			_this.context.closeInspector( false );
			e.preventDefault();
			return false;
		}
	} );
};

/* Methods */

es.Inspector.prototype.open = function() {
	this.$.show();
	this.context.closeMenu();
	if ( this.onOpen ) {
		this.onOpen();
	}
	this.emit( 'open' );
};

es.Inspector.prototype.close = function( accept ) {
	this.$.hide();
	if ( this.onClose ) {
		this.onClose( accept );
	}
	this.emit( 'close' );
	try
	{
	    surfaceView.$input.focus();
    }
    catch (e)
    {
        
    }
};

/* Inheritance */

es.extendClass( es.Inspector, es.EventEmitter );
/**
 * Creates an es.Tool object.
 * 
 * @class
 * @constructor
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 */
es.Tool = function( toolbar, name, title ) {
	this.toolbar = toolbar;
	this.name = name;
	this.title = title;
	this.$ = $( '<div class="es-tool"></div>' ).attr( 'title', this.title );
};

/* Static Members */

es.Tool.tools = {};

/* Methods */

es.Tool.prototype.updateState = function() {
	throw 'Tool.updateState not implemented in this subclass:' + this.constructor;
};
/**
 * Creates an es.SurfaceModel object.
 * 
 * @class
 * @constructor
 * @extends {es.EventEmitter}
 * @param {es.DocumentModel} doc Document model to create surface for
 */
es.SurfaceModel = function( doc ) {
	// Inheritance
	es.EventEmitter.call( this );

	// Properties
	this.doc = doc;
	this.selection = null;

	this.smallStack = [];
	this.bigStack = [];
	this.undoIndex = 0;

	var _this = this;
	setInterval( function () {
		_this.breakpoint();
	}, 750 );
};

/* Methods */

es.SurfaceModel.prototype.purgeHistory = function() {
	this.selection = null;
	this.smallStack = [];
	this.bigStack = [];
	this.undoIndex = 0;	
};

es.SurfaceModel.prototype.getHistory = function() {
	if ( this.smallStack.length > 0 ) {
		return this.bigStack.slice(0).concat([{stack:this.smallStack.slice(0)}]); 
	} else {
		return this.bigStack.slice(0);
	}
};

/**
 * Gets the document model of the surface.
 * 
 * @method
 * @returns {es.DocumentModel} Document model of the surface
 */
es.SurfaceModel.prototype.getDocument = function() {
	return this.doc;
};

/**
 * Gets the selection 
 * 
 * @method
 * @returns {es.Range} Current selection
 */
es.SurfaceModel.prototype.getSelection = function() {
	return this.selection;
};

/**
 * Changes the selection.
 * 
 * If changing the selection at a high frequency (such as while dragging) use the combine argument
 * to avoid them being split up into multiple history items
 * 
 * @method
 * @param {es.Range} selection
 * @param {Boolean} isManual Whether this selection was the result of a user action, and thus should be recorded in history...?
 */
es.SurfaceModel.prototype.select = function( selection, isManual ) {
	selection.normalize();
	/*if (
		( ! this.selection ) || ( ! this.selection.equals( selection ) )
	) {*/
		if ( isManual ) {
			this.breakpoint();
		}
		// check if the last thing is a selection, if so, swap it.
		this.selection = selection;	
		this.emit( 'select', this.selection.clone() );
	//}
};

/**
 * Applies a series of transactions to the content data.
 * 
 * If committing multiple transactions which are the result of a single user action and need to be
 * part of a single history item, use the isPartial argument for all but the last one to avoid them being
 * split up into multple history items.
 * 
 * @method
 * @param {es.TransactionModel} transactions Tranasction to apply to the document
 * @param {boolean} isPartial whether this transaction is part of a larger logical grouping of transactions 
 *					(such as when replacing - delete, then insert)
 */
es.SurfaceModel.prototype.transact = function( transaction ) {
	this.bigStack = this.bigStack.slice( 0, this.bigStack.length - this.undoIndex );
	this.undoIndex = 0;
	this.smallStack.push( transaction );
	this.doc.commit( transaction );
	this.emit( 'transact', transaction );
};

es.SurfaceModel.prototype.breakpoint = function( selection ) {
	if( this.smallStack.length > 0 ) {
		this.bigStack.push( {
			stack: this.smallStack,
			selection: selection || this.selection.clone()
		} );
		this.smallStack = [];
	}};

es.SurfaceModel.prototype.undo = function() {
	this.breakpoint();
	this.undoIndex++
	if ( this.bigStack[this.bigStack.length - this.undoIndex] ) {
		var diff = 0;
		var item = this.bigStack[this.bigStack.length - this.undoIndex];
		for( var i = item.stack.length - 1; i >= 0; i-- ) {
			this.doc.rollback( item.stack[i] );
			diff += item.stack[i].lengthDifference;
		}
		var selection = item.selection;
		selection.from -= diff;
		selection.to -= diff;
		this.select( selection );
	}
};

es.SurfaceModel.prototype.redo = function() {
	this.breakpoint();
	if ( this.undoIndex > 0 ) {
		if ( this.bigStack[this.bigStack.length - this.undoIndex] ) {
			var diff = 0;
			var item = this.bigStack[this.bigStack.length - this.undoIndex];
			for( var i = 0; i < item.stack.length; i++ ) {
				this.doc.commit( item.stack[i] );
				diff += item.stack[i].lengthDifference;
			}
			var selection = item.selection;
			selection.from += diff;
			selection.to += diff;
			this.selection = null;
			this.select( selection );
		}
		this.undoIndex--;
	}
};

/* Inheritance */

es.extendClass( es.SurfaceModel, es.EventEmitter );
/**
 * Creates an es.DocumentModel object.
 * 
 * es.DocumentModel objects extend the native Array object, so it's contents are directly accessible
 * through the typical methods.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelBranchNode}
 * @param {Array} data Model data to initialize with, such as data from es.DocumentModel.getData()
 * @param {Object} attributes Document attributes
 */
es.DocumentModel = function( data, attributes ) {
	// Inheritance
	es.DocumentModelBranchNode.call( this, 'document', null );

	// Properties
	this.data = es.isArray( data ) ? data : [];
	this.attributes = es.isPlainObject( attributes ) ? attributes : {};

	// Auto-generate model tree
	var nodes = es.DocumentModel.createNodesFromData( this.data );
	for ( var i = 0; i < nodes.length; i++ ) {
		this.push( nodes[i] );
	}
};

/* Static Members */

/**
 * Mapping of symbolic names and node model constructors.
 */
es.DocumentModel.nodeModels = {};

/**
 * Mapping of symbolic names and nesting rules.
 * 
 * Each rule is an object with the follwing properties:
 *     parents and children properties may contain one of two possible values:
 *         {Array} List symbolic names of allowed element types (if empty, none will be allowed)
 *         {Null} Any element type is allowed (as long as the other element also allows it)
 * 
 * @example Paragraph rules
 *     {
 *         'parents': null,
 *         'children': []
 *     }
 * @example List rules
 *     {
 *         'parents': null,
 *         'children': ['listItem']
 *     }
 * @example ListItem rules
 *     {
 *         'parents': ['list'],
 *         'children': null
 *     }
 * @example TableCell rules
 *     {
 *         'parents': ['tableRow'],
 *         'children': null
 *     }
 */
es.DocumentModel.nodeRules = {
	'document': {
		'parents': null,
		'children': null
	}
};

/* Static Methods */

/*
 * Create child nodes from an array of data.
 * 
 * These child nodes are used for the model tree, which is a space partitioning data structure in
 * which each node contains the length of itself (1 for opening, 1 for closing) and the lengths of
 * it's child nodes.
 */
es.DocumentModel.createNodesFromData = function( data ) {
	var currentNode = new es.DocumentModelBranchNode();
	for ( var i = 0, length = data.length; i < length; i++ ) {
		if ( data[i].type !== undefined ) {
			// It's an element, figure out it's type
			var element = data[i],
				type = element.type,
				open = type.charAt( 0 ) !== '/';
			// Trim the "/" off the beginning of closing tag types
			if ( !open ) {
				type = type.substr( 1 );
			}
			if ( open ) {
				// Validate the element type
				if ( !( type in es.DocumentModel.nodeModels ) ) {
					throw 'Unsuported element error. No class registered for element type: ' + type;
				}
				// Create a model node for the element
				var newNode = new es.DocumentModel.nodeModels[element.type]( element, 0 );
				// Add the new model node as a child
				currentNode.push( newNode );
				// Descend into the new model node
				currentNode = newNode;
			} else {
				// Return to the parent node
				currentNode = currentNode.getParent();
			}
		} else {
			// It's content, let's start tracking the length
			var start = i;
			// Move forward to the next object, tracking the length as we go
			while ( data[i].type === undefined && i < length ) {
				i++;
			}
			// Now we know how long the current node is
			currentNode.setContentLength( i - start );
			// The while loop left us 1 element to far
			i--;
		}
	}
	return currentNode.getChildren().slice( 0 );
};

/**
 * Creates a document model from a plain object.
 * 
 * @static
 * @method
 * @param {Object} obj Object to create new document model from
 * @returns {es.DocumentModel} Document model created from obj
 */
es.DocumentModel.newFromPlainObject = function( obj ) {
	if ( obj.type === 'document' ) {
		var data = [],
			attributes = es.isPlainObject( obj.attributes ) ? es.copyObject( obj.attributes ) : {};
		for ( var i = 0; i < obj.children.length; i++ ) {
			data = data.concat( es.DocumentModel.flattenPlainObjectElementNode( obj.children[i] ) );
		}
		return new es.DocumentModel( data, attributes );
	}
	throw 'Invalid object error. Object is not a valid document object.';
};

/**
 * Generates a hash of an annotation object based on it's name and data.
 * 
 * @static
 * @method
 * @param {Object} annotation Annotation object to generate hash for
 * @returns {String} Hash of annotation
 */
es.DocumentModel.getHash = ( window.JSON && typeof JSON.stringify === 'function' ) ?
	JSON.stringify : es.JsonSerializer.stringify;

/**
 * Gets the index of the first instance of a given annotation.
 * 
 * This method differs from es.inArray because it compares hashes instead of references.
 * 
 * @static
 * @method
 * @param {Array} annotations Annotations to search through
 * @param {Object} annotation Annotation to search for
 * @param {Boolean} typeOnly Whether to only consider the type
 * @returns {Integer} Index of annotation in annotations, or -1 if annotation was not found
 */
es.DocumentModel.getIndexOfAnnotation = function( annotations, annotation, typeOnly ) {
	if ( annotation === undefined || annotation.type === undefined ) {
		throw 'Invalid annotation error. Can not find non-annotation data in character.';
	}
	if ( es.isArray( annotations ) ) {
		// Find the index of a comparable annotation (checking for same value, not reference)
		for ( var i = 0; i < annotations.length; i++ ) {
			// Skip over character data - used when this is called on a content data item
			if ( typeof annotations[i] === 'string' ) {
				continue;
			}
			if (
				(
					typeOnly && 
					annotations[i].type === annotation.type
				) ||
				(
					!typeOnly &&
					annotations[i].hash === (
						annotation.hash || es.DocumentModel.getHash( annotation )
					)
				)
			) {
				return i;
			}
		}
	}
	return -1;
};

/**
 * Gets a list of indexes of annotations that match a regular expression.
 * 
 * @static
 * @method
 * @param {Array} annotations Annotations to search through
 * @param {RegExp} pattern Regular expression pattern to match with
 * @returns {Integer[]} List of indexes in annotations that match
 */
es.DocumentModel.getMatchingAnnotations = function( annotations, pattern ) {
	if ( !( pattern instanceof RegExp ) ) {
		throw 'Invalid annotation error. Can not find non-annotation data in character.';
	}
	var matches = [];
	if ( es.isArray( annotations ) ) {
		// Find the index of a comparable annotation (checking for same value, not reference)
		for ( var i = 0; i < annotations.length; i++ ) {
			// Skip over character data - used when this is called on a content data item
			if ( typeof annotations[i] === 'string' ) {
				continue;
			}
			if ( pattern.test( annotations[i].type ) ) {
				matches.push( annotations[i] );
			}
		}
	}
	return matches;
};

/**
 * Sorts annotations of a character.
 * 
 * This method modifies data in place. The string portion of the annotation character will always
 * remain at the beginning.
 * 
 * @static
 * @method
 * @param {Array} character Annotated character to be sorted
 */
es.DocumentModel.sortCharacterAnnotations = function( character ) {
	if ( !es.isArray( character ) ) {
		return;
	}
	character.sort( function( a, b ) {
		var aHash = a.hash || es.DocumentModel.getHash( a ),
			bHash = b.hash || es.DocumentModel.getHash( b );
		return typeof a === 'string' ? -1 :
			( typeof b === 'string' ? 1 : ( aHash == bHash ? 0 : ( aHash < bHash ? -1 : 1 ) ) );
	} );
};

/**
 * Adds annotation hashes to content data.
 * 
 * This method modifies data in place.
 * 
 * @method
 * @param {Array} data Data to add annotation hashes to
 */
es.DocumentModel.addAnnotationHashesToData = function( data ) {
	for ( var i = 0; i < data.length; i++ ) {
		if ( es.isArray( data[i] ) ) {
			for ( var j = 1; j < data.length; j++ ) {
				if ( data[i][j].hash === undefined ) {
					data[i][j].hash = es.DocumentModel.getHash( data[i][j] );
				}
			}
		}
	}
};

/**
 * Applies annotations to content data.
 * 
 * This method modifies data in place.
 * 
 * @method
 * @param {Array} data Data to remove annotations from
 * @param {Array} annotations Annotations to apply
 */
es.DocumentModel.addAnnotationsToData = function( data, annotations ) {
	if ( annotations && annotations.length ) {
		for ( var i = 0; i < data.length; i++ ) {
			if ( es.isArray( data[i] ) ) {
				data[i] = [data[i]];
			}
			data[i] = [data[i]].concat( annotations );
		}
	}
};

/**
 * Removes annotations from content data.
 * 
 * This method modifies data in place.
 * 
 * @method
 * @param {Array} data Data to remove annotations from
 * @param {Array} [annotations] Annotations to remove (all will be removed if undefined)
 */
es.DocumentModel.removeAnnotationsFromData = function( data, annotations ) {
	for ( var i = 0; i < data.length; i++ ) {
		if ( es.isArray( data[i] ) ) {
			data[i] = data[i][0];
		}
	}
};

/**
 * Creates an es.ContentModel object from a plain content object.
 * 
 * A plain content object contains plain text and a series of annotations to be applied to ranges of
 * the text.
 * 
 * @example
 * {
 *     'text': '1234',
 *     'annotations': [
 *         // Makes "23" bold
 *         {
 *             'type': 'bold',
 *             'range': {
 *                 'start': 1,
 *                 'end': 3
 *             }
 *         }
 *     ]
 * }
 * 
 * @static
 * @method
 * @param {Object} obj Plain content object, containing a "text" property and optionally
 * an "annotations" property, the latter of which being an array of annotation objects including
 * range information
 * @returns {Array}
 */
es.DocumentModel.flattenPlainObjectContentNode = function( obj ) {
	if ( !es.isPlainObject( obj ) ) {
		// Use empty content
		return [];
	} else {
		// Convert string to array of characters
		var data = obj.text.split('');
		// Render annotations
		if ( es.isArray( obj.annotations ) ) {
			for ( var i = 0, length = obj.annotations.length; i < length; i++ ) {
				var src = obj.annotations[i];
				// Build simplified annotation object
				var dst = { 'type': src.type };
				if ( 'data' in src ) {
					dst.data = es.copyObject( src.data );
				}
				// Add a hash to the annotation for faster comparison
				dst.hash = es.DocumentModel.getHash( dst );
				// Apply annotation to range
				if ( src.range.start < 0 ) {
					// TODO: The start can not be lower than 0! Throw error?
					// Clamp start value
					src.range.start = 0;
				}
				if ( src.range.end > data.length ) {
					// TODO: The end can not be higher than the length! Throw error?
					// Clamp end value
					src.range.end = data.length;
				}
				for ( var j = src.range.start; j < src.range.end; j++ ) {
					// Auto-convert to array
					if ( typeof data[j] === 'string' ) {
						data[j] = [data[j]];
					}
					// Append 
					data[j].push( dst );
				}
			}
		}
		return data;
	}
};

/**
 * Flatten a plain node object into a data array, recursively.
 * 
 * TODO: where do we document this whole structure - aka "WikiDom"?
 * 
 * @static
 * @method
 * @param {Object} obj Plain node object to flatten
 * @returns {Array} Flattened version of obj
 */
es.DocumentModel.flattenPlainObjectElementNode = function( obj ) {
	var i,
		data = [],
		element = { 'type': obj.type };
	if ( es.isPlainObject( obj.attributes ) ) {
		element.attributes = es.copyObject( obj.attributes );
	}
	// Open element
	data.push( element );
	if ( es.isPlainObject( obj.content ) ) {
		// Add content
		data = data.concat( es.DocumentModel.flattenPlainObjectContentNode( obj.content ) );
	} else if ( es.isArray( obj.children ) ) {
		// Add children - only do this if there is no content property
		for ( i = 0; i < obj.children.length; i++ ) {
			// TODO: Figure out if all this concatenating is inefficient. I think it is
			data = data.concat( es.DocumentModel.flattenPlainObjectElementNode( obj.children[i] ) );
		}
	}
	// Close element - TODO: Do we need attributes here or not?
	data.push( { 'type': '/' + obj.type } );
	return data;
};

/**
 * Get a plain object representation of content data.
 * 
 * @method
 * @returns {Object} Plain object representation
 */
es.DocumentModel.getExpandedContentData = function( data ) {
	var stack = [];
	// Text and annotations
	function start( offset, annotation ) {
		// Make a new verion of the annotation object and push it to the stack
		var obj = {
			'type': annotation.type,
			'range': { 'start': offset }
		};
		if ( annotation.data ) {
			obj.data = es.copyObject( annotation.data );
		}
		stack.push( obj );
	}
	function end( offset, annotation ) {
		for ( var i = stack.length - 1; i >= 0; i-- ) {
			if ( !stack[i].range.end ) {
				if ( annotation ) {
					// We would just compare hashes, but the stack doesn't contain any
					if ( stack[i].type === annotation.type &&
							es.compareObjects( stack[i].data, annotation.data ) ) {
						stack[i].range.end = offset;
						break;
					}
				} else {
					stack[i].range.end = offset;
				}
			}
		}
	}
	var left = '',
		right,
		leftPlain,
		rightPlain,
		obj = { 'text': '' },
		offset = 0,
		i,
		j;
	for ( i = 0; i < data.length; i++ ) {
		right = data[i];
		leftPlain = typeof left === 'string';
		rightPlain = typeof right === 'string';
		// Open or close annotations
		if ( !leftPlain && rightPlain ) {
			// [formatted][plain] pair, close any annotations for left
			end( i - offset );
		} else if ( leftPlain && !rightPlain ) {
			// [plain][formatted] pair, open any annotations for right
			for ( j = 1; j < right.length; j++ ) {
				start( i - offset, right[j] );
			}
		} else if ( !leftPlain && !rightPlain ) {
			// [formatted][formatted] pair, open/close any differences
			for ( j = 1; j < left.length; j++ ) {
				if ( es.DocumentModel.getIndexOfAnnotation( data[i] , left[j], true ) === -1 ) {
					end( i - offset, left[j] );
				}
			}
			for ( j = 1; j < right.length; j++ ) {
				if ( es.DocumentModel.getIndexOfAnnotation( data[i - 1], right[j], true ) === -1 ) {
					start( i - offset, right[j] );
				}
			}
		}
		obj.text += rightPlain ? right : right[0];
		left = right;		
	}
	if ( data.length ) {
		end( i - offset );
	}
	if ( stack.length ) {
		obj.annotations = stack;
	}
	// Copy attributes if there are any set
	if ( !es.isEmptyObject( this.attributes ) ) {
		obj.attributes = es.extendObject( true, {}, this.attributes );
	}
	return obj;
};

/**
 * Checks if a data at a given offset is content.
 * 
 * @example Content data:
 *      <paragraph> a b c </paragraph> <list> <listItem> d e f </listItem> </list>
 *                 ^ ^ ^                                ^ ^ ^
 * 
 * @static
 * @method
 * @param {Array} data Data to evaluate offset within
 * @param {Integer} offset Offset in data to check
 * @returns {Boolean} If data at offset is content
 */
es.DocumentModel.isContentData = function( data, offset ) {
	// Shortcut: if there's already content there, we will trust it's supposed to be there
	return typeof data[offset] === 'string' || es.isArray( data[offset] );
};

/**
 * Checks if a data at a given offset is an element.
 * 
 * @example Element data:
 *      <paragraph> a b c </paragraph> <list> <listItem> d e f </listItem> </list>
 *     ^                 ^            ^      ^                ^           ^
 * 
 * @static
 * @method
 * @param {Array} data Data to evaluate offset within
 * @param {Integer} offset Offset in data to check
 * @returns {Boolean} If data at offset is an element
 */
es.DocumentModel.isElementData = function( data, offset ) {
	// TODO: Is there a safer way to check if it's a plain object without sacrificing speed?
	return offset >= 0 && offset < data.length && data[offset].type !== undefined;
};

/**
 * Checks if an offset within given data is structural.
 * 
 * Structural offsets are those at the beginning, end or surrounded by elements. This differs
 * from a location at which an element is present in that elements can be safely inserted at a
 * structural location, but not nessecarily where an element is present.
 * 
 * @example Structural offsets:
 *      <paragraph> a b c </paragraph> <list> <listItem> d e f </listItem> </list>
 *     ^                              ^      ^                            ^       ^
 * 
 * @static
 * @method
 * @param {Array} data Data to evaluate offset within
 * @param {Integer} offset Offset to check
 * @returns {Boolean} Whether offset is structural or not
 */
es.DocumentModel.isStructuralOffset = function( data, offset ) {
	// Edges are always structural
	if ( offset === 0 || offset === data.length ) {
		return true;
	}
	// Structual offsets will have elements on each side
	if ( data[offset - 1].type !== undefined && data[offset].type !== undefined ) {
		if ( '/' + data[offset - 1].type === data[offset].type ) {
			return false;
		}
		return true;
	}
	return false;
};

/**
 * Checks if elements are present within data.
 * 
 * @static
 * @method
 * @param {Array} data Data to look for elements within
 * @returns {Boolean} If elements exist in data
 */
es.DocumentModel.containsElementData = function( data ) {
	for ( var i = 0, length = data.length; i < length; i++ ) {
		if ( data[i].type !== undefined ) {
			return true;
		}
	}
	return false;
};

/* Methods */

/**
 * Creates a document view for this model.
 * 
 * @method
 * @returns {es.DocumentView}
 */
es.DocumentModel.prototype.createView = function() {
	return new es.DocumentView( this );
};

/**
 * Gets copy of the document data.
 * 
 * @method
 * @param {es.Range} [range] Range of data to get, all data will be given by default
 * @param {Boolean} [deep=false] Whether to return a deep copy (WARNING! This may be very slow)
 * @returns {Array} Copy of document data
 */
es.DocumentModel.prototype.getData = function( range, deep ) {
	var start = 0,
		end;
	if ( range !== undefined ) {
		range.normalize();
		start = Math.max( 0, Math.min( this.data.length, range.start ) );
		end = Math.max( 0, Math.min( this.data.length, range.end ) );
	}
	// Work around IE bug: arr.slice( 0, undefined ) returns [] while arr.slice( 0 ) behaves
	// correctly
	var data = end === undefined ? this.data.slice( start ) : this.data.slice( start, end );
	return deep ? es.copyArray( data ) : data;
};

/**
 * Gets the element object of a node.
 * 
 * @method
 * @param {es.DocumentModelNode} node Node to get element object for
 * @returns {Object|null} Element object
 */
es.DocumentModel.prototype.getElementFromNode = function( node ) {
	var offset = this.getOffsetFromNode( node );
	if ( offset !== false ) {
		return this.data[offset];
	}
	return null;
};

/**
 * Gets the element data of a node.
 * 
 * @method
 * @param {es.DocumentModelNode} node Node to get element data for
 */
es.DocumentModel.prototype.getElementDataFromNode = function( node ) {
	var length = node.getElementLength();
	var offset = this.getOffsetFromNode( node );
	if ( offset !== -1 ) {
		return this.data.slice( offset, offset + length );
	}
	return null;
};

/**
 * Gets the content data of a node.
 * 
 * @method
 * @param {es.DocumentModelNode} node Node to get content data for
 * @returns {Array|null} List of content and elements inside node or null if node is not found
 */
es.DocumentModel.prototype.getContentDataFromNode = function( node, range ) {
	var length = node.getContentLength();
	if ( range ) {
		range.normalize();
		if ( range.start < 0 ) {
			throw 'Invalid range error. Range can not start before node start: ' + range.start;
		}
		if ( range.end > length ) {
			throw 'Invalid range error. Range can not end after node end: ' + range.end;
		}
	} else {
		range = {
			'start': 0,
			'end': length
		};
	}
	var offset = this.getOffsetFromNode( node );
	if ( offset !== -1 ) {
		if ( node.type !== 'document' ) {
			offset++;
		}
		return this.data.slice( offset + range.start, offset + range.end );
	}
	return null;
};

/**
 * Gets the range of content surrounding a given offset that's covered by a given annotation.
 * 
 * @method
 * @param {Integer} offset Offset to begin looking forward and backward from
 * @param {Object} annotation Annotation to test for coverage with
 * @returns {es.Range|null} Range of content covered by annotation, or null if offset is not covered
 */
es.DocumentModel.prototype.getAnnotationBoundaries = function( offset, annotation, typeOnly ) {
	if ( annotation.hash === undefined ) {
		annotation.hash = es.DocumentModel.getHash( annotation );
	}
	if ( es.DocumentModel.getIndexOfAnnotation( this.data[offset], annotation, typeOnly ) === -1 ) {
		return null;
	}
	var start = offset,
		end = offset,
		item;
	while ( start > 0 ) {
		start--;
		if ( es.DocumentModel.getIndexOfAnnotation( this.data[start], annotation, typeOnly ) === -1 ) {
			start++;
			break;
		}
	}
	while ( end < this.data.length ) {
		if ( es.DocumentModel.getIndexOfAnnotation( this.data[end], annotation, typeOnly ) === -1 ) {
			break;
		}
		end++;
	}
	return new es.Range( start, end );
};

/**
 * Gets a list of annotations that a given offset is covered by.
 * 
 * @method
 * @param {Integer} offset Offset to get annotations for
 * @returns {Object[]} A copy of all annotation objects offset is covered by
 */
es.DocumentModel.prototype.getAnnotationsFromOffset = function( offset ) {
	if ( es.isArray( this.data[offset] ) ) {
		return es.copyArray( this.data[offset].slice( 1 ) );
	}
	return [];
};

/**
 * Gets a list of annotations that a given range is covered by.
 * 
 * @method
 * @param {es.Range} range Range to get annotations for
 * @returns {Object[]} A copy of all annotation objects offset is covered by
 */
es.DocumentModel.prototype.getAnnotationsFromRange = function( range ) {
	range.normalize();
	var annotations = {
			'full': [],
			'partial': [],
			'all': []
		},
		map = {},
		elementsCount = 0;
	for ( var i = range.start; i < range.end; i++ ) {
		if ( es.DocumentModel.isElementData( this.data, i ) ) {
			elementsCount++;
			continue;
		}
		for ( var j = 1; j < this.data[i].length; j++ ) {
			hash = this.data[i][j].hash;
			if ( hash in map ) {
				map[hash][1]++;
			} else {
				map[hash] = [this.data[i][j], 1];
			}
		}
	}
	var length = range.getLength();
	for ( var hash in map ) {
		if ( map[hash][1] === length - elementsCount ) {
			annotations.full.push( map[hash][0] );
		} else {
			annotations.partial.push( map[hash][0] );
		}
		annotations.all.push( map[hash][0] );
	}
	return annotations;
};

/**
 * Gets the range of content surrounding a given offset that makes up a whole word.
 * 
 * @method
 * @param {Integer} offset Offset to begin looking forward and backward from
 * @returns {es.Range|null} Range of content making up a whole word or null if offset is not content
 */
es.DocumentModel.prototype.getWordBoundaries = function( offset ) {
	if ( es.DocumentModel.isStructuralOffset( this.data, offset ) ||
		es.DocumentModel.isElementData( this.data, offset ) ) {
		return null;
	}

	var	offsetItem = typeof this.data[offset] === 'string' ?
			this.data[offset] : this.data[offset][0],
		regex = offsetItem.match( /\B/ ) ? /\b/ : /\B/,
		start = offset,
		end = offset,
		item;
	while ( start > 0 ) {
		start--;
		if ( typeof this.data[start] !== 'string' && !es.isArray( this.data[start] ) ) {
			start++;
			break;
		}
		item = typeof this.data[start] === 'string' ? this.data[start] : this.data[start][0];
		if ( item.match( regex ) ) {
			start++;
			break;
		}
	}
	while ( end < this.data.length ) {
		if ( typeof this.data[end] !== 'string' && !es.isArray( this.data[end] ) ) {
			break;
		}
		item = typeof this.data[end] === 'string' ? this.data[end] : this.data[end][0];
		if ( item.match( regex ) ) {
			break;
		}
		end++;
	}
	return new es.Range( start, end );
};

/**
 * Gets a content offset a given distance forwards or backwards from another.
 * 
 * @method
 * @param {Integer} offset Offset to start from
 * @param {Integer} distance Number of content offsets to move
 * @param {Integer} Offset a given distance from the given offset
 */
es.DocumentModel.prototype.getRelativeContentOffset = function( offset, distance ) {
	if ( distance === 0 ) {
		return offset;
	}
	var direction = distance > 0 ? 1 : -1,
		i = offset + direction,
		steps = 0;
	distance = Math.abs( distance );
	while ( i > 0 && i < this.data.length ) {
		if ( !es.DocumentModel.isStructuralOffset( this.data, i ) ) {
			steps++;
			offset = i;
			if ( distance === steps ) {
				return offset;
			}
		}
		i += direction;
	}
	return offset;
};

/**
 * Generates a transaction which inserts data at a given offset.
 * 
 * @method
 * @param {Integer} offset
 * @param {Array} data
 * @returns {es.TransactionModel}
 */
es.DocumentModel.prototype.prepareInsertion = function( offset, data ) {
	/**
	 * Balances mismatched openings/closings in data
	 * @return data itself if nothing was changed, or a clone of data with balancing changes made.
	 * data itself is never touched
	 */
	function balance( data ) {
		var i, stack = [], element, workingData = null;
		
		for ( i = 0; i < data.length; i++ ) {
			if ( data[i].type === undefined ) {
				// Not an opening or a closing, skip
			} else if ( data[i].type.charAt( 0 ) != '/' ) {
				// Opening
				stack.push( data[i].type );
			} else {
				// Closing
				if ( stack.length === 0 ) {
					// The stack is empty, so this is an unopened closing
					// Remove it
					if ( workingData === null ) {
						workingData = data.slice( 0 );
					}
					workingData.splice( i, 1 );
				} else {
					element = stack.pop();
					if ( element != data[i].type.substr( 1 ) ) {
						// Closing doesn't match what's expected
						// This means the input is malformed and cannot possibly
						// have been a fragment taken from well-formed data
						throw 'Input is malformed: expected /' + element + ' but got ' +
							data[i].type + ' at index ' + i;
					}
				}
			}
		}
		
		// Check whether there are any unclosed tags and close them
		if ( stack.length > 0 && workingData === null ) {
			workingData = data.slice( 0 );
		}
		while ( stack.length > 0 ) {
			element = stack.pop();
			workingData.push( { 'type': '/' + element } );
		}
		
		// TODO
		// Check whether there is any raw unenclosed content and deal with that somehow
		
		return workingData || data;
	}
	
	var tx = new es.TransactionModel(),
		insertedData = data, // may be cloned and modified
		isStructuralLoc,
		wrappingElementType;
		
	if ( offset < 0 || offset > this.data.length ) {
		throw 'Offset ' + offset + ' out of bounds [0..' + this.data.length + ']';
	}
	
	// Has to be after the bounds check, because isStructuralOffset doesn't like out-of-bounds
	// offsets
	isStructuralLoc = es.DocumentModel.isStructuralOffset( this.data, offset );
	
	if ( offset > 0 ) {
		tx.pushRetain( offset );
	}
	
	if ( es.DocumentModel.containsElementData( insertedData ) ) {
		if ( insertedData[0].type !== undefined && insertedData[0].type.charAt( 0 ) != '/' ) {
			// insertedData starts with an opening, so this is really intended to insert structure
			// Balance it to make it sane, if it's not already
			// TODO we need an actual validator and check that the insertion is really valid
			insertedData = balance( insertedData );
			if ( !isStructuralLoc ) {
				// We're inserting structure at a content location,
				// so we need to split up the wrapping element
				wrappingElementType = this.getNodeFromOffset( offset ).getElementType();
				var arr = [{ 'type': '/' + wrappingElementType }, { 'type': wrappingElementType }];
				es.insertIntoArray( arr, 1, insertedData );
				insertedData = arr;
			}
			// else we're inserting structure at a structural location, which is fine
		} else {
			// insertedData starts with content but contains structure
			// TODO balance and validate, will be different for this case
		}
	} else {
		if ( isStructuralLoc ) {
			// We're inserting content into a structural location,
			// so we need to wrap the inserted content in a paragraph.
			insertedData = [ { 'type': 'paragraph' }, { 'type': '/paragraph' } ];
			es.insertIntoArray( insertedData, 1, data );
		} else {
			// Content being inserted in content is fine, do nothing
		}
	}
	
	tx.pushInsert( insertedData );
	if ( offset < this.data.length ) {
		tx.pushRetain( this.data.length - offset );
	}
	
	return tx;
	
	/*
	 * // Structural changes
	 * There are 2 basic types of locations the insertion point can be:
	 *     Structural locations
	 *         |<p>a</p><p>b</p> - Beginning of the document
	 *         <p>a</p>|<p>b</p> - Between elements (like in a document or list)
	 *         <p>a</p><p>b</p>| - End of the document
	 *     Content locations
	 *         <p>|a</p><p>b</p> - Inside an element (like in a paragraph or listItem)
	 *         <p>a|</p><p>b</p> - May also be inside an element but right before/after an
	 *                             open/close
	 * 
	 * if ( Incoming data contains structural elements ) {
		   // We're assuming the incoming data is balanced, is that OK?
	 *     if ( Insertion point is a structural location ) {
	 *         if ( Incoming data is not a complete structural element ) {
	 *             Incoming data must be balanced
	 *         }
	 *     } else {
	 *         Closing and opening elements for insertion point must be added to incoming data
	 *     }
	 * } else {
	 *     if ( Insertion point is a structural location ) {
	 *         Incoming data must be balanced   //how? Should this even be allowed?
	 *     } else {
	 *         Content being inserted into content is OK, do nothing
	 *     }
	 * }
	 */
};

/**
 * Generates a transaction which removes data from a given range.
 * 
 * When removing data inside an element, the data is simply discarded and the node's length is
 * adjusted accordingly. When removing data across elements, there are two situations that can cause
 * added complexity:
 *     1. A range spans between nodes of different levels or types
 *     2. A range only partially covers one or two nodes
 * 
 * To resolve these issues in a predictable way the following rules must be obeyed:
 *     1. Structural elements are retained unless the range being removed covers the entire element
 *     2. Elements can only be merged if they are
 *        2a. Same type
 *        2b. Same depth 
 *        2c. Types match at each level up to a common ancestor 
 *     3. Merge takes place at the highest common ancestor
 * 
 * @method
 * @param {es.Range} range
 * @returns {es.TransactionModel}
 */

es.DocumentModel.prototype.prepareRemoval = function( range ) {
	// If a selection is painted across two paragraphs, and then the text is deleted, the two
	// paragraphs can become one paragraph. However, if the selection crosses into a table, those
	// cannot be merged. To make this simple, we follow rule #2 in the comment above for deciding
	// whether two elements can be merged.
	// So you can merge adjacent paragraphs, or list items. And you can't merge a paragraph into
	// a table row. There may be other rules we will want in here later, for instance, special
	// casing merging a listitem into a paragraph.
	function canMerge( node1, node2 ) {
		var result = es.DocumentNode.getCommonAncestorPaths( node1, node2 );
		if ( !result ) {
			return false;
		}
		
		// Check that corresponding nodes in the paths have the same type
		for ( var i = 0; i < result.node1Path.length; i++ ) {
			if ( result.node1Path[i].getElementType() !== result.node2Path[i].getElementType() ) {
				return false;
			}
		}
		
		return true;
	}
	
	var tx = new es.TransactionModel(), selectedNodes, selectedNode, startNode, endNode, i;
	range.normalize();
	if ( range.start === range.end ) {
		// Empty range, nothing to do
		// Retain up to the end of the document. Why do we do this? Because Trevor said so!
		tx.pushRetain( this.data.length );
		return tx;
	}
	
	selectedNodes = this.selectNodes( range );
	startNode = selectedNodes[0].node;
	endNode = selectedNodes[selectedNodes.length - 1].node;
	
	if ( startNode && endNode && canMerge( startNode, endNode ) ) {
		// This is the simple case. node1 and node2 are either the same node, or can be merged
		// So we can just remove all the data in the range and call it a day, no fancy
		// processing necessary
		
		// Retain to the start of the range
		if ( range.start > 0 ) {
			tx.pushRetain( range.start );
		}
		// Remove all data in a given range.
		tx.pushRemove( this.data.slice( range.start, range.end ) );
		// Retain up to the end of the document. Why do we do this? Because Trevor said so!
		if ( range.end < this.data.length ) {
			tx.pushRetain( this.data.length - range.end );
		}
	} else {
		var index = 0;
		for ( i = 0; i < selectedNodes.length; i++ ) {
			selectedNode = selectedNodes[i];
			// Retain up to where the next removal starts
			if ( selectedNode.globalRange.start > index ) {
				tx.pushRetain( selectedNode.globalRange.start - index );
			}
			
			// Remove stuff
			if ( selectedNode.globalRange.getLength() ) {
				tx.pushRemove(
					this.data.slice(
						selectedNode.globalRange.start,
						selectedNode.globalRange.end
					)
				);
			}
			index = selectedNode.globalRange.end;
		}
		
		// Retain up to the end of the document. Why do we do this? Because Trevor said so!
		if ( index < this.data.length ) {
			tx.pushRetain( this.data.length - index );
		}
	}
	
	return tx;
};

/**
 * Generates a transaction which annotates content within a given range.
 * 
 * @method
 * @returns {es.TransactionModel}
 */
es.DocumentModel.prototype.prepareContentAnnotation = function( range, method, annotation ) {
	if ( annotation instanceof RegExp && method !== 'clear' ) {
		throw 'Invalid annotation error. RegExp patterns can only be used with the clear method.';
	}
	var tx = new es.TransactionModel();
	range.normalize();
	if ( annotation.hash === undefined ) {
		annotation.hash = es.DocumentModel.getHash( annotation );
	}
	var i = range.start,
		span = i,
		on = false;
	while ( i < range.end ) {
		if ( this.data[i].type !== undefined ) {
			// Don't annotate structural elements
			if ( on ) {
				if ( span ) {
					tx.pushRetain( span );
				}
				tx.pushStopAnnotating( method, annotation );
				span = 0;
				on = false;
			}
		} else {
			var covered;
			if ( annotation instanceof RegExp ) {
				covered =
					!!es.DocumentModel.getMatchingAnnotations( this.data[i], annotation ).length;
			} else {
				covered = es.DocumentModel.getIndexOfAnnotation( this.data[i], annotation ) !== -1;
			}
			if ( ( covered && method === 'set' ) || ( !covered  && method === 'clear' ) ) {
				// Don't set/clear annotations on content that's already set/cleared
				if ( on ) {
					if ( span ) {
						tx.pushRetain( span );
					}
					tx.pushStopAnnotating( method, annotation );
					span = 0;
					on = false;
				}
			} else {
				// Content
				if ( !on ) {
					if ( span ) {
						tx.pushRetain( span );
					}
					tx.pushStartAnnotating( method, annotation );
					span = 0;
					on = true;
				}
			}
		}
		span++;
		i++;
	}
	if ( span ) {
		tx.pushRetain( span );
	}
	if ( on ) {
		tx.pushStopAnnotating( method, annotation );
	}
	if ( range.end < this.data.length ) {
		tx.pushRetain( this.data.length - range.end );
	}

	return tx;
};

/**
 * Generates a transaction which changes attributes on an element at a given offset.
 * 
 * @method
 * @returns {es.TransactionModel}
 */
es.DocumentModel.prototype.prepareElementAttributeChange = function( offset, method, key, value ) {
	var tx = new es.TransactionModel();
	if ( offset ) {
		tx.pushRetain( offset );
	}
	if ( this.data[offset].type === undefined ) {
		throw 'Invalid element offset error. Can not set attributes to non-element data.';
	}
	if ( this.data[offset].type[0] === '/' ) {
		throw 'Invalid element offset error. Can not set attributes on closing element.';
	}
	tx.pushChangeElementAttribute( method, key, value );
	if ( offset < this.data.length ) {
		tx.pushRetain( this.data.length - offset );
	}
	
	return tx;
};

/**
 * Applies a transaction to the content data.
 * 
 * @method
 * @param {es.TransactionModel}
 */
es.DocumentModel.prototype.commit = function( transaction ) {
	es.TransactionProcessor.commit( this, transaction );
};

/**
 * Reverses a transaction's effects on the content data.
 * 
 * @method
 * @param {es.TransactionModel}
 */
es.DocumentModel.prototype.rollback = function( transaction ) {
	es.TransactionProcessor.rollback( this, transaction );
};

es.DocumentModel.prototype.prepareLeafConversion = function( range, type, attributes ) {
	range.normalize();
	var	startNode = this.getNodeFromOffset( range.start ),
		endNode =  this.getNodeFromOffset( range.end ),
		nodes = [],
		nodeOffset,
		txs = [];

	this.traverseLeafNodes( function( node ) {
		nodes.push( node );
		if( node === endNode ) {
			return false;
		}
	}, startNode );

	// TODO: skip nodes which have the same type and attributes as the target

	for ( var i = 0; i < nodes.length; i++ ) {
		nodeOffset = this.getOffsetFromNode( nodes[i], false );

		txs.push( this.prepareRemoval(
			new es.Range( nodeOffset, nodeOffset + nodes[i].getElementLength() )
		) );
		txs.push( this.prepareInsertion(
			nodeOffset,
			[ { 'type': type, 'attributes': attributes } ]
				.concat( nodes[i].getContentData() )
				.concat( [ { 'type': '/' + type } ] )
		) );
	}

	return txs;
};

/* Inheritance */

es.extendClass( es.DocumentModel, es.DocumentModelBranchNode );
/**
 * Creates an es.ParagraphModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelLeafNode}
 * @param {Object} element Document data element of this node
 * @param {Integer} length Length of document data element
 */
es.ParagraphModel = function( element, length ) {
	// Inheritance
	es.DocumentModelLeafNode.call( this, 'paragraph', element, length );
};

/* Methods */

/**
 * Creates a paragraph view for this model.
 * 
 * @method
 * @returns {es.ParagraphView}
 */
es.ParagraphModel.prototype.createView = function() {
	return new es.ParagraphView( this );
};

/* Registration */

es.DocumentModel.nodeModels.paragraph = es.ParagraphModel;

es.DocumentModel.nodeRules.paragraph = {
	'parents': null,
	'children': []
};

/* Inheritance */

es.extendClass( es.ParagraphModel, es.DocumentModelLeafNode );
/**
 * Creates an es.PreModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelLeafNode}
 * @param {Object} element Document data element of this node
 * @param {Integer} length Length of document data element
 */
es.PreModel = function( element, length ) {
	// Inheritance
	es.DocumentModelLeafNode.call( this, 'pre', element, length );
};

/* Methods */

/**
 * Creates a pre view for this model.
 * 
 * @method
 * @returns {es.PreView}
 */
es.PreModel.prototype.createView = function() {
	return new es.PreView( this );
};

/* Registration */

es.DocumentModel.nodeModels.pre = es.PreModel;

es.DocumentModel.nodeRules.pre = {
	'parents': null,
	'children': []
};

/* Inheritance */

es.extendClass( es.PreModel, es.DocumentModelLeafNode );
/**
 * Creates an es.ListModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelBranchNode}
 * @param {Object} element Document data element of this node
 * @param {es.ListItemModel[]} contents List of child nodes to initially add
 */
es.ListModel = function( element, contents ) {
	// Inheritance
	es.DocumentModelBranchNode.call( this, 'list', element, contents );
};

/* Methods */

/**
 * Creates a list view for this model.
 * 
 * @method
 * @returns {es.ListView}
 */
es.ListModel.prototype.createView = function() {
	return new es.ListView( this );
};

/* Registration */

es.DocumentModel.nodeModels.list = es.ListModel;

es.DocumentModel.nodeRules.list = {
	'parents': null,
	'children': ['listItem']
};

/* Inheritance */

es.extendClass( es.ListModel, es.DocumentModelBranchNode );
/**
 * Creates an es.ListItemModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelLeafNode}
 * @param {Object} element Document data element of this node
 * @param {Integer} length Length of document data element
 */
es.ListItemModel = function( element, contents ) {
	// Inheritance
	es.DocumentModelBranchNode.call( this, 'listItem', element, contents );
};

/* Methods */

/**
 * Creates a list item view for this model.
 * 
 * @method
 * @returns {es.ListItemView}
 */
es.ListItemModel.prototype.createView = function() {
	return new es.ListItemView( this );
};

/* Registration */

es.DocumentModel.nodeModels.listItem = es.ListItemModel;

es.DocumentModel.nodeRules.listItem = {
	'parents': ['list'],
	'children': null
};

/* Inheritance */

es.extendClass( es.ListItemModel, es.DocumentModelBranchNode );
/**
 * Creates an es.TableModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelBranchNode}
 * @param {Object} element Document data element of this node
 * @param {es.TableCellModel[]} contents List of child nodes to initially add
 */
es.TableModel = function( element, contents ) {
	// Inheritance
	es.DocumentModelBranchNode.call( this, 'table', element, contents );
};

/* Methods */

/**
 * Creates a table view for this model.
 * 
 * @method
 * @returns {es.TableView}
 */
es.TableModel.prototype.createView = function() {
	return new es.TableView( this );
};

/* Registration */

es.DocumentModel.nodeModels.table = es.TableModel;

es.DocumentModel.nodeRules.table = {
	'parents': null,
	'children': ['tableRow']
};

/* Inheritance */

es.extendClass( es.TableModel, es.DocumentModelBranchNode );
/**
 * Creates an es.TableRowModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelBranchNode}
 * @param {Object} element Document data element of this node
 * @param {es.DocumentModelNode[]} contents List of child nodes to initially add
 */
es.TableRowModel = function( element, contents ) {
	// Inheritance
	es.DocumentModelBranchNode.call( this, 'tableRow', element, contents );
};

/* Methods */

/**
 * Creates a table row view for this model.
 * 
 * @method
 * @returns {es.TableRowView}
 */
es.TableRowModel.prototype.createView = function() {
	return new es.TableRowView( this );
};

/* Registration */

es.DocumentModel.nodeModels.tableRow = es.TableRowModel;

es.DocumentModel.nodeRules.tableRow = {
	'parents': ['table'],
	'children': ['tableCell']
};

/* Inheritance */

es.extendClass( es.TableRowModel, es.DocumentModelBranchNode );
/**
 * Creates an es.TableCellModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelBranchNode}
 * @param {Object} element Document data element of this node
 * @param {es.DocumentModelNode[]} contents List of child nodes to initially add
 */
es.TableCellModel = function( element, contents ) {
	// Inheritance
	es.DocumentModelBranchNode.call( this, 'tableCell', element, contents );
};

/* Methods */

/**
 * Creates a table cell view for this model.
 * 
 * @method
 * @returns {es.TableCellView}
 */
es.TableCellModel.prototype.createView = function() {
	return new es.TableCellView( this );
};

/* Registration */

es.DocumentModel.nodeModels.tableCell = es.TableCellModel;

es.DocumentModel.nodeRules.tableCell = {
	'parents': ['tableRow'],
	'children': null
};

/* Inheritance */

es.extendClass( es.TableCellModel, es.DocumentModelBranchNode );
/**
 * Creates an es.HeadingModel object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentModelLeafNode}
 * @param {Object} element Document data element of this node
 * @param {Integer} length Length of document data element
 */
es.HeadingModel = function( element, length ) {
	// Inheritance
	es.DocumentModelLeafNode.call( this, 'heading', element, length );
};

/* Methods */

/**
 * Creates a heading view for this model.
 * 
 * @method
 * @returns {es.ParagraphView}
 */
es.HeadingModel.prototype.createView = function() {
	return new es.HeadingView( this );
};

/* Registration */

es.DocumentModel.nodeModels.heading = es.HeadingModel;

es.DocumentModel.nodeRules.heading = {
	'parents': null,
	'children': []
};

/* Inheritance */

es.extendClass( es.HeadingModel, es.DocumentModelLeafNode );
/**
 * Creates an es.TransactionModel object.
 * 
 * @class
 * @constructor
 * @param {Object[]} operations List of operations
 */
es.TransactionModel = function( operations ) {
	this.operations = es.isArray( operations ) ? operations : [];
	this.lengthDifference = 0;
};

/* Methods */

/**
 * Gets a list of all operations.
 * 
 * @method
 * @returns {Object[]} List of operations
 */
es.TransactionModel.prototype.getOperations = function() {
	return this.operations;
};

/**
 * Gets the difference in content length this transaction will cause if applied.
 * 
 * @method
 * @returns {Integer} Difference in content length
 */
es.TransactionModel.prototype.getLengthDifference = function() {
	return this.lengthDifference;
};

/**
 * Adds a retain operation.
 * 
 * @method
 * @param {Integer} length Length of content data to retain
 */
es.TransactionModel.prototype.pushRetain = function( length ) {
	var end = this.operations.length - 1;
	if ( this.operations.length && this.operations[end].type === 'retain' ) {
		this.operations[end].length += length;
	} else {
		this.operations.push( {
			'type': 'retain',
			'length': length
		} );
	}
};

/**
 * Adds an insertion operation.
 * 
 * @method
 * @param {Array} data Data to retain
 */
es.TransactionModel.prototype.pushInsert = function( data ) {
	var end = this.operations.length - 1;
	if ( this.operations.length && this.operations[end].type === 'insert' ) {
		this.operations[end].data = this.operations[end].data.concat( data );
	} else {
		this.operations.push( {
			'type': 'insert',
			'data': data
		} );
	}
	this.lengthDifference += data.length;
};

/**
 * Adds a removal operation.
 * 
 * @method
 * @param {Array} data Data to remove
 */
es.TransactionModel.prototype.pushRemove = function( data ) {
	var end = this.operations.length - 1;
	if ( this.operations.length && this.operations[end].type === 'remove' ) {
		this.operations[end].data = this.operations[end].data.concat( data );
	} else {
		this.operations.push( {
			'type': 'remove',
			'data': data
		} );
	}
	this.lengthDifference -= data.length;
};

/**
 * Adds an element attribute change operation.
 * 
 * @method
 * @param {String} method Method to use, either "set" or "clear"
 * @param {String} key Name of attribute to change
 * @param {Mixed} value Value to set attribute to, or value of attribute being cleared
 */
es.TransactionModel.prototype.pushChangeElementAttribute = function( method, key, value ) {
	this.operations.push( {
		'type': 'attribute',
		'method': method,
		'key': key,
		'value': value
	} );
};

/**
 * Adds a start annotating operation.
 * 
 * @method
 * @param {String} method Method to use, either "set" or "clear"
 * @param {Object} annotation Annotation object to start setting or clearing from content data
 */
es.TransactionModel.prototype.pushStartAnnotating = function( method, annotation ) {
	this.operations.push( {
		'type': 'annotate',
		'method': method,
		'bias': 'start',
		'annotation': annotation
	} );
};

/**
 * Adds a stop annotating operation.
 * 
 * @method
 * @param {String} method Method to use, either "set" or "clear"
 * @param {Object} annotation Annotation object to stop setting or clearing from content data
 */
es.TransactionModel.prototype.pushStopAnnotating = function( method, annotation ) {
	this.operations.push( {
		'type': 'annotate',
		'method': method,
		'bias': 'stop',
		'annotation': annotation
	} );
};
/**
 * Creates an es.LinkInspector object.
 * 
 * @class
 * @constructor
 * @param {es.ToolbarView} toolbar
 */
es.LinkInspector = function( toolbar, context ) {
	// Inheritance
	es.Inspector.call( this, toolbar, context );

	// Properties
	this.$clearButton = $( '<div class="es-inspector-button es-inspector-clearButton"></div>' )
		.prependTo( this.$ );
	this.$.prepend( '<div class="es-inspector-title">Edit link</div>' );
	this.$locationLabel = $( '<label>URL :</label>' ).appendTo( this.$form );
	this.$locationInput = $( '<input type="text">' ).appendTo( this.$form );
	this.initialValue = null;

	// Events
	var _this = this;
	this.$clearButton.click( function() {
		if ( $(this).is( '.es-inspector-button-disabled' ) ) {
			return;
		}
		var surfaceView = _this.context.getSurfaceView(),
			surfaceModel = surfaceView.getModel(),
			tx = surfaceModel.getDocument().prepareContentAnnotation(
				surfaceView.currentSelection,
				'clear',
				/link\/.*/
			);
		surfaceModel.transact( tx );
		_this.$locationInput.val( '' );
		_this.context.closeInspector();
	} );
	this.$locationInput.bind( 'mousedown keydown cut paste', function() {
		setTimeout( function() {
			if ( _this.$locationInput.val() !== _this.initialValue ) {
				_this.$acceptButton.removeClass( 'es-inspector-button-disabled' );
			} else {
				_this.$acceptButton.addClass( 'es-inspector-button-disabled' );
			}
		}, 0 );
	} );
	
	this.$locationInput.bind( 'focus', function() {
	   if (_this.$locationInput.val() === '')
	   {
	       _this.$locationInput.val('http://');
	   }
    });
};

/* Methods */

es.LinkInspector.prototype.getTitleFromSelection = function() {
	var surfaceView = this.context.getSurfaceView(),
		surfaceModel = surfaceView.getModel(),
		documentModel = surfaceModel.getDocument(),
		data = documentModel.getData( surfaceView.currentSelection );
	if ( data.length ) {
		var annotation = es.DocumentModel.getMatchingAnnotations( data[0], /link\/.*/ );
		if ( annotation.length ) {
			annotation = annotation[0];
		}
		if ( annotation && annotation.data && annotation.data.title ) {
			return annotation.data.title;
		}
	}
	return null;
};

es.LinkInspector.prototype.onOpen = function() {
	var title = this.getTitleFromSelection();
	if ( title !== null ) {
		this.$locationInput.val( title );
		this.$clearButton.removeClass( 'es-inspector-button-disabled' );
	} else {
		this.$locationInput.val( '' );
		this.$clearButton.addClass( 'es-inspector-button-disabled' );
	}
	this.$acceptButton.addClass( 'es-inspector-button-disabled' );
	this.initialValue = this.$locationInput.val();
	var _this = this;
	setTimeout( function() {
		_this.$locationInput.focus().select();
	}, 0 );
};

es.LinkInspector.prototype.onClose = function( accept ) {
	if ( accept ) {
		var title = this.$locationInput.val();
		if ( title === this.getTitleFromSelection() || !title ) {
			return;
		}
		var surfaceView = this.context.getSurfaceView(),
			surfaceModel = surfaceView.getModel();
		var clear = surfaceModel.getDocument().prepareContentAnnotation(
			surfaceView.currentSelection,
			'clear',
			/link\/.*/
		);
		surfaceModel.transact( clear );
		var set = surfaceModel.getDocument().prepareContentAnnotation(
			surfaceView.currentSelection,
			'set',
			{ 'type': 'link/internal', 'data': { 'title': title } }
		);
		surfaceModel.transact( set );
	}
};

/* Inheritance */

es.extendClass( es.LinkInspector, es.Inspector );
/**
 * Creates an es.ButtonTool object.
 * 
 * @class
 * @constructor
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 */
es.ButtonTool = function( toolbar, name, title ) {
	// Inheritance
	es.Tool.call( this, toolbar, name, title );
	if ( !name ) {
		return;
	}

	// Properties
	this.$.addClass( 'es-toolbarButtonTool' ).addClass( 'es-toolbarButtonTool-' + name );

	// Events
	var _this = this;
	this.$.bind( {
		'mousedown': function( e ) {
			if ( e.which === 1 ) {
				e.preventDefault();
				return false;
			}
		},
		'mouseup': function ( e ) {
			if ( e.which === 1 ) {
				_this.onClick( e );
			}
		}
	} );
};

/* Methods */

es.ButtonTool.prototype.onClick = function() {
	throw 'ButtonTool.onClick not implemented in this subclass:' + this.constructor;
};

/* Inheritance */

es.extendClass( es.ButtonTool, es.Tool );/**
 * Creates an es.AnnotationButtonTool object.
 * 
 * @class
 * @constructor
 * @extends {es.ButtonTool}
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 * @param {Object} annotation
 */
es.AnnotationButtonTool = function( toolbar, name, title, data ) {
	// Inheritance
	es.ButtonTool.call( this, toolbar, name, title );

	// Properties
	this.annotation = data.annotation;
	this.inspector = data.inspector;
	this.active = false;
};

/* Methods */

es.AnnotationButtonTool.prototype.onClick = function() {
	var surfaceView = this.toolbar.getSurfaceView();
	if ( this.inspector ) {
		if ( surfaceView.getModel().getSelection().getLength() ) {
			this.toolbar.getSurfaceView().getContextView().openInspector( this.inspector );
		} else {
			if ( this.active ) {
				var surfaceModel = surfaceView.getModel(),
					documentModel = surfaceModel.getDocument(),
					selection = surfaceModel.getSelection(),
					range = documentModel.getAnnotationBoundaries( selection.from, this.annotation, true );
				surfaceModel.select( range );
				this.toolbar.getSurfaceView().getContextView().openInspector( this.inspector );
			}
		}
	} else {
		surfaceView.annotate( this.active ? 'clear' : 'set', this.annotation );
	}
};

es.AnnotationButtonTool.prototype.updateState = function( annotations, nodes ) {
	if ( es.DocumentModel.getIndexOfAnnotation( annotations.full, this.annotation, true ) !== -1 ) {
		this.$.addClass( 'es-toolbarButtonTool-down' );
		this.active = true;
		return;
	}
	this.$.removeClass( 'es-toolbarButtonTool-down' );
	this.active = false;
};

/* Registration */

es.Tool.tools.bold = {
	'constructor': es.AnnotationButtonTool,
	'name': 'bold',
	'title': 'Bold (ctrl/cmd + B)',
	'data': {
		'annotation': { 'type': 'textStyle/bold' }
	}
};

es.Tool.tools.italic = {
	'constructor': es.AnnotationButtonTool,
	'name': 'italic',
	'title': 'Italic (ctrl/cmd + I)',
	'data': {
		'annotation': { 'type': 'textStyle/italic' }
	}
};

es.Tool.tools.link = {
	'constructor': es.AnnotationButtonTool,
	'name': 'link',
	'title': 'Link (ctrl/cmd + K)',
	'data': {
		'annotation': { 'type': 'link/internal', 'data': { 'title': '' } },
		'inspector': 'link'
	}
};

es.Tool.tools.strong = {
	'constructor': es.AnnotationButtonTool,
	'name': 'strong',
	'title': 'Strong (ctrl/cmd + B)',
	'data': {
		'annotation': { 'type': 'textStyle/strong' }
	}
};
es.Tool.tools.em = {
	'constructor': es.AnnotationButtonTool,
	'name': 'em',
	'title': 'Emphase (ctrl/cmd + I)',
	'data': {
		'annotation': { 'type': 'textStyle/emphasize' }
	}
};
es.Tool.tools.del = {
	'constructor': es.AnnotationButtonTool,
	'name': 'del',
	'title': 'Del (ctrl/cmd + D)',
	'data': {
		'annotation': { 'type': 'textStyle/delete' }
	}
};

/* Inheritance */

es.extendClass( es.AnnotationButtonTool, es.ButtonTool );
/**
 * Creates an es.ClearButtonTool object.
 * 
 * @class
 * @constructor
 * @extends {es.ButtonTool}
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 */
es.ClearButtonTool = function( toolbar, name, title ) {
	// Inheritance
	es.ButtonTool.call( this, toolbar, name, title );

	// Properties
	this.$.addClass( 'es-toolbarButtonTool-disabled' );
	this.pattern = /(textStyle\/|link\/).*/;
};

/* Methods */

es.ClearButtonTool.prototype.onClick = function() {
	var surfaceView = this.toolbar.getSurfaceView(),
		surfaceModel = surfaceView.getModel(),
		tx =surfaceModel.getDocument().prepareContentAnnotation(
			surfaceView.currentSelection,
			'clear',
			this.pattern
		);
	surfaceModel.transact( tx );
	surfaceView.clearInsertionAnnotations();
	surfaceView.getContextView().closeInspector();
};

es.ClearButtonTool.prototype.updateState = function( annotations ) {
	var matchingAnnotations = es.DocumentModel.getMatchingAnnotations(
		annotations.all, this.pattern
	);
	if ( matchingAnnotations.length === 0 ) {
		this.$.addClass( 'es-toolbarButtonTool-disabled' );
	} else {
		this.$.removeClass( 'es-toolbarButtonTool-disabled' );
	}
};

/* Registration */

es.Tool.tools.clear = {
	'constructor': es.ClearButtonTool,
	'name': 'clear',
	'title': 'Clear formatting'
};

/* Inheritance */

es.extendClass( es.ClearButtonTool, es.ButtonTool );/**
 * Creates an es.HistoryButtonTool object.
 * 
 * @class
 * @constructor
 * @extends {es.ButtonTool}
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 */
es.HistoryButtonTool = function( toolbar, name, title, data ) {
	// Inheritance
	es.ButtonTool.call( this, toolbar, name, title );

	// Properties
	this.data = data;
};

/* Methods */

es.HistoryButtonTool.prototype.onClick = function() {
	switch ( this.name ) {
		case 'undo':
			this.toolbar.surfaceView.model.undo( 1 );
			break;
		case 'redo':
			this.toolbar.surfaceView.model.redo( 1 );
			break;
	}
};

es.HistoryButtonTool.prototype.updateState = function( annotations ) {
	//
};

/* Registration */

es.Tool.tools.undo = {
	'constructor': es.HistoryButtonTool,
	'name': 'undo',
	'title': 'Undo (ctrl/cmd + Z)'
};

es.Tool.tools.redo = {
	'constructor': es.HistoryButtonTool,
	'name': 'redo',
	'title': 'Redo (ctrl/cmd + shift + Z)'
};

/* Inhertiance */

es.extendClass( es.HistoryButtonTool, es.ButtonTool );
/**
 * Creates an es.ListButtonTool object.
 * 
 * @class
 * @constructor
 * @extends {es.ButtonTool}
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 */
 es.ListButtonTool = function( toolbar, name, title, data ) {
	// Inheritance
	es.ButtonTool.call( this, toolbar, name, title );

	// Properties
	this.data = data;
	this.nodes = [];
};

/* Methods */

es.ListButtonTool.prototype.list = function( nodes, style ) {
	var	surface = this.toolbar.surfaceView,
		selection = surface.currentSelection.clone(),
		stack = [],
		stacks = [],
		listItems = [],
		parent,
		styles,
		insertAt,
		removeLength,
		data,
		tx,
		i,
		j;

	for( i = 0; i < nodes.length; i++ ) {
		parent = nodes[i].getParent();
		if ( parent.getElementType() === 'listItem' ) {
			if ( stack.length > 0 ) {
				stacks.push( stack );
				stack = [];
			}
			listItems.push( parent );
		} else {
			if( stack.length > 0 ) {
				if ( parent === stack[stack.length - 1].getParent() ) {
					stack.push( nodes[i] );
				} else {
					stacks.push( stack );
					stack = [ nodes[i] ];
				}
			} else {
				stack.push( nodes[i] );
			}
		}
	}
	if( stack.length > 0 ) {
		stacks.push( stack );
	}

	if ( stacks.length > 0 ) {
		if ( selection.from === selection.to ) {
			selection.from += 2;
			selection.to += 2;
		} else {
			if ( nodes[0].getParent().getElementType() != 'listItem' ) {
				if ( selection.from < selection.to ) {
					selection.from += 2;
				} else {
					selection.to += 2;
				}
			}
			if ( selection.from < selection.to ) {
				selection.to += (stacks.length * 2) + (nodes.length - listItems.length - 1) * 2;
			} else {
				selection.from += (stacks.length * 2) + (nodes.length - listItems.length - 1) * 2;
			}
		}
	}

	for( i = 0; i < listItems.length; i++ ) {
		styles = listItems[i].getElementAttribute( 'styles' );
		if ( styles[styles.length - 1] !== style ) {
			styles.splice( styles.length - 1, 1, style );
			tx = surface.model.getDocument().prepareElementAttributeChange(
				surface.documentView.model.getOffsetFromNode( listItems[i], false ),
				'set',
				'styles',
				styles
			);
			surface.model.transact( tx );
		}
	}

	for( i = 0; i < stacks.length; i++ ) {
		removeLength = 0;
		insertAt = surface.documentView.model.getOffsetFromNode( stacks[i][0], false );

		data = [ { 'type': 'list' } ];
		for( j = 0; j < stacks[i].length; j++ ) {
			removeLength += stacks[i][j].getElementLength();

			data = data
				.concat( [ {
					'type': 'listItem',
					'attributes' : { 'styles': [ this.name ] }
				} ] )
				//.concat( stacks[i][j].getElementData() )
				.concat( [ { 'type': 'paragraph' } ] )
				.concat( stacks[i][j].getContentData() )
				.concat( [ { 'type': '/paragraph' } ] )
				.concat( [ { 'type': '/listItem' } ] );
		}
		data = data.concat( [ { 'type': '/list' } ] );

		tx = surface.model.getDocument().prepareInsertion( insertAt, data );
		surface.model.transact( tx );

		tx = surface.model.getDocument().prepareRemoval(
			new es.Range( insertAt + data.length, insertAt + removeLength + data.length )
		);
		surface.model.transact( tx );

	}

	surface.model.select( selection, true );
	surface.emitCursor();
};

es.ListButtonTool.prototype.unlist = function( nodes ) {
	var	listItems = [],
		listItem,
		i;

	for( i = 0; i < nodes.length; i++ ) {
		listItem = nodes[i].getParent();
		if ( listItems.length > 0 ) {
			if (listItem != listItems[listItems.length - 1]) {
				listItems.push( listItem );
			}
		} else {
			listItems.push( listItem );
		}
	}

	var	stacks = [],
		stack = {
			first: false,
			last: false,
			nodes: [],
			offset: 0,
			length: 0
		},
		surface = this.toolbar.surfaceView,
		selection = surface.currentSelection.clone(),
		from = 0,
		to = 0;

	for( i = 0; i < listItems.length; i++ ) {
		if( stack.nodes.length > 0 ) {
			if ( stack.nodes[stack.nodes.length - 1].getParent() != listItems[i].getParent() ) {
				stacks.push( stack );
				stack = {
					first: false,
					last: false,
					nodes: [],
					offset: 0,
					length: 0
				};
			}
		}
		if ( listItems[i].getParent().indexOf( listItems[i] ) === 0 ) {
			stack.first = true;
		}
		if ( listItems[i].getParent().indexOf( listItems[i] ) === listItems[i].getParent().children.length - 1 ) {
			stack.last = true;
		}
		if( stack.nodes.length === 0 ){
			stack.offset = surface.documentView.model.getOffsetFromNode(listItems[i], false);
		}
		stack.length += listItems[i].getElementLength();
		stack.nodes.push( listItems[i] );
	}
	if( stack.nodes.length > 0 ) {
		stacks.push(stack);
	}

	var	tx,
		j,
		extra,
		data;

	for( i = stacks.length - 1; i >= 0; i-- ) {
		stack = stacks[i];

		data = [];
		for( j = 0; j < stack.nodes.length; j++ ) {
			data = data.concat( stack.nodes[j].getContentData() );
		}

		if ( stack.first === true && stack.last === true ) {
			tx = surface.model.getDocument().prepareRemoval(
				new es.Range( stack.offset - 1 /* list */, stack.offset + stack.length + 1 /* /list */ )
			);
			surface.model.transact( tx );
			tx = surface.model.getDocument().prepareInsertion( stack.offset - 1, data );
			surface.model.transact( tx );
			from = -2;
			to += -(stack.nodes.length * 2);
		} else  if ( stack.first === true && stack.last === false ) {
			tx = surface.model.getDocument().prepareRemoval(
				new es.Range( stack.offset, stack.offset + stack.length )
			);
			surface.model.transact( tx );
			tx = surface.model.getDocument().prepareInsertion( stack.offset - 1, data );
			surface.model.transact( tx );
			from = -2;
			to += -(stack.nodes.length * 2);
		} else  if ( stack.first === false && stack.last === true ) {
			tx = surface.model.getDocument().prepareRemoval(
				new es.Range( stack.offset, stack.offset + stack.length )
			);
			surface.model.transact( tx );
			tx = surface.model.getDocument().prepareInsertion( stack.offset + 1, data );
			surface.model.transact( tx );
			to += -(stack.nodes.length * 2);
			to += 2;
		} else  if ( stack.first === false && stack.last === false ) {
			var parent = stack.nodes[0].getParent();
			var parentOffset = surface.documentView.model.getOffsetFromNode( parent, false );
			var parentLength = parent.getElementLength();
			
			tx = surface.model.getDocument().prepareRemoval(
				new es.Range( stack.offset, stack.offset + stack.length )
			);
			surface.model.transact( tx );

			var remainingRange = new es.Range( stack.offset, parentOffset + parentLength - stack.length - 1 );
			var remainingData = surface.model.getDocument().getData( remainingRange );

			tx = surface.model.getDocument().prepareRemoval( remainingRange );
			surface.model.transact( tx );

			tx = surface.model.getDocument().prepareInsertion(
				stack.offset + 1,
				[ { 'type': 'list' } ].concat( remainingData ).concat( [ { 'type': '/list' } ] )
			);
			surface.model.transact( tx );

			tx = surface.model.getDocument().prepareInsertion( stack.offset + 1, data );
			surface.model.transact( tx );
			to += -(stack.nodes.length * 2);
			to += 2;
		}
	}
	if ( selection.from === selection.to ) {
		selection.from += from;
		selection.to += from;
	} else {
		if ( selection.to > selection.from ) {
			selection.from += from;
			selection.to += to;
		} else {
			selection.to += from;
			selection.from += to;
		}
	}
	surface.model.select( selection, true );
	surface.emitCursor();
};

es.ListButtonTool.prototype.onClick = function() {
	this.toolbar.surfaceView.model.breakpoint();
	if ( !this.$.hasClass( 'es-toolbarButtonTool-down' ) ) {
		this.list( this.nodes, this.name );
	} else {
		this.unlist( this.nodes );
	}
	this.toolbar.surfaceView.model.breakpoint();
};

es.ListButtonTool.prototype.updateState = function( annotations, nodes ) {
	function areListItemsOfStyle( nodes, style ) {
		var parent, styles;
		for( var i = 0; i < nodes.length; i++ ) {
			parent = nodes[i].getParent();
			if ( parent.getElementType() !== 'listItem' ) {
				return false;
			}
			styles = parent.getElementAttribute( 'styles' );
			if ( styles[ styles.length - 1] !== style ) {
				return false;
			}
		}
		return true;
	}

	this.nodes = nodes;
	if ( areListItemsOfStyle( this.nodes, this.name ) ) {
		this.$.addClass( 'es-toolbarButtonTool-down' );
	} else {
		this.$.removeClass( 'es-toolbarButtonTool-down' );
	}
};

/* Registration */

es.Tool.tools.number = {
	'constructor': es.ListButtonTool,
	'name': 'number',
	'title': 'Numbered list'
};

es.Tool.tools.bullet = {
	'constructor': es.ListButtonTool,
	'name': 'bullet',
	'title': 'Bulleted list'
};

/* Inheritance */

es.extendClass( es.ListButtonTool, es.ButtonTool );
/**
 * Creates an es.IndentationButtonTool object.
 * 
 * @class
 * @constructor
 * @extends {es.ButtonTool}
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 */
 es.IndentationButtonTool = function( toolbar, name, title, data ) {
	es.ButtonTool.call( this, toolbar, name, title );
	this.data = data;
};

/* Methods */

es.IndentationButtonTool.prototype.onClick = function() {
	if ( !this.$.hasClass( 'es-toolbarButtonTool-disabled' ) ) {
		var	listItems = [],
			listItem,
			i;
		for ( i = 0; i < this.nodes.length; i++ ) {
			listItem = this.nodes[i].getParent();
			if ( listItems.length > 0 ) {
				if (listItem != listItems[listItems.length - 1]) {
					listItems.push( listItem );
				}
			} else {
				listItems.push( listItem );
			}
		}
		if ( this.name === 'indent' ) {
			this.indent( listItems );
		} else if ( this.name === 'outdent' ) {
			this.outdent( listItems );
		}
	}
};

es.IndentationButtonTool.prototype.indent = function( listItems ) {
	var	surface = this.toolbar.surfaceView,
		styles,
		i;

	for ( i = 0; i < listItems.length; i++ ) {
		styles = listItems[i].getElementAttribute( 'styles' );
		if ( styles.length < 6 ) {
			styles.push( styles[styles.length - 1] );
			tx = surface.model.getDocument().prepareElementAttributeChange(
				surface.documentView.model.getOffsetFromNode( listItems[i], false ),
				'set',
				'styles',
				styles
			);
			surface.model.transact( tx );
		}
	}
	surface.emitCursor();
};

es.IndentationButtonTool.prototype.outdent = function( listItems ) {
	var	surface = this.toolbar.surfaceView,
		styles,
		i;

	for ( i = 0; i < listItems.length; i++ ) {
		styles = listItems[i].getElementAttribute( 'styles' );
		if ( styles.length > 1 ) {
			styles.splice( styles.length - 1, 1);
			tx = surface.model.getDocument().prepareElementAttributeChange(
				surface.documentView.model.getOffsetFromNode( listItems[i], false ),
				'set',
				'styles',
				styles
			);
			surface.model.transact( tx );
		}
	}
	surface.emitCursor();
};

es.IndentationButtonTool.prototype.updateState = function( annotations, nodes ) {
	function areListItems( nodes ) {
		for( var i = 0; i < nodes.length; i++ ) {
			if ( nodes[i].getParent().getElementType() !== 'listItem' ) {
				return false;
			}
		}
		return true;
	}

	this.nodes = nodes;
	if ( areListItems( this.nodes ) ) {
		this.$.removeClass( 'es-toolbarButtonTool-disabled' );
	} else {
		this.$.addClass( 'es-toolbarButtonTool-disabled' );
	}
};

/* Registration */

/*es.Tool.tools.indent = {
	'constructor': es.IndentationButtonTool,
	'name': 'indent',
	'title': 'Increase indentation'
};

es.Tool.tools.outdent = {
	'constructor': es.IndentationButtonTool,
	'name': 'outdent',
	'title': 'Reduce indentation'
};*/ // Disabled because it doen't work

/* Inheritance */

es.extendClass( es.IndentationButtonTool, es.ButtonTool );/**
 * Creates an es.DropdownTool object.
 * 
 * @class
 * @constructor
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 * @param {Object[]} items
 */
es.DropdownTool = function( toolbar, name, title, items ) {
	// Inheritance
	es.Tool.call( this, toolbar, name, title );
	if ( !name ) {
		return;
	}

	// Properties
	var _this = this;
	this.menuView = new es.MenuView( items, function( item ) {
		_this.onSelect( item );
		/**
		 * START MODIF Yannick for trad
		 */
		//_this.$label.text( item.label );
		var label = item.$.html();
		_this.$label.text( label );
		/**
		 * END MODIF Yannick for trad
		 */
	}, this.$ );
	this.$label = $( '<div class="es-toolbarDropdownTool-label"></div>' ).appendTo( this.$ );

	// Events
	$( document )
		.add( this.toolbar.surfaceView.$ )
			.mousedown( function( e ) {
				if ( e.which === 1 ) {
					_this.menuView.close();
				}
			} );
	this.$.bind( {
		'mousedown': function( e ) {
			if ( e.which === 1 ) {
				e.preventDefault();
				return false;
			}
		},
		'mouseup': function( e ) {
			// Don't respond to menu clicks
			var $item = $( e.target ).closest( '.es-menuView' );
			if ( e.which === 1 && $item.length === 0 ) {
				_this.menuView.open();
			} else {
				_this.menuView.close();
			}
		}
	} );

	// DOM Changes
	this.$.addClass( 'es-toolbarDropdownTool' ).addClass( 'es-toolbarDropdownTool-' + name );
};

/* Methods */

es.DropdownTool.prototype.onSelect = function( item ) {
	throw 'DropdownTool.onSelect not implemented in this subclass:' + this.constructor;
};

/* Inheritance */

es.extendClass( es.DropdownTool, es.Tool );
/**
 * Creates an es.FormatDropdownTool object.
 * 
 * @class
 * @constructor
 * @extends {es.DropdownTool}
 * @param {es.ToolbarView} toolbar
 * @param {String} name
 * @param {Object[]} items
 */
es.FormatDropdownTool = function( toolbar, name, title ) {
	// Inheritance
	es.DropdownTool.call( this, toolbar, name, title, [
		{ 
			'name': 'paragraph',
			'label': 'Paragraph',
			'type' : 'paragraph'
		},
		{
			'name': 'heading-1',
			'label': 'Heading 1',
			'type' : 'heading',
			'attributes': { 'level': 1 }
		},
		{
			'name': 'heading-2',
			'label': 'Heading 2',
			'type' : 'heading',
			'attributes': { 'level': 2 }
		},
		{
			'name': 'heading-3',
			'label': 'Heading 3',
			'type' : 'heading',
			'attributes': { 'level': 3 }
		}/*,
		{
			'name': 'heading-4',
			'label': 'Heading 4',
			'type' : 'heading',
			'attributes': { 'level': 4 }
		},
		{
			'name': 'heading-5',
			'label': 'Heading 5',
			'type' : 'heading',
			'attributes': { 'level': 5 }
		},
		{
			'name': 'heading-6',
			'label': 'Heading 6',
			'type' : 'heading',
			'attributes': { 'level': 6 }
		}*/,
		{
			'name': 'pre',
			'label': 'Preformatted',
			'type' : 'pre'
		}
	] );
};

/* Methods */

es.FormatDropdownTool.prototype.onSelect = function( item ) {
	var txs = this.toolbar.surfaceView.model.getDocument().prepareLeafConversion(
		this.toolbar.surfaceView.currentSelection,
		item.type,
		item.attributes
	);
	for ( var i = 0; i < txs.length; i++ ) {
		this.toolbar.surfaceView.model.transact( txs[i] );
	}
};

es.FormatDropdownTool.prototype.updateState = function( annotations, nodes ) {
	// Get type and attributes of the first node
	var i,
		format = {
			'type': nodes[0].getElementType(),
			'attributes': nodes[0].getElement().attributes
		};
	// Look for mismatches, in which case format should be null
	for ( i = 1; i < nodes.length; i++ ) {
		if ( format.type != nodes[i].getElementType() ||
			!es.compareObjects( format.attributes, nodes[i].element.attributes ) ) {
			format = null;
			break;
		}
	}
	
	if ( format === null ) {
		this.$label.html( '&nbsp;' );
	} else {
		var items = this.menuView.getItems();
		for ( i = 0; i < items.length; i++ ) {
			if (
				format.type === items[i].type &&
				es.compareObjects( format.attributes, items[i].attributes )
			) {
				/**
				 * START MODIF Yannick for trad
				 */
				//this.$label.text( items[i].label );
				var label = items[i].$.html();
				this.$label.text( label );
				/**
				 * END MODIF Yannick for trad
				 */
				break;
			}
		}
	}
};

/* Registration */

es.Tool.tools.format = {
	'constructor': es.FormatDropdownTool,
	'name': 'format',
	'title': 'Change format'
};

/* Inheritance */

es.extendClass( es.FormatDropdownTool, es.DropdownTool );
/**
 * Creates an es.SurfaceView object.
 * 
 * @class
 * @constructor
 * @param {jQuery} $container DOM Container to render surface into
 * @param {es.SurfaceModel} model Surface model to view
 */

es.SurfaceView = function( $container, model ) {
	// Inheritance
	es.EventEmitter.call( this );

	// References for use in closures
	var	_this = this,
		$document = $( document ),
		$window = $( window );
	
	// Properties
	this.model = model;
	this.currentSelection = new es.Range();
	this.documentView = new es.DocumentView( this.model.getDocument(), this );
	this.contextView = null;
	this.$ = $container
		.addClass( 'es-surfaceView' )
		.append( this.documentView.$ );
	this.$input = $( '<textarea class="es-surfaceView-textarea" autocapitalize="off" />' )
		.appendTo( 'body' );
	this.$cursor = $( '<div class="es-surfaceView-cursor"></div>' )
		.appendTo( 'body' );
	this.insertionAnnotations = [];
	this.updateSelectionTimeout = undefined;
	this.emitUpdateTimeout = undefined;
	this.emitCursorTimeout = undefined;

	// Interaction states
	
	/*
	 * There are three different selection modes available for mouse. Selection of:
	 *     1 - chars
	 *     2 - words
	 *     3 - nodes (e.g. paragraph, listitem)
	 *
	 * In case of 2 and 3 selectedRange stores the range of original selection caused by double
	 * or triple mousedowns.
	 */
	this.mouse = {
		selectingMode: null,
		selectedRange: null
	};
	this.cursor = {
		interval: null,
		initialLeft: null,
		initialBias: false
	};
	this.keyboard = {
		selecting: false,
		cursorAnchor: null,
		keydownTimeout: null,
		keys: { shift: false }
	};
	
	this.dimensions = {
		width: this.$.width(),
		height: $window.height(),
		scrollTop: $window.scrollTop(),
		// XXX: This is a dirty hack!
		toolbarHeight:
		    $container.parents('.es-base').find('.es-toolbar').height()
	};

	// Events

	this.model.on( 'select', function( selection ) {
		// Keep a copy of the current selection on hand
		_this.currentSelection = selection.clone();
		// Respond to selection changes
		_this.updateSelection();
		if ( selection.getLength() ) {
			_this.$input.val( _this.documentView.model.getContentText( selection ) ).select();
			_this.clearInsertionAnnotations();
		} else {
			_this.$input.val('').select();
			_this.loadInsertionAnnotations();
		}
	} );
	this.model.getDocument().on( 'update', function() {
		_this.emitUpdate( 25 );
	} );
	this.on( 'update', function() {
		_this.updateSelection( 25 );
	} );
	this.$.mousedown( function(e) {
		return _this.onMouseDown( e );
	} );
	this.$input.bind( {
			'focus': function() {
				// Make sure we aren't double-binding
				$document.unbind( '.es-surfaceView' );
				// Bind mouse and key events to the document to ensure we don't miss anything
				$document.bind( {
					'mousemove.es-surfaceView': function(e) {
						return _this.onMouseMove( e );
					},
					'mouseup.es-surfaceView': function(e) {
						return _this.onMouseUp( e );
					},
					'keydown.es-surfaceView': function( e ) {
						return _this.onKeyDown( e );			
					},
					'keyup.es-surfaceView': function( e ) {
						return _this.onKeyUp( e );		
					},
					'copy.es-surfaceView': function( e ) {
						return _this.onCopy( e );		
					},
					'cut.es-surfaceView': function( e ) {
						return _this.onCut( e );		
					},
					'paste.es-surfaceView': function( e ) {
						return _this.onPaste( e );		
					}
				} );
			},
			'blur': function( e ) {
				// Release our event handlers when not focused
				$document.unbind( '.es-surfaceView' );
				_this.hideCursor();
			},
			'paste': function() {
				setTimeout( function() {
				    var val = _this.$input.val(),
				        chars = val.split(''),
				        paragraph = '',
				        c;
				    
					_this.model.breakpoint();
					/**
					 * Create paragraphes from double \n
					 */
					for (var i = 0, len = chars.length; i < len; i++)
					{
					    c = chars[i+1];
					    if (chars[i] !== '\n')
					    {
					        paragraph+=chars[i];
				        }
				        
					    if (!c ||
					        c === '\n')
					    {
					        _this.$input.val(paragraph);
    					    _this.insertFromInput();
    					    
    					    if (c === '\n' &&
					            paragraph.length)
					        {
					            _this.handleEnter();
					        }
					        
    					    paragraph = '';
					    }
					}
					_this.model.breakpoint();
				}, 0 );
			}
		} );
	$window.bind( {
		'resize': function() {
			// Re-render when resizing horizontally
			// TODO: Instead of re-rendering on every single 'resize' event wait till user is done
			// with resizing - can be implemented with setTimeout
			_this.hideCursor();
			_this.dimensions.height = $window.height();
			// XXX: This is a dirty hack!
			_this.dimensions.toolbarHeight = 
			    $container.parents('.es-base').find('.es-toolbar').height();
			var width = _this.$.width();
			if ( _this.dimensions.width !== width ) {
				_this.dimensions.width = width;
				_this.documentView.renderContent();
				_this.emitUpdate( 25 );
			}
		},
		'scroll': function() {
			_this.dimensions.scrollTop = $window.scrollTop();
			if ( _this.contextView ) {
				if ( _this.currentSelection.getLength() && !_this.mouse.selectingMode ) {
					_this.contextView.set();
				} else {
					_this.contextView.clear();
				}
			}
		},
		'blur': function() {
			_this.keyboard.keys.shift = false;
		}
	} );

	// Configuration
	this.mac = navigator.userAgent.match(/mac/i) ? true : false; // (yes it's evil, for keys only!)
	this.ie8 = $.browser.msie && $.browser.version === "8.0";

	// Initialization
	//this.$input.focus();
	this.documentView.renderContent();
};

/* Methods */

es.SurfaceView.prototype.attachContextView = function( contextView ) {
	this.contextView = contextView;
};

es.SurfaceView.prototype.getContextView = function() {
	return this.contextView ;
};

es.SurfaceView.prototype.annotate = function( method, annotation ) {
	if ( method === 'toggle' ) {
		var annotations = this.getAnnotations();
		if ( es.DocumentModel.getIndexOfAnnotation( annotations.full, annotation ) !== -1 ) {
			method = 'clear';
		} else {
			method = 'set';
		}
	}
	if ( this.currentSelection.getLength() ) {
		var tx = this.model.getDocument().prepareContentAnnotation(
			this.currentSelection, method, annotation
		);
		this.model.transact( tx );
	} else {
		if ( method === 'set' ) {
			this.addInsertionAnnotation( annotation );
		} else if ( method === 'clear' ) {
			this.removeInsertionAnnotation( annotation );
		}
	}
};

es.SurfaceView.prototype.getAnnotations = function() {
	return this.currentSelection.getLength() ?
		this.model.getDocument().getAnnotationsFromRange( this.currentSelection ) :
		{
			'full': this.insertionAnnotations,
			'partial': [],
			'all': this.insertionAnnotations
		};
};

es.SurfaceView.prototype.emitCursor = function() {
	if ( this.emitCursorTimeout ) {
		clearTimeout( this.emitCursorTimeout );
	}
	var _this = this;
	this.emitCursorTimeout = setTimeout( function() {
		var	annotations = _this.getAnnotations(),
			nodes = [],
			model = _this.documentView.model;
		if ( _this.currentSelection.from === _this.currentSelection.to ) {
			nodes.push( model.getNodeFromOffset( _this.currentSelection.from ) );
		} else {
			var	startNode = model.getNodeFromOffset( _this.currentSelection.start ),
				endNode = model.getNodeFromOffset( _this.currentSelection.end );
			if ( startNode === endNode ) {
				nodes.push( startNode );
			} else {
				model.traverseLeafNodes( function( node ) {
					nodes.push( node );
					if( node === endNode ) {
						return false;
					}
				}, startNode );			
			}
		}
		_this.emit( 'cursor', annotations, nodes );
	}, 50 );
};

es.SurfaceView.prototype.getInsertionAnnotations = function() {
	return this.insertionAnnotations;
};

es.SurfaceView.prototype.addInsertionAnnotation = function( annotation ) {
	this.insertionAnnotations.push( annotation );
	this.emitCursor();
};

es.SurfaceView.prototype.loadInsertionAnnotations = function( annotation ) {
	this.insertionAnnotations =
		this.model.getDocument().getAnnotationsFromOffset( this.currentSelection.to - 1 );
	// Filter out annotations that aren't textStyles or links
	for ( var i = 0; i < this.insertionAnnotations.length; i++ ) {
		if ( !this.insertionAnnotations[i].type.match( /(textStyle\/|link\/)/ ) ) {
			this.insertionAnnotations.splice( i, 1 );
			i--;
		}
	}
	this.emitCursor();
};

es.SurfaceView.prototype.removeInsertionAnnotation = function( annotation ) {
	var index = es.DocumentModel.getIndexOfAnnotation( this.insertionAnnotations, annotation );
	if ( index !== -1 ) {
		this.insertionAnnotations.splice( index, 1 );
	}
	this.emitCursor();
};

es.SurfaceView.prototype.clearInsertionAnnotations = function() {
	this.insertionAnnotations = [];
	this.emitCursor();
};

es.SurfaceView.prototype.getModel = function() {
	return this.model;
};

es.SurfaceView.prototype.updateSelection = function( delay ) {
	var _this = this;
	function update() {
		if ( _this.currentSelection.getLength() ) {
			_this.clearInsertionAnnotations();
			_this.hideCursor();
			_this.documentView.drawSelection( _this.currentSelection );
		} else {
			_this.showCursor();
			_this.documentView.clearSelection( _this.currentSelection );
		}
		if ( _this.contextView ) {
			if ( _this.currentSelection.getLength() && !_this.mouse.selectingMode ) {
				_this.contextView.set();
			} else {
				_this.contextView.clear();
			}
		}
		_this.updateSelectionTimeout = undefined;
	}
	if ( delay ) {
		if ( this.updateSelectionTimeout !== undefined ) {
			return;
		}
		this.updateSelectionTimeout = setTimeout( update, delay );
	} else {
		update();
	}
};

es.SurfaceView.prototype.emitUpdate = function( delay ) {
	if ( delay ) {
		if ( this.emitUpdateTimeout !== undefined ) {
			return;
		}
		var _this = this;
		this.emitUpdateTimeout = setTimeout( function() {
			_this.emit( 'update' );	
			_this.emitUpdateTimeout = undefined;
		}, delay );
	} else {
		this.emit( 'update' );	
	}
};

es.SurfaceView.prototype.onMouseDown = function( e ) {
	// Only for left mouse button
	if ( e.which === 1 ) {
		var selection = this.currentSelection.clone(),
			offset = this.documentView.getOffsetFromEvent( e );
		// Single click
		if ( this.ie8 || e.originalEvent.detail === 1 ) {
			// @see {es.SurfaceView.prototype.onMouseMove}
			this.mouse.selectingMode = 1;

			if ( this.keyboard.keys.shift && offset !== selection.from ) {
				// Extend current or create new selection
				selection.to = offset;
			} else {
				selection.from = selection.to = offset;

				var	position = es.Position.newFromEventPagePosition( e ),
					nodeView = this.documentView.getNodeFromOffset( offset, false );
				this.cursor.initialBias = position.left > nodeView.contentView.$.offset().left;
			}
		}
		// Double click
		else if ( e.originalEvent.detail === 2 ) {
			// @see {es.SurfaceView.prototype.onMouseMove}
			this.mouse.selectingMode = 2;
			
			var wordRange = this.model.getDocument().getWordBoundaries( offset );
			if( wordRange ) {
				selection = wordRange;
				this.mouse.selectedRange = selection.clone();
			}
		}
		// Triple click
		else if ( e.originalEvent.detail >= 3 ) {
			// @see {es.SurfaceView.prototype.onMouseMove}
			this.mouse.selectingMode = 3;

			var node = this.documentView.getNodeFromOffset( offset ),
				nodeOffset = this.documentView.getOffsetFromNode( node, false );

			selection.from = this.model.getDocument().getRelativeContentOffset( nodeOffset, 1 );
			selection.to = this.model.getDocument().getRelativeContentOffset(
				nodeOffset + node.getElementLength(), -1
			);
			this.mouse.selectedRange = selection.clone();
		}
	}
	
	var _this = this;
	
	function select() {
		if ( e.which === 1 ) {
			// Reset the initial left position
			_this.cursor.initialLeft = null;
			// Apply new selection
			_this.model.select( selection, true );
		}

		// If the inut isn't already focused, focus it and select it's contents
		if ( !_this.$input.is( ':focus' ) ) {
			_this.$input.focus().select();
		}
	}

	if ( this.ie8 ) {
		setTimeout( select, 0 );
	} else {
		select();
	}

	return false;
};

es.SurfaceView.prototype.onMouseMove = function( e ) {
	// Only with the left mouse button while in selecting mode
	if ( e.which === 1 && this.mouse.selectingMode ) {
		var selection = this.currentSelection.clone(),
			offset = this.documentView.getOffsetFromEvent( e );

		// Character selection
		if ( this.mouse.selectingMode === 1 ) {
			selection.to = offset;
		}
		// Word selection
		else if ( this.mouse.selectingMode === 2 ) {
			var wordRange = this.model.getDocument().getWordBoundaries( offset );
			if ( wordRange ) {
				if ( wordRange.to <= this.mouse.selectedRange.from ) {
					selection.from = wordRange.from;
					selection.to = this.mouse.selectedRange.to;
				} else {
					selection.from = this.mouse.selectedRange.from;
					selection.to = wordRange.to;
				}
			}
		}
		// Node selection
		else if ( this.mouse.selectingMode === 3 ) {
			// @see {es.SurfaceView.prototype.onMouseMove}
			this.mouse.selectingMode = 3;

			var nodeRange = this.documentView.getRangeFromNode(
				this.documentView.getNodeFromOffset( offset )
			);
			if ( nodeRange.to <= this.mouse.selectedRange.from ) {
				selection.from = this.model.getDocument().getRelativeContentOffset(
					nodeRange.from, 1
				);
				selection.to = this.mouse.selectedRange.to;
			} else {
				selection.from = this.mouse.selectedRange.from;
				selection.to = this.model.getDocument().getRelativeContentOffset(
					nodeRange.to, -1
				);
			}	
		}
		// Apply new selection
		this.model.select( selection, true );
	}
};

es.SurfaceView.prototype.onMouseUp = function( e ) {
	if ( e.which === 1 ) { // left mouse button 
		this.mouse.selectingMode = this.mouse.selectedRange = null;
		this.model.select( this.currentSelection, true );
		if ( this.contextView ) {
			// We have to manually call this because the selection will not have changed between the
			// most recent mousemove and this mouseup
			this.contextView.set();
		}
	}
};

es.SurfaceView.prototype.onCopy = function( e ) {
	// TODO: Keep a data copy around
	return true;
};

es.SurfaceView.prototype.onCut = function( e ) {
	var _this = this;
	setTimeout( function() {
		_this.handleDelete();
	}, 10 );
	return true;
};

es.SurfaceView.prototype.onPaste = function( e ) {
	// TODO: Check if the data copy is the same as what got pasted, and use that instead if so
	return true;
};
es.SurfaceView.prototype.onKeyDown = function( e ) {
    
	switch ( e.keyCode ) {
		// Tab
		case 9:
			if ( !e.metaKey && !e.ctrlKey && !e.altKey ) {
				this.$input.val( '\t' );
				this.handleInsert();
				e.preventDefault();
				return false;
			}
			return true;
		// Shift
		case 16:
			this.keyboard.keys.shift = true;
			this.keyboard.selecting = true;
			break;
		// Ctrl
		case 17:
			break;
		// Home
		case 36:
			this.moveCursor( 'left', 'line' );
			break;
		// End
		case 35:
			this.moveCursor( 'right', 'line' );
			break;
		// Left arrow
		case 37:
			if ( !this.mac ) {
				if ( e.ctrlKey ) {
					this.moveCursor( 'left', 'word' );
				} else {
					this.moveCursor( 'left', 'char' );
				}
			} else {
				if ( e.metaKey || e.ctrlKey ) {
					this.moveCursor( 'left', 'line' );
				} else  if ( e.altKey ) {
					this.moveCursor( 'left', 'word' );
				} else {
					this.moveCursor( 'left', 'char' );
				}
			}
			break;
		// Up arrow
		case 38:
			if ( !this.mac ) {
				if ( e.ctrlKey ) {
					this.moveCursor( 'up', 'unit' );
				} else {
					this.moveCursor( 'up', 'char' );
				}
			} else {
				if ( e.altKey ) {
					this.moveCursor( 'up', 'unit' );
				} else {
					this.moveCursor( 'up', 'char' );
				}
			}
			break;
		// Right arrow
		case 39:
			if ( !this.mac ) {
				if ( e.ctrlKey ) {
					this.moveCursor( 'right', 'word' );
				} else {
					this.moveCursor( 'right', 'char' );
				}
			} else {
				if ( e.metaKey || e.ctrlKey ) {
					this.moveCursor( 'right', 'line' );
				} else  if ( e.altKey ) {
					this.moveCursor( 'right', 'word' );
				} else {
					this.moveCursor( 'right', 'char' );
				}
			}
			break;
		// Down arrow
		case 40:
			if ( !this.mac ) {
				if ( e.ctrlKey ) {
					this.moveCursor( 'down', 'unit' );
				} else {
					this.moveCursor( 'down', 'char' );
				}
			} else {
				if ( e.altKey ) {
					this.moveCursor( 'down', 'unit' );
				} else {
					this.moveCursor( 'down', 'char' );
				}
			}
			break;
		// Backspace
		case 8:
			this.handleDelete( true );
			break;
		// Delete
		case 46:
			this.handleDelete();
			break;
		// Enter
		case 13:
			if ( this.keyboard.keys.shift ) {
				this.$input.val( '\n' );
				this.handleInsert();
				e.preventDefault();
				return false;
			}
			this.handleEnter();
			e.preventDefault();
			break;
		// Insert content (maybe)
		default:
			// Control/command + character combos
			if ( e.metaKey || e.ctrlKey ) {
				switch ( e.keyCode ) {
					// y (redo)
					case 89:
						this.model.redo();
						return false;
					// z (undo/redo)
					case 90:
						if ( this.keyboard.keys.shift ) {
							this.model.redo();
						} else {
							this.model.undo();
						}
						return false;
					// a (select all)
					case 65:
					
						this.model.select( new es.Range(
							this.model.getDocument().getRelativeContentOffset( 0, 1 ),
							this.model.getDocument().getRelativeContentOffset(
								this.model.getDocument().getContentLength(), -1
							)
						), true );
						return false;
					// b (bold)
					case 66:
						this.annotate( 'toggle', {'type': 'textStyle/strong' } );
						return false;
					// i (italic)
					case 73:
						this.annotate( 'toggle', {'type': 'textStyle/emphasize' } );
						return false;
					// k (hyperlink)
					case 75:
						if ( this.currentSelection.getLength() ) {
							this.contextView.openInspector( 'link' );
						} else {
							var range = this.model.getDocument().getAnnotationBoundaries(
									this.currentSelection.from, { 'type': 'link/internal' }, true
								);
							if ( range ) {
								this.model.select( range );
								this.contextView.openInspector( 'link' );
							}
						}
						return false;
					case 13:
					    this.keyboard.keys.shift = false;
                		if ( this.keyboard.selecting ) {
                			this.keyboard.selecting = false;
                		}
                		return false;
				}
			}
			// Regular text insertion
			if (!this.mac)
			{
			    /*
			     * On mac, we have to handle insert on key up to watch
			     * keyIdentifier property and know if we have a dead key (^,¨,etc)
			     */
			    this.handleInsert();
		    }
			break;
	}
	return true;
};

es.SurfaceView.prototype.onKeyUp = function( e ) {
    
    if (this.mac &&
        e.originalEvent.keyIdentifier === 'Unidentified')
    {
        /**
         * On Mac, dead keys fires key* events. We have to ignore them if they
         * are not associated with a final caracter
         */
        return;
    }
    
	if ( e.keyCode === 16 ) {
		this.keyboard.keys.shift = false;
		if ( this.keyboard.selecting ) {
			this.keyboard.selecting = false;
		}
	}
	else if (this.mac)
	{
	    this.handleInsert();
	}
};

es.SurfaceView.prototype.handleInsert = function() {
    
	var _this = this;
	if ( _this.keyboard.keydownTimeout ) {
		clearTimeout( _this.keyboard.keydownTimeout );
	}
	_this.keyboard.keydownTimeout = setTimeout( function () {
		_this.insertFromInput();
	}, 10 );
};

es.SurfaceView.prototype.handleDelete = function( backspace, isPartial ) {
	var selection = this.currentSelection.clone(),
		sourceOffset,
		targetOffset,
		sourceSplitableNode,
		targetSplitableNode,
		tx;
	if ( selection.from === selection.to ) {
		if ( backspace ) {
			sourceOffset = selection.to;
			targetOffset = this.model.getDocument().getRelativeContentOffset(
				sourceOffset,
				-1
			);
		} else {
			sourceOffset = this.model.getDocument().getRelativeContentOffset(
				selection.to,
				1
			);
			targetOffset = selection.to;
		}

		var	sourceNode = this.documentView.getNodeFromOffset( sourceOffset, false ),
			targetNode = this.documentView.getNodeFromOffset( targetOffset, false );
	
		if ( sourceNode.model.getElementType() === targetNode.model.getElementType() ) {
			sourceSplitableNode = es.DocumentViewNode.getSplitableNode( sourceNode );
			targetSplitableNode = es.DocumentViewNode.getSplitableNode( targetNode );
		}
		
		selection.from = selection.to = targetOffset;
		this.model.select( selection );
		
		if ( sourceNode === targetNode ||
			( typeof sourceSplitableNode !== 'undefined' &&
			sourceSplitableNode.getParent()  === targetSplitableNode.getParent() ) ) {
			tx = this.model.getDocument().prepareRemoval(
				new es.Range( targetOffset, sourceOffset )
			);
			this.model.transact( tx, isPartial );
		} else {
			tx = this.model.getDocument().prepareInsertion(
				targetOffset, sourceNode.model.getContentData()
			);
			this.model.transact( tx, isPartial );
			
			var nodeToDelete = sourceNode;
			es.DocumentNode.traverseUpstream( nodeToDelete, function( node ) {
				if ( node.getParent().children.length === 1 ) {
					nodeToDelete = node.getParent();
					return true;
				} else {
					return false;
				}
			} );
			var range = new es.Range();
			range.from = this.documentView.getOffsetFromNode( nodeToDelete, false );
			range.to = range.from + nodeToDelete.getElementLength();
			tx = this.model.getDocument().prepareRemoval( range );
			this.model.transact( tx, isPartial );
		}
	} else {
		// selection removal
		tx = this.model.getDocument().prepareRemoval( selection );
		this.model.transact( tx, isPartial );
		selection.from = selection.to = selection.start;
		this.model.select( selection );
	}
};

es.SurfaceView.prototype.handleEnter = function() {
	var selection = this.currentSelection.clone(),
		tx;
	if ( selection.from !== selection.to ) {
		this.handleDelete( false, true );
	}
	var	node = this.documentView.getNodeFromOffset( selection.to, false ),
		nodeOffset = this.documentView.getOffsetFromNode( node, false );

	if (
		nodeOffset + node.getContentLength() + 1 === selection.to &&
		node ===  es.DocumentViewNode.getSplitableNode( node )
	) {
		tx = this.documentView.model.prepareInsertion(
			nodeOffset + node.getElementLength(),
			[ { 'type': 'paragraph' }, { 'type': '/paragraph' } ]
		);
		this.model.transact( tx );
		selection.from = selection.to = nodeOffset + node.getElementLength() + 1;	
	} else {
		var	stack = [],
			splitable = false;

		es.DocumentNode.traverseUpstream( node, function( node ) {
			var elementType = node.model.getElementType();
			if (
				splitable === true &&
				es.DocumentView.splitRules[ elementType ].children === true
			) {
				return false;
			}
			stack.splice(
				stack.length / 2,
				0,
				{ 'type': '/' + elementType },
				{
					'type': elementType,
					'attributes': es.copyObject( node.model.element.attributes )
				}
			);
			splitable = es.DocumentView.splitRules[ elementType ].self;
			return true;
		} );
		tx = this.documentView.model.prepareInsertion( selection.to, stack );
		this.model.transact( tx );
		selection.from = selection.to =
			this.model.getDocument().getRelativeContentOffset( selection.to, 1 );
	}
	this.model.select( selection );
};

es.SurfaceView.prototype.insertFromInput = function() {
	var selection = this.currentSelection.clone(),
		val = this.$input.val();
	
	if ( val.length > 0 ) {
		// Check if there was any effective input
		var input = this.$input[0],
			// Internet Explorer
			range = document.selection && document.selection.createRange();
		if (
			// DOM 3.0
			( 'selectionStart' in input && input.selectionEnd - input.selectionStart ) ||
			// Internet Explorer
			( range && range.text.length )
		) {
			// The input is still selected, so the key must not have inserted anything
			return;
		}

		// Clear the value for more input
		this.$input.val( '' );

		// Prepare and process a transaction
		var tx;
		if ( selection.from != selection.to ) {
			tx = this.model.getDocument().prepareRemoval( selection );
			this.model.transact( tx, true );
			selection.from = selection.to =
				Math.min( selection.from, selection.to );
		}
		var data = val.split('');
		es.DocumentModel.addAnnotationsToData( data, this.getInsertionAnnotations() );
		tx = this.model.getDocument().prepareInsertion( selection.from, data );
		this.model.transact( tx );

		// Move the selection
		selection.from += val.length;
		selection.to += val.length;
		this.model.select( selection );
	}
};

/**
 * @param {String} direction up | down | left | right
 * @param {String} unit char | word | line | node | page
 */
es.SurfaceView.prototype.moveCursor = function( direction, unit ) {
	if ( direction !== 'up' && direction !== 'down' ) {
		this.cursor.initialLeft = null;
	}
	var selection = this.currentSelection.clone(),
		to,
		offset;
	switch ( direction ) {
		case 'left':
		case 'right':
			switch ( unit ) {
				case 'char':
				case 'word':
					if ( this.keyboard.keys.shift || selection.from === selection.to ) {
						offset = selection.to;
					} else {
						offset = direction === 'left' ? selection.start : selection.end;
					}
					to = this.model.getDocument().getRelativeContentOffset(
							offset,
							direction === 'left' ? -1 : 1
					);
					if ( unit === 'word' ) {
						var wordRange = this.model.getDocument().getWordBoundaries(
							direction === 'left' ? to : offset
						);
						if ( wordRange ) {
							to = direction === 'left' ? wordRange.start : wordRange.end;
						}
					}
					break;
				case 'line':
					offset = this.cursor.initialBias ?
						this.model.getDocument().getRelativeContentOffset(
							selection.to,
							-1) :
								selection.to;
					var range = this.documentView.getRenderedLineRangeFromOffset( offset );
					to = direction === 'left' ? range.start : range.end;
					break;
				default:
					throw new Error( 'unrecognized cursor movement unit' );
					break;
			}
			break;
		case 'up':
		case 'down':
			switch ( unit ) {
				case 'unit':
					var toNode = null;
					this.model.getDocument().traverseLeafNodes(
						function( node ) {
							var doNextChild = toNode === null;
							toNode = node;
							return doNextChild;
						},
						this.documentView.getNodeFromOffset( selection.to, false ).getModel(),
						direction === 'up' ? true : false
					);
					to = this.model.getDocument().getOffsetFromNode( toNode, false ) + 1;
					break;
				case 'char':
					/*
					 * Looks for the in-document character position that would match up with the
					 * same horizontal position - jumping a few pixels up/down at a time until we
					 * reach the next/previous line
					 */
					var position = this.documentView.getRenderedPositionFromOffset(
						selection.to,
						this.cursor.initialBias
					);
					
					if ( this.cursor.initialLeft === null ) {
						this.cursor.initialLeft = position.left;
					}
					var	fakePosition = new es.Position( this.cursor.initialLeft, position.top ),
						i = 0,
						step = direction === 'up' ? -5 : 5,
						top = this.$.position().top;

					this.cursor.initialBias = position.left > this.documentView.getNodeFromOffset(
						selection.to, false
					).contentView.$.offset().left;

					do {
						i++;
						fakePosition.top += i * step;
						if ( fakePosition.top < top ) {
							break;
						} else if (
							fakePosition.top > top + this.dimensions.height +
								this.dimensions.scrollTop
						) {
							break;
						}
						fakePosition = this.documentView.getRenderedPositionFromOffset(
							this.documentView.getOffsetFromRenderedPosition( fakePosition ),
							this.cursor.initialBias
						);
						fakePosition.left = this.cursor.initialLeft;
					} while ( position.top === fakePosition.top );
					to = this.documentView.getOffsetFromRenderedPosition( fakePosition );
					break;
				default:
					throw new Error( 'unrecognized cursor movement unit' );
			}
			break;	
		default:
			throw new Error( 'unrecognized cursor direction' );
	}

	if( direction != 'up' && direction != 'down' ) {
		this.cursor.initialBias = direction === 'right' && unit === 'line' ? true : false;
	}

	if ( this.keyboard.keys.shift && selection.from !== to) {
		selection.to = to;
	} else {
		selection.from = selection.to = to;
	}
	this.model.select( selection, true );
};

/**
 * Shows the cursor in a new position.
 * 
 * @method
 * @param offset {Integer} Position to show the cursor at
 */
es.SurfaceView.prototype.showCursor = function() {	
	var $window = $( window ),
		position = this.documentView.getRenderedPositionFromOffset(
			this.currentSelection.to, this.cursor.initialBias
		);

	if (!position)
	{
	    return;
	}
	
	this.$cursor.css( {
		'left': position.left,
		'top': position.top,
		'height': position.bottom - position.top
	} ).show();
	this.$input.css({
		'top': position.top,
		'height': position.bottom - position.top
	});

	// Auto scroll to cursor
	var inputTop = this.$input.offset().top,
		inputBottom = inputTop + position.bottom - position.top;	
	if ( inputTop - this.dimensions.toolbarHeight < this.dimensions.scrollTop ) {
		$window.scrollTop( inputTop - this.dimensions.toolbarHeight );
	} else if ( inputBottom > ( this.dimensions.scrollTop + this.dimensions.height ) ) {
		$window.scrollTop( inputBottom - this.dimensions.height );
	}

	// cursor blinking
	if ( this.cursor.interval ) {
		clearInterval( this.cursor.interval );
	}

	var _this = this;
	this.cursor.interval = setInterval( function( surface ) {
		_this.$cursor.css( 'display', function( index, value ) {
			return value === 'block' ? 'none' : 'block';
		} );
	}, 500 );
};

/**
 * Hides the cursor.
 * 
 * @method
 */
es.SurfaceView.prototype.hideCursor = function() {
	if( this.cursor.interval ) {
		clearInterval( this.cursor.interval );
	}
	this.$cursor.hide();
};

/* Inheritance */

es.extendClass( es.SurfaceView, es.EventEmitter );
// ToolbarView
es.ToolbarView = function( $container, surfaceView, config ) {
	// Inheritance TODO: Do we still need it?
	es.EventEmitter.call( this );
	if ( !surfaceView ) {
		return;
	}

	// References for use in closures
	var	_this = this,
		$window = $( window );	

	// Properties
	this.surfaceView = surfaceView;
	this.$ = $container;
	this.$groups = $( '<div class="es-toolbarGroups"></div>' ).prependTo( this.$ );
	this.tools = [];

	this.surfaceView.on( 'cursor', function( annotations, nodes ) {
		for( var i = 0; i < _this.tools.length; i++ ) {
			_this.tools[i].updateState( annotations, nodes );
		}
	} );

	this.config = config || [
		{ 'name': 'history', 'items' : ['undo', 'redo'] },
		{ 'name': 'textStyle', 'items' : ['format'] },
		{ 'name': 'textStyle', 'items' : ['strong', 'em', 'del', 'link', 'clear'] },
		{ 'name': 'list', 'items' : ['number', 'bullet', 'outdent', 'indent'] }
	];
	this.setup();
};

/* Methods */

es.ToolbarView.prototype.getSurfaceView = function() {
	return this.surfaceView;
};

es.ToolbarView.prototype.setup = function() {
	for ( var i = 0; i < this.config.length; i++ ) {
		var	$group = $( '<div>' )
			.addClass( 'es-toolbarGroup' )
			.addClass( 'es-toolbarGroup-' + this.config[i].name );
		if ( this.config[i].label ) {
			$group.append(
				$( '<div>' ).addClass( 'es-toolbarLabel' ).html( this.config[i].label )
			);
		}

		for ( var j = 0; j < this.config[i].items.length; j++ ) {
			var toolDefintion = es.Tool.tools[ this.config[i].items[j] ];
			
			if ( toolDefintion ) {
				var tool = new toolDefintion.constructor(
					this, toolDefintion.name, toolDefintion.title, toolDefintion.data
				);
				this.tools.push( tool );
				$group.append( tool.$ );
			}
		}

		this.$groups.append( $group ); 
	}
};

es.extendClass( es.ToolbarView, es.EventEmitter );
/**
 * Creates an es.ContentView object.
 * 
 * A content view flows text into a DOM element and provides methods to get information about the
 * rendered output. HTML serialized specifically for rendering into and editing surface.
 * 
 * Rendering occurs automatically when content is modified, by responding to "update" events from
 * the model. Rendering is iterative and interruptable to reduce user feedback latency.
 * 
 * TODO: Cleanup code and comments
 * 
 * @class
 * @constructor
 * @param {jQuery} $container Element to render into
 * @param {es.ModelNode} model Model to produce view for
 * @property {jQuery} $
 * @property {es.ContentModel} model
 * @property {Array} boundaries
 * @property {Array} lines
 * @property {Integer} width
 * @property {RegExp} bondaryTest
 * @property {Object} widthCache
 * @property {Object} renderState
 * @property {Object} contentCache
 */
es.ContentView = function( $container, model ) {
	// Inheritance
	es.EventEmitter.call( this );

	// Properties
	this.$ = $container;
	this.model = model;
	this.boundaries = [];
	this.lines = [];
	this.width = null;
	this.boundaryTest = /([ \-\t\r\n\f])/g;
	this.widthCache = {};
	this.renderState = {};
	this.contentCache = null;

	if ( model ) {
		// Events
		var _this = this;
		this.model.on( 'update', function( offset ) {
			_this.scanBoundaries();
			_this.render( offset || 0 );
		} );

		// DOM Changes
		this.$ranges = $( '<div class="es-contentView-ranges"></div>' );
		this.$rangeStart = $( '<div class="es-contentView-range"></div>' );
		this.$rangeFill = $( '<div class="es-contentView-range"></div>' );
		this.$rangeEnd = $( '<div class="es-contentView-range"></div>' );
		this.$.prepend( this.$ranges.append( this.$rangeStart, this.$rangeFill, this.$rangeEnd ) );

		// Initialization
		this.scanBoundaries();
	}
};

/* Static Members */

/**
 * List of annotation rendering implementations.
 * 
 * Each supported annotation renderer must have an open and close property, each either a string or
 * a function which accepts a data argument.
 * 
 * @static
 * @member
 */
es.ContentView.annotationRenderers = {
	'object/template': {
		'open': function( data ) {
			return '<span class="es-contentView-format-object">' + data.html;
		},
		'close': '</span>'
	},
	'object/hook': {
		'open': function( data ) {
			return '<span class="es-contentView-format-object">' + data.html;
		},
		'close': '</span>'
	},
	'textStyle/bold': {
		'open': '<span class="es-contentView-format-textStyle-bold">',
		'close': '</span>'
	},
	'textStyle/italic': {
		'open': '<span class="es-contentView-format-textStyle-italic">',
		'close': '</span>'
	},
	'textStyle/strong': {
		'open': '<span class="es-contentView-format-textStyle-strong">',
		'close': '</span>'
	},
	'textStyle/emphasize': {
		'open': '<span class="es-contentView-format-textStyle-emphasize">',
		'close': '</span>'
	},
	'textStyle/delete': {
		'open': '<span class="es-contentView-format-textStyle-delete">',
		'close': '</span>'
	},
	'textStyle/big': {
		'open': '<span class="es-contentView-format-textStyle-big">',
		'close': '</span>'
	},
	'textStyle/small': {
		'open': '<span class="es-contentView-format-textStyle-small">',
		'close': '</span>'
	},
	'textStyle/superScript': {
		'open': '<span class="es-contentView-format-textStyle-superScript">',
		'close': '</span>'
	},
	'textStyle/subScript': {
		'open': '<span class="es-contentView-format-textStyle-subScript">',
		'close': '</span>'
	},
	'link/external': {
		'open': function( data ) {
			return '<span class="es-contentView-format-link" data-href="' + data.href + '">';
		},
		'close': '</span>'
	},
	'link/internal': {
		'open': function( data ) {
			return '<span class="es-contentView-format-link" data-title="wiki/' + data.title + '">';
		},
		'close': '</span>'
	}
};

/**
 * Mapping of character and HTML entities or renderings.
 * 
 * @static
 * @member
 */
es.ContentView.htmlCharacters = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'\'': '&#039;',
	'"': '&quot;',
	'\n': '<span class="es-contentView-whitespace">&#182;</span>',
	'\t': '<span class="es-contentView-whitespace">&#8702;</span>',
	' ': '&nbsp;'
};

/* Static Methods */

/**
 * Gets a rendered opening or closing of an annotation.
 * 
 * Tag nesting is handled using a stack, which keeps track of what is currently open. A common stack
 * argument should be used while rendering content.
 * 
 * @static
 * @method
 * @param {String} bias Which side of the annotation to render, either "open" or "close"
 * @param {Object} annotation Annotation to render
 * @param {Array} stack List of currently open annotations
 * @returns {String} Rendered annotation
 */
es.ContentView.renderAnnotation = function( bias, annotation, stack ) {
	var renderers = es.ContentView.annotationRenderers,
		type = annotation.type,
		out = '';
	if ( type in renderers ) {
		if ( bias === 'open' ) {
			// Add annotation to the top of the stack
			stack.push( annotation );
			// Open annotation
			out += typeof renderers[type].open === 'function' ?
				renderers[type].open( annotation.data ) : renderers[type].open;
		} else {
			if ( stack[stack.length - 1] === annotation ) {
				// Remove annotation from top of the stack
				stack.pop();
				// Close annotation
				out += typeof renderers[type].close === 'function' ?
					renderers[type].close( annotation.data ) : renderers[type].close;
			} else {
				// Find the annotation in the stack
				var depth = es.inArray( annotation, stack ),
					i;
				if ( depth === -1 ) {
					throw 'Invalid stack error. An element is missing from the stack.';
				}
				// Close each already opened annotation
				for ( i = stack.length - 1; i >= depth + 1; i-- ) {
					out += typeof renderers[stack[i].type].close === 'function' ?
						renderers[stack[i].type].close( stack[i].data ) :
							renderers[stack[i].type].close;
				}
				// Close the buried annotation
				out += typeof renderers[type].close === 'function' ?
					renderers[type].close( annotation.data ) : renderers[type].close;
				// Re-open each previously opened annotation
				for ( i = depth + 1; i < stack.length; i++ ) {
					out += typeof renderers[stack[i].type].open === 'function' ?
						renderers[stack[i].type].open( stack[i].data ) :
							renderers[stack[i].type].open;
				}
				// Remove the annotation from the middle of the stack
				stack.splice( depth, 1 );
			}
		}
	}
	return out;
};

/* Methods */

/**
 * Draws selection around a given range of content.
 * 
 * @method
 * @param {es.Range} range Range to draw selection around
 */
es.ContentView.prototype.drawSelection = function( range ) {
	if ( typeof range === 'undefined' ) {
		range = new es.Range( 0, this.model.getContentLength() );
	} else {
		range.normalize();
	}
	var fromLineIndex = this.getRenderedLineIndexFromOffset( range.start ),
		toLineIndex = this.getRenderedLineIndexFromOffset( range.end ),
		fromPosition = this.getRenderedPositionFromOffset( range.start ),
		toPosition = this.getRenderedPositionFromOffset( range.end );

	if ( fromLineIndex === toLineIndex ) {
		// Single line selection
		if ( toPosition.left - fromPosition.left ) {
			this.$rangeStart.css( {
				'top': fromPosition.top,
				'left': fromPosition.left,
				'width': toPosition.left - fromPosition.left,
				'height': fromPosition.bottom - fromPosition.top
			} ).show();
		}
		this.$rangeFill.hide();
		this.$rangeEnd.hide();
	} else {
		// Multiple line selection
		var contentWidth = this.$.width();
		if ( contentWidth - fromPosition.left ) {
			this.$rangeStart.css( {
				'top': fromPosition.top,
				'left': fromPosition.left,
				'width': contentWidth - fromPosition.left,
				'height': fromPosition.bottom - fromPosition.top
			} ).show();
		} else {
			this.$rangeStart.hide();
		}
		if ( toPosition.left ) {
			this.$rangeEnd.css( {
				'top': toPosition.top,
				'left': 0,
				'width': toPosition.left,
				'height': toPosition.bottom - toPosition.top
			} ).show();
		} else {
			this.$rangeEnd.hide();
		}
		if ( fromLineIndex + 1 < toLineIndex ) {
			this.$rangeFill.css( {
				'top': fromPosition.bottom,
				'left': 0,
				'width': contentWidth,
				'height': toPosition.top - fromPosition.bottom
			} ).show();
		} else {
			this.$rangeFill.hide();
		}
	}
};

/**
 * Clears selection if any was drawn.
 * 
 * @method
 */
es.ContentView.prototype.clearSelection = function() {
	this.$rangeStart.hide();
	this.$rangeFill.hide();
	this.$rangeEnd.hide();
};

/**
 * Gets the index of the rendered line a given offset is within.
 * 
 * Offsets that are out of range will always return the index of the last line.
 * 
 * @method
 * @param {Integer} offset Offset to get line for
 * @returns {Integer} Index of rendered lin offset is within
 */
es.ContentView.prototype.getRenderedLineIndexFromOffset = function( offset ) {
	for ( var i = 0; i < this.lines.length; i++ ) {
		if ( this.lines[i].range.containsOffset( offset ) ) {
			return i;
		}
	}
	return this.lines.length - 1;
};

/*
 * Gets the index of the rendered line closest to a given position.
 * 
 * If the position is above the first line, the offset will always be 0, and if the position is
 * below the last line the offset will always be the content length. All other vertical
 * positions will fall inside of one of the lines.
 * 
 * @method
 * @returns {Integer} Index of rendered line closest to position
 */
es.ContentView.prototype.getRenderedLineIndexFromPosition = function( position ) {
	var lineCount = this.lines.length;
	// Positions above the first line always jump to the first offset
	if ( !lineCount || position.top < 0 ) {
		return 0;
	}
	// Find which line the position is inside of
	var i = 0,
		top = 0;
	while ( i < lineCount ) {
		top += this.lines[i].height;
		if ( position.top < top ) {
			break;
		}
		i++;
	}
	// Positions below the last line always jump to the last offset
	if ( i === lineCount ) {
		return i - 1;
	}
	return i;
};

/**
 * Gets the range of the rendered line a given offset is within.
 * 
 * Offsets that are out of range will always return the range of the last line.
 * 
 * @method
 * @param {Integer} offset Offset to get line for
 * @returns {es.Range} Range of line offset is within
 */
es.ContentView.prototype.getRenderedLineRangeFromOffset = function( offset ) {
	for ( var i = 0; i < this.lines.length; i++ ) {
		if ( this.lines[i].range.containsOffset( offset ) ) {
			return this.lines[i].range;
		}
	}
	return this.lines[this.lines.length - 1].range;
};

/**
 * Gets offset within content model closest to of a given position.
 * 
 * Position is assumed to be local to the container the text is being flowed in.
 * 
 * @method
 * @param {Object} position Position to find offset for
 * @param {Integer} position.left Horizontal position in pixels
 * @param {Integer} position.top Vertical position in pixels
 * @returns {Integer} Offset within content model nearest the given coordinates
 */
es.ContentView.prototype.getOffsetFromRenderedPosition = function( position ) {
	// Empty content model shortcut
	if ( this.model.getContentLength() === 0 ) {
		return 0;
	}

	// Localize position
	position.subtract( es.Position.newFromElementPagePosition( this.$ ) );

	// Get the line object nearest the position
	var line = this.lines[this.getRenderedLineIndexFromPosition( position )];

	/*
	 * Offset finding
	 * 
	 * Now that we know which line we are on, we can just use the "fitCharacters" method to get the
	 * last offset before "position.left".
	 * 
	 * TODO: The offset needs to be chosen based on nearest offset to the cursor, not offset before
	 * the cursor.
	 */
	var $ruler = $( '<div class="es-contentView-ruler"></div>' ).appendTo( this.$ ),
		ruler = $ruler[0],
		fit = this.fitCharacters( line.range, ruler, position.left ),
		center;
	ruler.innerHTML = this.getHtml( new es.Range( line.range.start, fit.end ) );
	if ( fit.end < this.model.getContentLength() ) {
		var left = ruler.clientWidth;
		ruler.innerHTML = this.getHtml( new es.Range( line.range.start, fit.end + 1 ) );
		center = Math.round( left + ( ( ruler.clientWidth - left ) / 2 ) );
	} else {
		center = ruler.clientWidth;
	}
	$ruler.remove();
	// Reset RegExp object's state
	this.boundaryTest.lastIndex = 0;
	return Math.min(
		// If the position is right of the center of the character it's on top of, increment offset
		fit.end + ( position.left >= center ? 1 : 0 ),
		// Don't allow the value to be higher than the end
		line.range.end
	);
};

/**
 * Gets position coordinates of a given offset.
 * 
 * Offsets are boundaries between plain or annotated characters within content model. Results are
 * given in left, top and bottom positions, which could be used to draw a cursor, highlighting, etc.
 * 
 * @method
 * @param {Integer} offset Offset within content model
 * @returns {Object} Object containing left, top and bottom properties, each positions in pixels as
 * well as a line index
 */
es.ContentView.prototype.getRenderedPositionFromOffset = function( offset, leftBias ) {
	/* 
	 * Range validation
	 * 
	 * Rather than clamping the range, which can hide errors, exceptions will be thrown if offset is
	 * less than 0 or greater than the length of the content model.
	 */
	if ( offset < 0 ) {
		throw 'Out of range error. Offset is expected to be greater than or equal to 0.';
	} else if ( offset > this.model.getContentLength() ) {
		throw 'Out of range error. Offset is expected to be less than or equal to text length.';
	}
	/*
	 * Line finding
	 * 
	 * It's possible that a more efficient method could be used here, but the number of lines to be
	 * iterated through will rarely be over 100, so it's unlikely that any significant gains will be
	 * had. Plus, as long as we are iterating over each line, we can also sum up the top and bottom
	 * positions, which is a nice benefit of this method.
	 */
	var line,
		lineCount = this.lines.length,
		lineIndex = 0,
		position = new es.Position();
	while ( lineIndex < lineCount ) {
		line = this.lines[lineIndex];
		if ( line.range.containsOffset( offset ) || ( leftBias && line.range.end === offset ) ) {
			position.bottom = position.top + line.height;
			break;
		}
		position.top += line.height;
		lineIndex++;
	}
	/*
	 * Virtual n+1 position
	 * 
	 * To allow access to position information of the right side of the last character on the last
	 * line, a virtual n+1 position is supported. Offsets beyond this virtual position will cause
	 * an exception to be thrown.
	 */
	if ( lineIndex === lineCount ) {
		position.bottom = position.top;
		position.top -= line.height;
	}
	/*
	 * Offset measuring
	 * 
	 * Since the left position will be zero for the first character in the line, so we can skip
	 * measuring for those cases.
	 */
	if ( line.range.start < offset ) {
		var $ruler = $( '<div class="es-contentView-ruler"></div>' ).appendTo( this.$ ),
			ruler = $ruler[0];
		ruler.innerHTML = this.getHtml( new es.Range( line.range.start, offset ) );
		position.left = ruler.clientWidth;
		$ruler.remove();
	}
	return position;
};

/**
 * Updates the word boundary cache, which is used for word fitting.
 * 
 * @method
 */
es.ContentView.prototype.scanBoundaries = function() {
	/*
	 * Word boundary scan
	 * 
	 * To perform binary-search on words, rather than characters, we need to collect word boundary
	 * offsets into an array. The offset of the right side of the breaking character is stored, so
	 * the gaps between stored offsets always include the breaking character at the end.
	 * 
	 * To avoid encoding the same words as HTML over and over while fitting text to lines, we also
	 * build a list of HTML escaped strings for each gap between the offsets stored in the
	 * "boundaries" array. Slices of the "words" array can be joined, producing the escaped HTML of
	 * the words.
	 */
	// Get and cache a copy of all content, the make a plain-text version of the cached content
	var data = this.contentCache = this.model.getContentData(),
		text = '';
	for ( var i = 0, length = data.length; i < length; i++ ) {
		text += typeof data[i] === 'string' ? data[i] : data[i][0];
	}
	// Purge "boundaries" and "words" arrays
	this.boundaries = [0];
	// Reset RegExp object's state
	this.boundaryTest.lastIndex = 0;
	// Iterate over each word+boundary sequence, capturing offsets and encoding text as we go
	var match,
		end;
	while ( ( match = this.boundaryTest.exec( text ) ) ) {
		// Include the boundary character in the range
		end = match.index + 1;
		// Store the boundary offset
		this.boundaries.push( end );
	}
	// If the last character is not a boundary character, we need to append the final range to the
	// "boundaries" and "words" arrays
	if ( end < text.length || this.boundaries.length === 1 ) {
		this.boundaries.push( text.length );
	}
};

/**
 * Renders a batch of lines and then yields execution before rendering another batch.
 * 
 * In cases where a single word is too long to fit on a line, the word will be "virtually" wrapped,
 * causing them to be fragmented. Word fragments are rendered on their own lines, except for their
 * remainder, which is combined with whatever proceeding words can fit on the same line.
 * 
 * @method
 * @param {Integer} limit Maximum number of iterations to render before yeilding
 */
es.ContentView.prototype.renderIteration = function( limit ) {
	var rs = this.renderState,
		iteration = 0,
		fractional = false,
		lineStart = this.boundaries[rs.wordOffset],
		lineEnd,
		wordFit = null,
		charOffset = 0,
		charFit = null,
		wordCount = this.boundaries.length;
	while ( ++iteration <= limit && rs.wordOffset < wordCount - 1 ) {
		wordFit = this.fitWords( new es.Range( rs.wordOffset, wordCount - 1 ), rs.ruler, rs.width );
		fractional = false;
		if ( wordFit.width > rs.width ) {
			// The first word didn't fit, we need to split it up
			charOffset = lineStart;
			var lineOffset = rs.wordOffset;
			rs.wordOffset++;
			lineEnd = this.boundaries[rs.wordOffset];
			do {
				charFit = this.fitCharacters(
					new es.Range( charOffset, lineEnd ), rs.ruler, rs.width
				);
				// If we were able to get the rest of the characters on the line OK
				if ( charFit.end === lineEnd) {
					// Try to fit more words on the line
					wordFit = this.fitWords(
						new es.Range( rs.wordOffset, wordCount - 1 ),
						rs.ruler,
						rs.width - charFit.width
					);
					if ( wordFit.end > rs.wordOffset ) {
						lineOffset = rs.wordOffset;
						rs.wordOffset = wordFit.end;
						charFit.end = lineEnd = this.boundaries[rs.wordOffset];
					}
				}
				this.appendLine( new es.Range( charOffset, charFit.end ), lineOffset, fractional );
				// Move on to another line
				charOffset = charFit.end;
				// Mark the next line as fractional
				fractional = true;
			} while ( charOffset < lineEnd );
		} else {
			lineEnd = this.boundaries[wordFit.end];
			this.appendLine( new es.Range( lineStart, lineEnd ), rs.wordOffset, fractional );
			rs.wordOffset = wordFit.end;
		}
		lineStart = lineEnd;
	}
	// Only perform on actual last iteration
	if ( rs.wordOffset >= wordCount - 1 ) {
		// Cleanup
		rs.$ruler.remove();
		if ( rs.line < this.lines.length ) {
			this.lines.splice( rs.line, this.lines.length - rs.line );
		}
		this.$.find( '.es-contentView-line[line-index=' + ( this.lines.length - 1 ) + ']' )
			.nextAll()
			.remove();
		rs.timeout = undefined;
		this.emit( 'update' );
	} else {
		rs.ruler.innerHTML = '';
		var that = this;
		rs.timeout = setTimeout( function() {
			that.renderIteration( 3 );
		}, 0 );
	}
};

/**
 * Renders text into a series of HTML elements, each a single line of wrapped text.
 * 
 * The offset parameter can be used to reduce the amount of work involved in re-rendering the same
 * text, but will be automatically ignored if the text or width of the container has changed.
 * 
 * Rendering happens asynchronously, and yields execution between iterations. Iterative rendering
 * provides the JavaScript engine an ability to process events between rendering batches of lines,
 * allowing rendering to be interrupted and restarted if changes to content model are happening before
 * rendering of all lines is complete.
 * 
 * @method
 * @param {Integer} [offset] Offset to re-render from, if possible
 */
es.ContentView.prototype.render = function( offset ) {
	var rs = this.renderState;
	// Check if rendering is currently underway
	if ( rs.timeout !== undefined ) {
		// Cancel the active rendering process
		clearTimeout( rs.timeout );
		// Cleanup
		rs.$ruler.remove();
	}
	// Clear caches that were specific to the previous render
	this.widthCache = {};
	// In case of empty content model we still want to display empty with non-breaking space inside
	// This is very important for lists
	if(this.model.getContentLength() === 0) {
		var $line = $( '<div class="es-contentView-line" line-index="0">&nbsp;</div>' );
		this.$
			.children()
				.remove( '.es-contentView-line' )
				.end()
			.append( $line );
		this.lines = [{
			'text': ' ',
			'range': new es.Range( 0,0 ),
			'width': 0,
			'height': $line.outerHeight(),
			'wordOffset': 0,
			'fractional': false
		}];
		this.emit( 'update' );
		return;
	}
	/*
	 * Container measurement
	 * 
	 * To get an accurate measurement of the inside of the container, without having to deal with
	 * inconsistencies between browsers and box models, we can just create an element inside the
	 * container and measure it.
	 */
	rs.$ruler = $( '<div>&nbsp;</div>' ).appendTo( this.$ );
	rs.width = rs.$ruler.innerWidth();
	rs.ruler = rs.$ruler.addClass('es-contentView-ruler')[0];
	// Ignore offset optimization if the width has changed or the text has never been flowed before
	if (this.width !== rs.width) {
		offset = undefined;
	}
	this.width = rs.width;
	// Reset the render state
	if ( offset ) {
		var gap,
			currentLine = this.lines.length - 1;
		for ( var i = this.lines.length - 1; i >= 0; i-- ) {
			var line = this.lines[i];
			if ( line.range.start < offset && line.range.end > offset ) {
				currentLine = i;
			}
			if ( ( line.range.end < offset && !line.fractional ) || i === 0 ) {
				rs.line = i;
				rs.wordOffset = line.wordOffset;
				gap = currentLine - i;
				break;
			}
		}
		this.renderIteration( 2 + gap );
	} else {
		rs.line = 0;
		rs.wordOffset = 0;
		this.renderIteration( 3 );
	}
};

/**
 * Adds a line containing a given range of text to the end of the DOM and the "lines" array.
 * 
 * @method
 * @param {es.Range} range Range of data within content model to append
 * @param {Integer} start Beginning of text range for line
 * @param {Integer} end Ending of text range for line
 * @param {Integer} wordOffset Index within this.words which the line begins with
 * @param {Boolean} fractional If the line begins in the middle of a word
 */
es.ContentView.prototype.appendLine = function( range, wordOffset, fractional ) {
	var rs = this.renderState,
		$line = this.$.children( '[line-index=' + rs.line + ']' );
	if ( !$line.length ) {
		$line = $(
			'<div class="es-contentView-line" line-index="' + rs.line + '"></div>'
		);
		this.$.append( $line );
	}
	$line[0].innerHTML = this.getHtml( range );
	// Overwrite/append line information
	this.lines[rs.line] = {
		'text': this.model.getContentText( range ),
		'range': range,
		'width': $line.outerWidth(),
		'height': $line.outerHeight(),
		'wordOffset': wordOffset,
		'fractional': fractional
	};
	// Disable links within rendered content
	$line.find( '.es-contentView-format-object a' )
		.mousedown( function( e ) {
			e.preventDefault();
		} )
		.click( function( e ) {
			e.preventDefault();
		} );
	rs.line++;
};

/**
 * Gets the index of the boundary of last word that fits inside the line
 * 
 * The "words" and "boundaries" arrays provide linear access to the offsets around non-breakable
 * areas within the text. Using these, we can perform a binary-search for the best fit of words
 * within a line, just as we would with characters.
 * 
 * Results are given as an object containing both an index and a width, the later of which can be
 * used to detect when the first word was too long to fit on a line. In such cases the result will
 * contain the index of the boundary of the first word and it's width.
 * 
 * TODO: Because limit is most likely given as "words.length", it may be possible to improve the
 * efficiency of this code by making a best guess and working from there, rather than always
 * starting with [offset .. limit], which usually results in reducing the end position in all but
 * the last line, and in most cases more than 3 times, before changing directions.
 * 
 * @method
 * @param {es.Range} range Range of data within content model to try to fit
 * @param {HTMLElement} ruler Element to take measurements with
 * @param {Integer} width Maximum width to allow the line to extend to
 * @returns {Integer} Last index within "words" that contains a word that fits
 */
es.ContentView.prototype.fitWords = function( range, ruler, width ) {
	var offset = range.start,
		start = range.start,
		end = range.end,
		charOffset = this.boundaries[offset],
		middle,
		charMiddle,
		lineWidth,
		cacheKey;
	do {
		// Place "middle" directly in the center of "start" and "end"
		middle = Math.ceil( ( start + end ) / 2 );
		charMiddle = this.boundaries[middle];
		// Measure and cache width of substring
		cacheKey = charOffset + ':' + charMiddle;
		// Prepare the line for measurement using pre-escaped HTML
		ruler.innerHTML = this.getHtml( new es.Range( charOffset, charMiddle ) );
		// Test for over/under using width of the rendered line
		this.widthCache[cacheKey] = lineWidth = ruler.clientWidth;
		// Test for over/under using width of the rendered line
		if ( lineWidth > width ) {
			// Detect impossible fit (the first word won't fit by itself)
			if (middle - offset === 1) {
				start = middle;
				break;
			}
			// Words after "middle" won't fit
			end = middle - 1;
		} else {
			// Words before "middle" will fit
			start = middle;
		}
	} while ( start < end );
	// Check if we ended by moving end to the left of middle
	if ( end === middle - 1 ) {
		// A final measurement is required
		var charStart = this.boundaries[start];
		ruler.innerHTML = this.getHtml( new es.Range( charOffset, charStart ) );
		lineWidth = this.widthCache[charOffset + ':' + charStart] = ruler.clientWidth;
	}
	return { 'end': start, 'width': lineWidth };
};

/**
 * Gets the index of the boundary of the last character that fits inside the line
 * 
 * Results are given as an object containing both an index and a width, the later of which can be
 * used to detect when the first character was too long to fit on a line. In such cases the result
 * will contain the index of the first character and it's width.
 * 
 * @method
 * @param {es.Range} range Range of data within content model to try to fit
 * @param {HTMLElement} ruler Element to take measurements with
 * @param {Integer} width Maximum width to allow the line to extend to
 * @returns {Integer} Last index within "text" that contains a character that fits
 */
es.ContentView.prototype.fitCharacters = function( range, ruler, width ) {
	var offset = range.start,
		start = range.start,
		end = range.end,
		middle,
		lineWidth,
		cacheKey;
	do {
		// Place "middle" directly in the center of "start" and "end"
		middle = Math.ceil( ( start + end ) / 2 );
		// Measure and cache width of substring
		cacheKey = offset + ':' + middle;
		if ( cacheKey in this.widthCache ) {
			lineWidth = this.widthCache[cacheKey];
		} else {
			// Fill the line with a portion of the text, escaped as HTML
			ruler.innerHTML = this.getHtml( new es.Range( offset, middle ) );
			// Test for over/under using width of the rendered line
			this.widthCache[cacheKey] = lineWidth = ruler.clientWidth;
		}
		if ( lineWidth > width ) {
			// Detect impossible fit (the first character won't fit by itself)
			if (middle - offset === 1) {
				start = middle - 1;
				break;
			}
			// Words after "middle" won't fit
			end = middle - 1;
		} else {
			// Words before "middle" will fit
			start = middle;
		}
	} while ( start < end );
	// Check if we ended by moving end to the left of middle
	if ( end === middle - 1 ) {
		// Try for cache hit
		cacheKey = offset + ':' + start;
		if ( cacheKey in this.widthCache ) {
			lineWidth = this.widthCache[cacheKey];
		} else {
			// A final measurement is required
			ruler.innerHTML = this.getHtml( new es.Range( offset, start ) );
			lineWidth = this.widthCache[cacheKey] = ruler.clientWidth;
		}
	}
	return { 'end': start, 'width': lineWidth };
};

/**
 * Gets an HTML rendering of a range of data within content model.
 * 
 * @method
 * @param {es.Range} range Range of content to render
 * @param {String} Rendered HTML of data within content model
 */
es.ContentView.prototype.getHtml = function( range, options ) {
	if ( range ) {
		range.normalize();
	} else {
		range = { 'start': 0, 'end': undefined };
	}
	var data = this.contentCache.slice( range.start, range.end ),
		render = es.ContentView.renderAnnotation,
		htmlChars = es.ContentView.htmlCharacters;
	var out = '',
		left = '',
		right,
		leftPlain,
		rightPlain,
		stack = [],
		chr,
		i,
		j;
	for ( i = 0; i < data.length; i++ ) {
		right = data[i];
		leftPlain = typeof left === 'string';
		rightPlain = typeof right === 'string';
		if ( !leftPlain && rightPlain ) {
			// [formatted][plain] pair, close any annotations for left
			for ( j = 1; j < left.length; j++ ) {
				out += render( 'close', left[j], stack );
			}
		} else if ( leftPlain && !rightPlain ) {
			// [plain][formatted] pair, open any annotations for right
			for ( j = 1; j < right.length; j++ ) {
				out += render( 'open', right[j], stack );
			}
		} else if ( !leftPlain && !rightPlain ) {
			// [formatted][formatted] pair, open/close any differences
			for ( j = 1; j < left.length; j++ ) {
				if ( es.inArray( left[j], right ) === -1 ) {
					out += render( 'close', left[j], stack );
				}
			}
			for ( j = 1; j < right.length; j++ ) {
				if ( es.inArray( right[j], left ) === -1 ) {
					out += render( 'open', right[j], stack );
				}
			}
		}
		chr = rightPlain ? right : right[0];
		out += chr in htmlChars ? htmlChars[chr] : chr;
		left = right;
	}
	// Close all remaining tags at the end of the content
	if ( !rightPlain && right ) {
		for ( j = 1; j < right.length; j++ ) {
			out += render( 'close', right[j], stack );
		}
	}
	return out;
};

/* Inheritance */

es.extendClass( es.ContentView, es.EventEmitter );
/**
 * Creates an es.ContextView object.
 * 
 * @class
 * @constructor
 * @param {jQuery} $overlay DOM selection to add nodes to
 */
es.ContextView = function( surfaceView, $overlay ) {
	// Inheritance
	if ( !surfaceView ) {
		return;
	}

	// Properties
	this.surfaceView = surfaceView;
	this.surfaceView.attachContextView( this );
	this.inspectors = {};
	this.inspector = null;
	this.position = null;
	this.$ = $( '<div class="es-contextView"></div>' ).appendTo( $overlay || $( 'body' ) );
	this.$toolbar = $( '<div class="es-contextView-toolbar"></div>' );
	this.$inspectors = $( '<div class="es-contextView-inspectors"></div>' ).appendTo( this.$ );
	this.$icon = $( '<div class="es-contextView-icon"></div>' ).appendTo( this.$ );
	this.toolbarView = new es.ToolbarView(
		this.$toolbar,
		this.surfaceView,
		[{ 'name': 'textStyle', 'items' : [ 'strong', 'em', 'del', 'link', 'clear' ] }]
	);
	this.menuView = new es.MenuView( [
			// Example menu items
			{ 'name': 'tools', '$': this.$toolbar }
		],
		null,
		this.$
	);
	
	// Events
	var _this = this;
	this.$icon.bind( {
		'mousedown': function( e ) {
			if ( e.which === 1 ) {
				e.preventDefault();
				return false;
			}
		},
		'mouseup': function( e ) {
			if ( e.which === 1 ) {
				if ( _this.inspector ) {
					_this.closeInspector();
				} else {
					if ( _this.isMenuOpen() ) {
						_this.closeMenu();
					} else {
						_this.openMenu();
					}
				}
			}
		}
	} );

	// Intitialization
	this.addInspector( 'link', new es.LinkInspector( this.toolbarView, this ) );
};

/* Methods */

es.ContextView.prototype.getSurfaceView = function() {
	return this.surfaceView;
};

es.ContextView.prototype.openMenu = function() {
	this.menuView.open();
};

es.ContextView.prototype.closeMenu = function() {
	this.menuView.close();
};

es.ContextView.prototype.isMenuOpen = function() {
	return this.menuView.isOpen();
};

es.ContextView.prototype.set = function() {
	this.positionIcon();
	if ( this.position ) {
		this.positionOverlay( this.menuView.$ );
		if ( this.inspector ) {
			this.positionOverlay( this.inspectors[this.inspector].$ );
		}
	}
};

es.ContextView.prototype.positionIcon = function() {
	this.$.removeClass( 'es-contextView-position-start es-contextView-position-end' );
	var selection = this.surfaceView.getModel().getSelection(),
		offset;
	this.position = null;
	if ( selection.from < selection.to ) {
		var $lastRange = this.surfaceView.$.find( '.es-contentView-range:visible:last' );
		if ( $lastRange.length ) {
			offset = $lastRange.offset();
			this.position = new es.Position(
				offset.left + $lastRange.width(), offset.top + $lastRange.height()
			);
			this.$.addClass( 'es-contextView-position-end' );
		}
	} else if ( selection.from > selection.to ) {
		var $firstRange = this.surfaceView.$.find( '.es-contentView-range:visible:first' );
		if ( $firstRange.length ) {
			offset = $firstRange.offset();
			this.position = new es.Position( offset.left, offset.top );
			this.$.addClass( 'es-contextView-position-start' );
		}
	}
	if ( this.position ) {
		this.$.css( { 'left': this.position.left, 'top': this.position.top } );
		this.$icon.fadeIn( 'fast' );
	} else {
		this.$icon.hide();
	}
};

es.ContextView.prototype.positionOverlay = function( $overlay ) {
	this.$.removeClass( 'es-contextView-position-below es-contextView-position-above' );
	var overlayMargin = 5,
		overlayWidth = $overlay.outerWidth(),
		overlayHeight = $overlay.outerHeight(),
		$window = $( window ),
		windowWidth = $window.width(),
		windowHeight = $window.height(),
		windowScrollTop = $window.scrollTop();
	// Center align overlay
	var overlayLeft = -Math.round( overlayWidth / 2 );
	// Adjust overlay left or right depending on viewport
	if ( ( this.position.left - overlayMargin ) + overlayLeft < 0 ) {
		// Move right a bit past center
		overlayLeft -= this.position.left + overlayLeft - overlayMargin;
	} else if ( ( overlayMargin + this.position.left ) - overlayLeft > windowWidth ) {
		// Move left a bit past center
		overlayLeft += windowWidth - overlayMargin - ( this.position.left - overlayLeft );
	}
	$overlay.css( 'left', overlayLeft );
	// Position overlay on top or bottom depending on viewport
	if ( this.position.top + overlayHeight + ( overlayMargin * 2 ) < windowHeight + windowScrollTop ) {
		this.$.addClass( 'es-contextView-position-below' );
	} else {
		this.$.addClass( 'es-contextView-position-above' );
	}
};

es.ContextView.prototype.clear = function() {
	if ( this.inspector ) {
		this.closeInspector();
	}
	this.$icon.hide();
	this.menuView.close();
};

es.ContextView.prototype.openInspector = function( name ) {
	if ( !( name in this.inspectors ) ) {
		throw 'Missing inspector error. Can not open nonexistent inspector: ' + name;
	}
	this.inspectors[name].open();
	this.$inspectors.show();
	this.positionOverlay( this.inspectors[name].$ );
	this.inspector = name;
};

es.ContextView.prototype.closeInspector = function( accept ) {
	if ( this.inspector ) {
		this.inspectors[this.inspector].close( accept );
		this.$inspectors.hide();
		this.inspector = null;
	}
};

es.ContextView.prototype.getInspector = function( name ) {
	if ( name in this.inspectors ) {
		return this.inspectors[name];
	}
	return null;
};

es.ContextView.prototype.addInspector = function( name, inspector ) {
	if ( name in this.inspectors ) {
		throw 'Duplicate inspector error. Previous registration with the same name: ' + name;
	}
	this.inspectors[name] = inspector;
	this.$inspectors.append( inspector.$ );
};

es.ContextView.prototype.removeInspector = function( name ) {
	if ( name in this.inspectors ) {
		throw 'Missing inspector error. Can not remove nonexistent inspector: ' + name;
	}
	this.inspectors[name].detach();
	delete this.inspectors[name];
	this.inspector = null;
};
/**
 * Creates an es.DocumentView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewBranchNode}
 * @param {es.DocumentModel} documentModel Document model to view
 * @param {es.SurfaceView} surfaceView Surface view this view is a child of
 */
es.DocumentView = function( model, surfaceView ) {
	// Inheritance
	es.DocumentViewBranchNode.call( this, model );

	// Properties
	this.surfaceView = surfaceView;

	// DOM Changes
	this.$.addClass( 'es-documentView' );
};

/* Static Members */


/**
 * Mapping of symbolic names and splitting rules.
 * 
 * Each rule is an object with a self and children property. Each of these properties may contain
 * one of two possible values:
 *     Boolean - Whether a split is allowed
 *     Null - Node is a leaf, so there's nothing to split
 * 
 * @example Paragraph rules
 *     {
 *         'self': true
 *         'children': null
 *     }
 * @example List rules
 *     {
 *         'self': false,
 *         'children': true
 *     }
 * @example ListItem rules
 *     {
 *         'self': true,
 *         'children': false
 *     }
 */
es.DocumentView.splitRules = {};

/* Methods */

/**
 * Get the document offset of a position created from passed DOM event
 * 
 * @method
 * @param e {Event} Event to create es.Position from
 * @returns {Integer} Document offset
 */
es.DocumentView.prototype.getOffsetFromEvent = function( e ) {
	var position = es.Position.newFromEventPagePosition( e );
	return this.getOffsetFromRenderedPosition( position );
};

es.DocumentView.splitRules.document = {
	'self': false,
	'children': true
};

/* Inheritance */

es.extendClass( es.DocumentView, es.DocumentViewBranchNode );
/**
 * Creates an es.ParagraphView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewLeafNode}
 * @param {es.ParagraphModel} model Paragraph model to view
 */
es.ParagraphView = function( model ) {
	// Inheritance
	es.DocumentViewLeafNode.call( this, model );

	// DOM Changes
	this.$.addClass( 'es-paragraphView' );
};

/* Registration */

es.DocumentView.splitRules.paragraph = {
	'self': true,
	'children': null
};

/* Inheritance */

es.extendClass( es.ParagraphView, es.DocumentViewLeafNode );
/**
 * Creates an es.PreView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewLeafNode}
 * @param {es.PreModel} model Pre model to view
 */
es.PreView = function( model ) {
	// Inheritance
	es.DocumentViewLeafNode.call( this, model );

	// DOM Changes
	this.$.addClass( 'es-preView' );
};

/* Registration */

es.DocumentView.splitRules.pre = {
	'self': true,
	'children': null
};

/* Inheritance */

es.extendClass( es.PreView, es.DocumentViewLeafNode );
/**
 * Creates an es.ListView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewBranchNode}
 * @param {es.ListModel} model List model to view
 */
es.ListView = function( model ) {
	// Inheritance
	es.DocumentViewBranchNode.call( this, model );

	// DOM Changes
	this.$.addClass( 'es-listView' );

	// Events
	var _this = this;
	this.model.on( 'update', function() {
		_this.enumerate();
	} );

	// Initialization
	this.enumerate();
};

/* Methods */

/**
 * Set the number labels of all ordered list items.
 * 
 * @method
 */
es.ListView.prototype.enumerate = function() {
	var styles,
		levels = [];
	for ( var i = 0; i < this.children.length; i++ ) {
		styles = this.children[i].model.getElementAttribute( 'styles' );
		levels = levels.slice( 0, styles.length );
		if ( styles[styles.length - 1] === 'number' ) {
			if ( !levels[styles.length - 1] ) {
				levels[styles.length - 1] = 0;
			}
			this.children[i].$icon.text( ++levels[styles.length - 1] + '.' );
		} else {
			this.children[i].$icon.text( '' );
			if ( levels[styles.length - 1] ) {
				levels[styles.length - 1] = 0;
			}
		}
	}
};

/* Registration */

es.DocumentView.splitRules.list = {
	'self': false,
	'children': true
};

/* Inheritance */

es.extendClass( es.ListView, es.DocumentViewBranchNode );
/**
 * Creates an es.MenuView object.
 * 
 * @class
 * @constructor
 * @param {Object[]} items List of items to append initially
 * @param {Function} callback Function to call if an item doesn't have it's own callback
 * @param {jQuery} [$overlay=$( 'body' )] DOM selection to add nodes to
 */
es.MenuView = function( items, callback, $overlay ) {
	// Properties
	this.$ = $( '<div class="es-menuView"></div>' ).appendTo( $overlay || $( 'body' ) );
	this.items = [];
	this.autoNamedBreaks = 0;
	this.callback = callback;

	// Items
	if ( es.isArray( items ) ) {
		for ( var i = 0; i < items.length; i++ ) {
			this.addItem( items[i] );
		}
	}

	// Events
	var _this = this;
	this.$.bind( {
		'mousedown': function( e ) {
			if ( e.which === 1 ) {
				e.preventDefault();
				return false;
			}
		},
		'mouseup': function( e ) {
			if ( e.which === 1 ) {
				var $item = $( e.target ).closest( '.es-menuView-item' );
				if ( $item.length ) {
					var name = $item.attr( 'rel' );
					for ( var i = 0; i < _this.items.length; i++ ) {
						if ( _this.items[i].name === name ) {
							_this.onSelect( _this.items[i], e );
							return true;
						}
					}
				}
			}
		}
	} );
};

/* Methods */

es.MenuView.prototype.addItem = function( item, before ) {
	if ( item === '-' ) {
		item = {
			'name': 'break-' + this.autoNamedBreaks++
		};
	}
	// Items that don't have custom DOM elements will be auto-created
	if ( !item.$ ) {
		if ( !item.name ) {
			throw 'Invalid menu item error. Items must have a name property.';
		}
		if ( item.label ) {
			item.$ = $( '<div class="es-menuView-item"></div>' )
				.attr( 'rel', item.name )
				// TODO: i18n time!
				.append( $( '<span></span>' ).text( item.label ) );
		} else {
			// No label, must be a break
			item.$ = $( '<div class="es-menuView-break"></div>' )
				.attr( 'rel', item.name );
		}
		// TODO: Keyboard shortcut (and icons for them), support for keyboard accelerators, etc.
	}
	if ( before ) {
		for ( var i = 0; i < this.items.length; i++ ) {
			if ( this.items[i].name === before ) {
				this.items.splice( i, 0, item );
				this.items[i].$.before( item.$ );
				return;
			}
		}
	}
	this.items.push( item );
	this.$.append( item.$ );
};

es.MenuView.prototype.removeItem = function( name ) {
	for ( var i = 0; i < this.items.length; i++ ) {
		if ( this.items[i].name === name ) {
			this.items.splice( i, 1 );
			i--;
		}
	}
};

es.MenuView.prototype.getItems = function() {
	return this.items;
};

es.MenuView.prototype.setPosition = function( position ) {
	return this.$.css( { 'top': position.top, 'left': position.left } );
};

es.MenuView.prototype.open = function() {
	this.$.show();
};

es.MenuView.prototype.close = function() {
	this.$.hide();
};

es.MenuView.prototype.isOpen = function() {
	return this.$.is( ':visible' );
};

es.MenuView.prototype.onSelect = function( item, event ) {
	if ( typeof item.callback === 'function' ) {
		item.callback( item );
	} else if ( typeof this.callback === 'function' ) {
		this.callback( item );
	}
	this.close();
};
/**
 * Creates an es.ListItemView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewLeafNode}
 * @param {es.ListItemModel} model List item model to view
 */
es.ListItemView = function( model ) {
	// Inheritance
	es.DocumentViewBranchNode.call( this, model );

	// Properties
	this.$icon = $( '<div class="es-listItemView-icon"></div>' ).prependTo( this.$ );
	this.currentStylesHash = null;
	
	// DOM Changes
	this.$.addClass( 'es-listItemView' );

	// Events
	var _this = this;
	this.model.on( 'update', function() {
		_this.setClasses();
	} );

	// Initialization
	this.setClasses();
};

/* Methods */

es.ListItemView.prototype.setClasses = function() {
	var styles = this.model.getElementAttribute( 'styles' ),
		stylesHash = styles.join( '|' );
	if ( this.currentStylesHash !== stylesHash ) {
		this.currentStylesHash = stylesHash;
		var classes = this.$.attr( 'class' );
		this.$
			// Remove any existing level classes
			.attr(
				'class',
				classes
					.replace( / ?es-listItemView-level[0-9]+/, '' )
					.replace( / ?es-listItemView-(bullet|number|term|definition)/, '' )
			)
			// Set the list style class from the style on top of the stack
			.addClass( 'es-listItemView-' + styles[styles.length - 1] )
			// Set the list level class from the length of the stack
			.addClass( 'es-listItemView-level' + ( styles.length - 1 ) );
	}
};

/* Registration */

es.DocumentView.splitRules.listItem = {
	'self': true,
	'children': false
};

/* Inheritance */

es.extendClass( es.ListItemView, es.DocumentViewBranchNode );
/**
 * Creates an es.TableView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewBranchNode}
 * @param {es.TableModel} model Table model to view
 */
es.TableView = function( model ) {
	// Inheritance
	es.DocumentViewBranchNode.call( this, model, $( '<table>' ) );
	
	// DOM Changes
	this.$
		.attr( 'style', model.getElementAttribute( 'html/style' ) )
		.addClass( 'es-tableView' );
};

/* Registration */

es.DocumentView.splitRules.table = {
	'self': false,
	'children': false
};

/* Inheritance */

es.extendClass( es.TableView, es.DocumentViewBranchNode );
/**
 * Creates an es.TableRowView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewBranchNode}
 * @param {es.TableRowModel} model Table row model to view
 */
es.TableRowView = function( model ) {
	// Inheritance
	es.DocumentViewBranchNode.call( this, model, $( '<tr>' ), true );
	
	// DOM Changes
	this.$
		.attr( 'style', model.getElementAttribute( 'html/style' ) )
		.addClass( 'es-tableRowView' );
};

/* Registration */

es.DocumentView.splitRules.tableRow = {
	'self': false,
	'children': false
};

/* Inheritance */

es.extendClass( es.TableRowView, es.DocumentViewBranchNode );
/**
 * Creates an es.TableCellView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewBranchNode}
 * @param {es.TableCellModel} model Table cell model to view
 */
es.TableCellView = function( model ) {
	// Inheritance
	es.DocumentViewBranchNode.call( this, model, $( '<td>' ) );

	// DOM Changes
	this.$
		.attr( 'style', model.getElementAttribute( 'html/style' ) )
		.addClass( 'es-tableCellView' );
};

/* Registration */

es.DocumentView.splitRules.tableCell = {
	'self': false,
	'children': true
};

/* Inheritance */

es.extendClass( es.TableCellView, es.DocumentViewBranchNode );
/**
 * Creates an es.HeadingView object.
 * 
 * @class
 * @constructor
 * @extends {es.DocumentViewLeafNode}
 * @param {es.HeadingModel} model Heading model to view
 */
es.HeadingView = function( model ) {
	// Inheritance
	es.DocumentViewLeafNode.call( this, model );

	// Properties
	this.currentLevelHash = null;

	// DOM Changes
	this.$.addClass( 'es-headingView' );

	// Events
	var _this = this;
	this.model.on( 'update', function() {
		_this.setClasses();
	} );

	// Initialization
	this.setClasses();
};

/* Methods */

es.HeadingView.prototype.setClasses = function() {
	var level = this.model.getElementAttribute( 'level' );
	if ( level !== this.currentLevelHash ) {
		this.currentLevelHash = level;
		var classes = this.$.attr( 'class' );
		this.$
			// Remove any existing level classes
			.attr( 'class', classes.replace( / ?es-headingView-level[0-9]+/, '' ) )
			// Add a new level class
			.addClass( 'es-headingView-level' + level );
	}
};

/* Registration */

es.DocumentView.splitRules.heading = {
	'self': true,
	'children': null
};

/* Inheritance */

es.extendClass( es.HeadingView, es.DocumentViewLeafNode );
