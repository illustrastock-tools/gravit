(function (_) {
    /**
     * An editor for a text
     * @param {GText} text the text this editor works on
     * @class GTextEditor
     * @extends GShapeEditor
     * @constructor
     */
    function GTextEditor(rectangle) {
        GShapeEditor.call(this, rectangle);
        this._flags |= GBlockEditor.Flag.ResizeAll;
    };
    GObject.inherit(GTextEditor, GShapeEditor);
    GElementEditor.exports(GTextEditor, GText);

    // -----------------------------------------------------------------------------------------------------------------
    // GTextEditor Class
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * @type {HTMLDivElement}
     * @private
     */
    GTextEditor.prototype._inlineEditor = null;

    /**
     * Visual box to be displayed while inline editing
     * @type {GRect}
     * @private
     */
    GTextEditor.prototype._inlineEditBBox = null;

    /**
     * Get a property value
     * @param {String} property the property to get a value for
     * @param {Boolean} [computed] whether to use computed value (defaults to false)
     * @returns {*}
     */
    GTextEditor.prototype.getProperty = function (property, computed) {
        if (this.isInlineEdit()) {
            var activeParagraph = null;
            var activeSpan = null;

            var sel = rangy.getSelection();
            if (sel.rangeCount) {
                var range = sel.getRangeAt(0);
                var nodes = range.collapsed ? [range.startContainer] : range.getNodes();
                for (var i = 0; i < nodes.length; ++i) {
                    var node = nodes[i];
                    if (node.nodeType === 3) {
                        for (var parent = node.parentNode; parent !== null; parent = parent.parentNode) {
                            if (parent.nodeType === 1) {
                                if (parent.nodeName.toLowerCase() === 'p') {
                                    if (!activeParagraph) {
                                        activeParagraph = parent;
                                    }
                                } else if (parent.nodeName.toLowerCase() === 'span') {
                                    if (!activeSpan && !range.collapsed) {
                                        activeSpan = parent;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (GStylable.PropertySetInfo[GStylable.PropertySet.Text].geometryProperties.hasOwnProperty(property)) {
                if (activeSpan) {
                    return GText.Block.cssToProperty(property, computed ? window.getComputedStyle(activeSpan) : activeSpan.style);
                } else if (activeParagraph) {
                    return GText.Block.cssToProperty(property, computed ? window.getComputedStyle(activeParagraph) : activeParagraph.style);
                } else {
                    return this.getElement().getProperty(property);
                }
            } else if (GStylable.PropertySetInfo[GStylable.PropertySet.Paragraph].geometryProperties.hasOwnProperty(property)) {
                if (activeParagraph) {
                    return GText.Paragraph.cssToProperty(property, computed ? window.getComputedStyle(activeParagraph) : activeParagraph.style);
                } else {
                    return this.getElement().getProperty(property);
                }
            }
        } else {
            return this.getElement().getProperty(property);
        }
    };

    GTextEditor.prototype.setProperties = function (properties, values) {
        var textProperties = [];
        var textValues = [];
        var blockProperties = [];
        var blockValues = [];
        var paragraphProperties = [];
        var paragraphValues = [];

        // Separate text, block and paragraph properties
        for (var i = 0; i < properties.length; ++i) {
            if (GText.GeometryProperties.hasOwnProperty(properties[i])) {
                textProperties.push(properties[i]);
                textValues.push(values[i]);
            } else if (GStylable.PropertySetInfo[GStylable.PropertySet.Text].geometryProperties.hasOwnProperty(properties[i]) ||
                properties[i] === '_fc') {

                blockProperties.push(properties[i]);
                blockValues.push(values[i]);
            } else {
                paragraphProperties.push(properties[i]);
                paragraphValues.push(values[i]);
            }
        }

        if (this.isInlineEdit()) {
            setTimeout(function () {
                var blockCSS = {};
                for (var i = 0; i < blockProperties.length; ++i) {
                    GText.Block.propertyToCss(blockProperties[i], blockValues[i], blockCSS);
                }

                var paragraphCSS = {};
                for (var i = 0; i < paragraphProperties.length; ++i) {
                    GText.Paragraph.propertyToCss(paragraphProperties[i], paragraphValues[i], paragraphCSS);
                }

                this._inlineEditor.focus();
                if (this._savedSelection) {
                    rangy.restoreSelection(this._savedSelection);
                    this._savedSelection = rangy.saveSelection();
                }

                var sel = rangy.getSelection();
                if (sel.rangeCount) {
                    var range = sel.getRangeAt(0);
                    var nodes = range.collapsed ? [range.startContainer] : range.getNodes();
                    for (var i = 0; i < nodes.length; ++i) {
                        var node = nodes[i];
                        if (node.nodeType === 3) {
                            // Find topmost paragraph
                            for (var parent = node.parentNode; parent !== null; parent = parent.parentNode) {
                                if (parent.nodeType === 1 && parent.nodeName.toLowerCase() === 'p') {
                                    // Assign paragraph properties
                                    for (var prop in paragraphCSS) {
                                        parent.style[prop] = paragraphCSS[prop];
                                    }

                                    // Assign block properties if selection is collapsed
                                    if (sel.isCollapsed) {
                                        for (var prop in blockCSS) {
                                            parent.style[prop] = blockCSS[prop];
                                        }
                                    }

                                    break;
                                } else if (parent.nodeType === 1 && parent.nodeName.toLowerCase() === 'span') {
                                    if ((parent.childNodes.length - parent.children.length) == 1) {
                                        for (var prop in blockCSS) {
                                            parent.style[prop] = blockCSS[prop];
                                        }
                                    } else {
                                        var parParent = parent.parentNode;
                                        if (parParent) {
                                            var el = null;
                                            for (var i = parent.childNodes.length; i > 0; --i) {
                                                var child = parent.childNodes[i - 1];
                                                if (child.nodeType === 3) {
                                                    if (child !== node) {
                                                        if (!el) {
                                                            el = document.createElement('span');
                                                            el.style.cssText = parent.style.cssText;
                                                        }
                                                        $(el).prepend(child);
                                                        if (i === 1) {
                                                            parParent.insertBefore(el, parent.nextSibling);
                                                            el = null;
                                                        }
                                                    } else { //if (child === node) {
                                                        if (el) {
                                                            parParent.insertBefore(el, parent.nextSibling);
                                                        }
                                                        el = document.createElement('span');
                                                        el.style.cssText = parent.style.cssText;
                                                        $(el).prepend(child);
                                                        for (var prop in blockCSS) {
                                                            el.style[prop] = blockCSS[prop];
                                                        }
                                                        parParent.insertBefore(el, parent.nextSibling);
                                                        el = null;
                                                    }
                                                } else {
                                                    if (el) {
                                                        parParent.insertBefore(el, parent.nextSibling);
                                                        el = null;
                                                    }
                                                    parParent.insertBefore(child, parent.nextSibling);
                                                }
                                            }
                                            var newParent = parent.nextSibling;
                                            parParent.removeChild(parent);
                                            parent = newParent;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Trigger selection changed event to update everything
                this._triggerSelectionChanged();
            }.bind(this), 0);
        } else {
            // Apply to outer element
            this.getElement().setProperties(blockProperties, blockValues);
            this.getElement().setProperties(paragraphProperties, paragraphValues);
        }

        // Apply text properties if any
        if (textProperties.length > 0) {
            this.getElement().setProperties(textProperties, textValues);
        }
    };

    /** @override */
    GTextEditor.prototype.initialSetup = function () {
        var element = this.getElement();
        var defStyle = element.getWorkspace().getStyles().querySingle('style[_sdf="text"]');
        if (defStyle) {
            element.assignStyleFrom(defStyle);
        }
    };

    /** @override */
    GTextEditor.prototype.createElementPreview = function () {
        if (!this._elementPreview) {
            var imageSourceBBox = this._element.getSourceBBox();
            // Create a rectangle instead of a text for the preview
            this._elementPreview = new GRectangle(imageSourceBBox.getX(), imageSourceBBox.getY(), imageSourceBBox.getWidth(), imageSourceBBox.getHeight());
            this._elementPreview.transferProperties(this._element, [GShape.GeometryProperties]);
        }
    };

    /** @override */
    GTextEditor.prototype.canApplyTransform = function () {
        return this._elementPreview || GShapeEditor.prototype.canApplyTransform.call(this);
    };

    /** @override */
    GTextEditor.prototype.applyTransform = function (element) {
        if (element && this._elementPreview) {
            element.transferProperties(this._elementPreview, [GShape.GeometryProperties]);
            this.resetTransform();
        } else {
            GShapeEditor.prototype.applyTransform.call(this, element);
        }
    };

    /** @override */
    GTextEditor.prototype.applyPartMove = function (partId, partData) {
        if (partId === GBlockEditor.RESIZE_HANDLE_PART_ID) {
            if (!this.canApplyTransform()) {
                // Reset editor transformation
                this.resetTransform();
            } else {
                if (this._element && this._elementPreview) {
                    var resizeTrf = this._elementPreview.getProperty('trf');
                    var trf = this._element.getProperty('trf');
                    if (resizeTrf && trf) {
                        var itrf = trf.inverted();
                        if (itrf) {
                            resizeTrf = resizeTrf.multiplied(itrf);
                        }
                    }

                    this._element.beginUpdate();
                    this._element.transformSourceBBox(resizeTrf);
                    if (partData.side !== GRect.Side.RIGHT_CENTER && partData.side !== GRect.Side.LEFT_CENTER &&
                        this._element.getProperty('ah')) {

                        this._element.setProperty('ah', false);
                    }
                    if (partData.side !== GRect.Side.TOP_CENTER && partData.side !== GRect.Side.BOTTOM_CENTER &&
                        this._element.getProperty('aw')) {

                        this._element.setProperty('aw', false);
                    }
                    this._element.endUpdate();
                    this.resetTransform();
                } else {
                    GShapeEditor.prototype.applyTransform.call(this, this._element);
                }
            }
        }
        GElementEditor.prototype.applyPartMove.call(this, partId, partData);
    };

    /** @override */
    GTextEditor.prototype.canInlineEdit = function () {
        return true;
    };

    /** @override */
    GTextEditor.prototype.isInlineEdit = function () {
        return this._inlineEditor !== null;
    };

    /** @override */
    GTextEditor.prototype.beginInlineEdit = function (view, container) {
        this._inlineEditBBox = this._getInlineEditBBox();

        // Remove size handles and hide our text element
        this.removeFlag(GBlockEditor.Flag.ResizeAll);
        this.getElement().setFlag(GElement.Flag.NoPaint);
        var html = this.getElement().asHtml();

        this._inlineEditor = $($('<div></div>'))
            .css(this.getElement().getContent().propertiesToCss({}))
            .css({
                'position': 'absolute',
                'background': 'transparent',
                'transform-origin': '0% 0%',
                '-webkit-transform-origin': '0% 0%',
                'min-width': '1em',
                'min-height': '1em'
            })
            .attr('contenteditable', 'true')
            .on('mousedown', function (evt) {
                evt.stopPropagation();
            })
            .on('mouseup', function (evt) {
                evt.stopPropagation();
                if (this._savedSelection) {
                    rangy.removeMarkers(this._savedSelection);
                }
                this._savedSelection = rangy.saveSelection();

                this._activeParagraphElement = null;
                var sel = rangy.getSelection();
                if (sel.rangeCount) {
                    var range = sel.getRangeAt(0);
                    var nodes = range.collapsed ? [range.endContainer] : range.getNodes();
                    for (var i = 0; i < nodes.length; ++i) {
                        var node = nodes[i];
                        if (node.nodeType === 3) {
                            var blockElement = null;
                            for (var parent = node.parentNode; parent !== null; parent = parent.parentNode) {
                                if (parent.nodeType === 1 && parent.nodeName.toLowerCase() === 'p') {
                                    blockElement = parent;
                                    break;
                                }
                            }

                            if (blockElement) {
                                this._activeParagraphElement = blockElement;
                            }
                        }
                    }
                }

                this._triggerSelectionChanged();
            }.bind(this))
            .on('click', function (evt) {
                evt.stopPropagation();
            })
            .on('dblclick', function (evt) {
                evt.stopPropagation();
            })
            .on('keydown', function (evt) {
                evt.stopPropagation();
            })
            .on('keyup', function (evt) {
                evt.stopPropagation();
                if (this._savedSelection) {
                    rangy.removeMarkers(this._savedSelection);
                }
                this._savedSelection = rangy.saveSelection();
            }.bind(this))
            .html(html)
            .appendTo(container);

        this._inlineEditor.focus();

        if (html === "") {
            var pTag = document.createElement('p');
            var sTag = document.createElement('span');
            $(sTag).text('Your Text Here');
            $(pTag).append(sTag);
            this._inlineEditor.append(pTag);

            var range = rangy.createRange();
            range.selectNodeContents(sTag);
            var sel = rangy.getSelection();
            sel.setSingleRange(range);
        }
    };

    /** @override */
    GTextEditor.prototype.adjustInlineEditForView = function (view, position) {
        var sceneBBox = this._getInlineEditBBox();
        var viewBBox = view.getWorldTransform().mapRect(sceneBBox);
        var left = viewBBox.getX();
        var top = Math.floor(viewBBox.getY()) + 1;

        var width = '';
        var height = '';
        if (this.getElement().getProperty('aw') === false && sceneBBox.getWidth() > 0) {
            width = sceneBBox.getWidth() + 'px';
        }
        if (this.getElement().getProperty('ah') === false && sceneBBox.getHeight() > 0) {
            height = sceneBBox.getHeight() + 'px';
        }

        var parentOffset = this._inlineEditor.parent().offset();
        if (parentOffset && parentOffset.top) {
            top += parentOffset.top;
        }
        if (parentOffset && parentOffset.left) {
            left += parentOffset.left;
        }

        this._inlineEditor
            .css({
                'width': width,
                'height': height,
                'transform': 'scale(' + view.getZoom() + ')',
                '-webkit-transform': 'scale(' + view.getZoom() + ')'
            })
            .offset({top: top, left: left});

        if (position) {
            this.createSelectionFromPosition(position);
        }
    };

    /**
     * Creates a selection and/or sets the caret position by given screen coordinates
     * @param {GPoint} startPos the start position in screen coordinates
     * @param {GPoint} [endPos] the end position in screen coordinates. If not provided
     * will not create a selection but set the caret position only. Defaults to null.
     */
    GTextEditor.prototype.createSelectionFromPosition = function (startPos, endPos) {
        var doc = document;
        var range = null;
        if (typeof doc.caretPositionFromPoint != "undefined") {
            range = doc.createRange();
            var start = doc.caretPositionFromPoint(startPos.getX(), startPos.getY());
            range.setStart(start.offsetNode, start.offset);

            if (endPos) {
                var end = doc.caretPositionFromPoint(endPos.getX(), endPos.getY());
                range.setEnd(end.offsetNode, end.offset);
            }
        } else if (typeof doc.caretRangeFromPoint != "undefined") {
            range = doc.createRange();
            var start = doc.caretRangeFromPoint(startPos.getX(), startPos.getY());
            range.setStart(start.startContainer, start.startOffset);

            if (endPos) {
                var end = doc.caretRangeFromPoint(endX, endY);
                range.setEnd(endPos.getX(), endPos.getY());
            }
        }

        if (range !== null && typeof window.getSelection != "undefined") {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof doc.body.createTextRange != "undefined") {
            range = doc.body.createTextRange();
            range.moveToPoint(startPos.getX(), startPos.getY());

            if (endPos) {
                var endRange = range.duplicate();
                endRange.moveToPoint(endPos.getX(), endPos.getY());
                range.setEndPoint("EndToEnd", endRange);
            }
            range.select();
        }
    };

    /** @override */
    GTextEditor.prototype.finishInlineEdit = function () {
        if (this._savedSelection) {
            rangy.removeMarkers(this._savedSelection);
            this._savedSelection = null;
        }

        var html = this._inlineEditor.html();

        this.getElement().fromHtml(html);
        this._inlineEditor.remove();
        this._inlineEditor = null;

        this._inlineEditBBox = null;
        // Show size handles and our text element
        this.setFlag(GBlockEditor.Flag.ResizeAll);
        this.getElement().removeFlag(GElement.Flag.NoPaint);

        // TODO : I18N
        return 'Modify Text Content';
    };

    /**
     * Special handler for mouse double click on text box part Ids
     * @param {*} [partId] id of the clicked part
     * @param {{*}} [partData] dictionary of clicked part data
     */
    GTextEditor.prototype.handlePartDblClick = function (partId, partData) {
        if (partId === GBlockEditor.RESIZE_HANDLE_PART_ID) {
            if (partData.side === GRect.Side.RIGHT_CENTER) {
                this._element.setProperty('aw', !this._element.getProperty('aw'));
            } else if (partData.side === GRect.Side.BOTTOM_CENTER) {
                this._element.setProperty('ah', !this._element.getProperty('ah'));
            }
        }
    };

    /** @override */
    GTextEditor.prototype._paintHandles = function (transform, context) {
        this._iterateResizeHandles(function (point, side) {
            var handleSelected = false;
            if (side === GRect.Side.RIGHT_CENTER && this._element.getProperty('aw') ||
                side === GRect.Side.BOTTOM_CENTER && this._element.getProperty('ah')) {

                handleSelected = true;
            }
            this._paintAnnotation(context, transform, point, GElementEditor.Annotation.Rectangle, handleSelected, true);
        }.bind(this), transform);
    };

    GTextEditor.prototype._getInlineEditBBox = function () {
        if (!this._inlineEditBBox) {
            var sourceBBox = this.getElement().getSourceBBox();
            var geomBBox = this.getElement().getGeometryBBox();
            this._inlineEditBBox = new GRect(geomBBox.getX(), geomBBox.getY(), sourceBBox.getWidth(), sourceBBox.getHeight());
        }
        return this._inlineEditBBox;
    };

    /** @override */
    GTextEditor.prototype._paintOutline = function (transform, context, paintBBox, color) {
        if (this._inlineEditBBox) {
            var vertices = null;
            var transformedQuadrilateral = transform.mapQuadrilateral(this._inlineEditBBox);

            if (transformedQuadrilateral && transformedQuadrilateral.length) {
                vertices = transformedQuadrilateral.map(function (point) {
                    return new GPoint(Math.floor(point.getX()) + 0.5, Math.floor(point.getY()) + 0.5)
                });
             }

            if (vertices) {
                context.canvas.putVertices(vertices, true /* make Closed */);

                // Paint either outlined or highlighted (highlighted has a higher precedence)
                context.canvas.strokeVertices(
                    color ? color :
                        (this.hasFlag(GElementEditor.Flag.Highlighted) ? context.highlightOutlineColor :
                            context.selectionOutlineColor),
                    1);
            }
        } else {
            GBlockEditor.prototype._paintOutline.call(this, transform, context, true, color);
        }
    };

    /** @private */
    GTextEditor.prototype._triggerSelectionChanged = function () {
        var editor = GEditor.getEditor(this.getElement().getScene());
        if (editor.hasEventListeners(GEditor.InlineEditorEvent)) {
            editor.trigger(new GEditor.InlineEditorEvent(this, GEditor.InlineEditorEvent.Type.SelectionChanged));
        }
    };

    /** @override */
    GTextEditor.prototype.toString = function () {
        return "[Object GTextEditor]";
    };

    _.GTextEditor = GTextEditor;
})(this);