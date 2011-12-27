$(document).ready( function() {
	var wikidoms = {
		'Wikipedia article': {
			'type': 'document',
			'children': [
				{
					'type': 'heading',
					'attributes': { 'level': 1 },
					'content': { 'text': 'Direct manipulation interface' }
				},
				{
					'type': 'paragraph',
					'content': {
						'text': 'In computer science, direct manipulation is a human-computer interaction style which involves continuous representation of objects of interest, and rapid, reversible, incremental actions and feedback. The intention is to allow a user to directly manipulate objects presented to them, using actions that correspond at least loosely to the physical world. An example of direct-manipulation is resizing a graphical shape, such as a rectangle, by dragging its corners or edges with a mouse.',
						'annotations': [
							{
								'type': 'link/internal',
								'data': {
									'title': 'Computer_science'
								},
								'range': {
									'start': 3,
									'end': 19
								}
							},
							{
								'type': 'link/internal',
								'data': {
									'title': 'Human-computer interaction'
								},
								'range': {
									'start': 46,
									'end': 72
								}
							}
						]
					}
				}
			]
		}
	};
	window.documentModel = es.DocumentModel.newFromPlainObject( wikidoms['Wikipedia article'] );
	window.surfaceModel = new es.SurfaceModel( window.documentModel );
	window.surfaceView = new es.SurfaceView( $( '#es-editor' ), window.surfaceModel );
	window.toolbarView = new es.ToolbarView( $( '#es-toolbar' ), window.surfaceView );
	window.contextView = new es.ContextView( window.surfaceView );
	window.surfaceModel.select( new es.Range( 1, 1 ) );

	/*
	 * This code is responsible for switching toolbar into floating mode when scrolling (with
	 * keyboard or mouse).
	 */
	var $toolbarWrapper = $( '#es-toolbar-wrapper' ),
		$toolbar = $( '#es-toolbar' ),
		$window = $( window );
	$window.scroll( function() {
		var toolbarWrapperOffset = $toolbarWrapper.offset();
		if ( $window.scrollTop() > toolbarWrapperOffset.top ) {
			if ( !$toolbarWrapper.hasClass( 'float' ) ) {
				var	left = toolbarWrapperOffset.left,
					right = $window.width() - $toolbarWrapper.outerWidth() - left;
				$toolbarWrapper.css( 'height', $toolbarWrapper.height() ).addClass( 'float' );
				$toolbar.css( { 'left': left, 'right': right } );
			}
		} else {
			if ( $toolbarWrapper.hasClass( 'float' ) ) {
				$toolbarWrapper.css( 'height', 'auto' ).removeClass( 'float' );
				$toolbar.css( { 'left': 0, 'right': 0 } );
			}
		}
	} );

	var $modeButtons = $( '.es-modes-button' ),
		$panels = $( '.es-panel' ),
		$base = $( '#es-base' ),
		currentMode = null,
		modes = {
			'wikitext': {
				'$': $( '#es-mode-wikitext' ),
				'$panel': $( '#es-panel-wikitext' ),
				'update': function() {
					this.$panel.text(
						es.WikitextSerializer.stringify( documentModel.getPlainObject() )
					);
				}
			},
			'json': {
				'$': $( '#es-mode-json' ),
				'$panel': $( '#es-panel-json' ),
				'update': function() {
					this.$panel.text( es.JsonSerializer.stringify( documentModel.getPlainObject(), {
						'indentWith': '  '
					} ) );
				}
			},
			'html': {
				'$': $( '#es-mode-html' ),
				'$panel': $( '#es-panel-html' ),
				'update': function() {
					this.$panel.text(
						es.HtmlSerializer.stringify( documentModel.getPlainObject() )
					);
				}
			},
			'render': {
				'$': $( '#es-mode-render' ),
				'$panel': $( '#es-panel-render' ),
				'update': function() {
					this.$panel.html(
						es.HtmlSerializer.stringify( documentModel.getPlainObject() )
					);
				}
			},
			'history': {
				'$': $( '#es-mode-history' ),
				'$panel': $( '#es-panel-history' ),
				'update': function() {
					var	history = surfaceModel.getHistory(),
						i = history.length,
						end = Math.max( 0, i - 25 ),
						j,
						k,
						ops,
						events = '',
						z = 0,
						operations;
						
					while ( --i >= end ) {
						z++;
						operations = [];
						for ( j = 0; j < history[i].stack.length; j++) {
							ops = history[i].stack[j].getOperations().slice(0);
							for ( k = 0; k < ops.length; k++ ) {
								data = ops[k].data || ops[k].length;
								if ( es.isArray( data ) ) {
									data = data[0];
									if ( es.isArray( data ) ) {
										data = data[0];
									}
								}
								if ( typeof data !== 'string' && typeof data !== 'number' ) {
									data = '-';
								}
								ops[k] = ops[k].type.substr( 0, 3 ) + '(' + data + ')';
							}
							operations.push('[' + ops.join( ', ' ) + ']');
						}
						events += '<div' + (z === surfaceModel.undoIndex ? ' class="es-panel-history-active"' : '') + '>' + operations.join(', ') + '</div>';
					}
					
					this.$panel.html( events );
				}
			},
			'help': {
				'$': $( '#es-mode-help' ),
				'$panel': $( '#es-panel-help' ),
				'update': function() {}
			}
		};
	$.each( modes, function( name, mode ) {
		mode.$.click( function() {
			var disable = $(this).hasClass( 'es-modes-button-down' );
			var visible = $base.hasClass( 'es-showData' );
			$modeButtons.removeClass( 'es-modes-button-down' );
			$panels.hide();
			if ( disable ) {
				if ( visible ) {
					$base.removeClass( 'es-showData' );
					$window.resize();
				}
				currentMode = null;
			} else {
				$(this).addClass( 'es-modes-button-down' );
				mode.$panel.show();
				if ( !visible ) {
					$base.addClass( 'es-showData' );
					$window.resize();
				}
				mode.update.call( mode );
				currentMode = mode;
			}
		} );
	} );

	var $docsList = $( '#es-docs-list' );
	$.each( wikidoms, function( title, wikidom ) {
		$docsList.append(
			$( '<li class="es-docs-listItem"></li>' )
				.append(
					$( '<a href="#"></a>' )
						.text( title )
						.click( function() {
							var newDocumentModel = es.DocumentModel.newFromPlainObject( wikidom );
							documentModel.data.splice( 0, documentModel.data.length );
							es.insertIntoArray( documentModel.data, 0, newDocumentModel.data );
							surfaceModel.select( new es.Range( 1, 1 ) );
							documentModel.splice.apply(
								documentModel,
								[0, documentModel.getChildren().length]
									.concat( newDocumentModel.getChildren() )
							);
							surfaceModel.purgeHistory();
							
							if ( currentMode ) {
								currentMode.update.call( currentMode );
							}
							return false;
						} )
				)
		);
	} );

	surfaceModel.on( 'transact', function() {
		if ( currentMode ) {
			currentMode.update.call( currentMode );
		}
	} );
	surfaceModel.on( 'select', function() {
		if ( currentMode === modes.history ) {
			currentMode.update.call( currentMode );
		}
	} );

	$( '#es-docs' ).css( { 'visibility': 'visible' } );
	$( '#es-base' ).css( { 'visibility': 'visible' } );
} );
