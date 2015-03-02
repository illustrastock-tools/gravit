(function (_) {
    /**
     * A text shape
     * @class GText
     * @extends GShape
     * @constructor
     */
    function GText() {
        GShape.call(this);
        this._setDefaultProperties(GText.GeometryProperties);
        this._runs = [];
        this._runsDirty = false;
        this._tl = new GPoint(0, 0);
        this._tr = new GPoint(1, 0);
        this._br = new GPoint(1, 1);
        this._bl = new GPoint(0, 1);
    }

    GNode.inherit("text", GText, GShape);

    /**
     * Vertical align of a text
     */
    GText.VerticalAlign = {
        Top: 't',
        Middle: 'm',
        Bottom: 'b'
    };

    /**
     * The geometry properties of text with their default values
     */
    GText.GeometryProperties = {
        /** Auto-width or not */
        aw: true,
        /** Auto-height or not */
        ah: true,
        /** Vertical alignment */
        va: GText.VerticalAlign.Top,
        /** Text transformation (not the same as transformation of the text box, which is $trf) */
        ttrf: null
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText.Chunk Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @class GText.Chunk
     * @extends GNode
     * @mixes GNode.Store
     * @private
     */
    GText.Chunk = function (content) {
        GNode.call(this);
        this._content = content;
    }

    GNode.inheritAndMix("txChk", GText.Chunk, GNode, [GNode.Store]);

    /**
     * @type {String}
     * @private
     */
    GText.Chunk.prototype._content = null;

    /**
     * @returns {String}
     */
    GText.Chunk.prototype.getContent = function () {
        return this._content;
    };

    /** @override */
    GText.Chunk.prototype.validateInsertion = function (parent, reference) {
        return parent instanceof GText.Block;
    };

    /** @override */
    GText.Chunk.prototype._handleChange = function (change, args) {
        if (change === GNode._Change.Store) {
            args.cnt = this._content;
        } else if (change === GNode._Change.Restore) {
            this._content = args.cnt;
        }

        GNode.prototype._handleChange.call(this, change, args);
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText.Break Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @class GText.Break
     * @extends GNode
     * @mixes GNode.Store
     * @private
     */
    GText.Break = function () {
        GNode.call(this);
    }

    GNode.inheritAndMix("txBrk", GText.Break, GNode, [GNode.Store]);

    /** @override */
    GText.Break.prototype.validateInsertion = function (parent, reference) {
        return parent instanceof GText.Block;
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText.Block Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @class GText.Block
     * @extends GNode
     * @mixes GNode.Properties
     * @mixes GNode.Store
     * @mixes GStylable
     * @private
     */
    GText.Block = function () {
        this._setStyleDefaultProperties();
    };

    GObject.inheritAndMix(GText.Block, GNode, [GNode.Properties, GNode.Store, GStylable]);

    /** @override */
    GText.Block.prototype.getStylePropertySets = function () {
        return [GStylable.PropertySet.Text];
    };

    GText.Block.propertyToCss = function (property, value, css) {
        if (property === '_tff') {
            css['font-family'] = value !== null ? value : '';
        } else if (property === '_tfi') {
            css['font-size'] = value !== null ? value + 'px' : '';
        } else if (property === '_tfw') {
            css['font-weight'] = value !== null ? value.toString() : '';
        } else if (property === '_tfs') {
            if (value === null) {
                css['font-style'] = '';
            } else {
                switch (value) {
                    case GFont.Style.Normal:
                        css['font-style'] = 'normal';
                        break;
                    case GFont.Style.Italic:
                        css['font-style'] = 'italic';
                        break;
                    default:
                        break;
                }
            }
        } else if (property === '_fc') {
            css['color'] = value !== null ? value.toScreenCSS() : '';
        } else if (property === '_tcs') {
            css['letter-spacing'] = value !== null ? value + 'px' : '';
        } else if (property === '_tws') {
            css['word-spacing'] = value !== null ? value + 'px' : '';
        } else {
            throw new Error('Unimplemented property (propertyToCss): ' + property);
        }
    };

    GText.Block.cssToProperty = function (property, css) {
        if (property === '_tff') {
            if (css['font-family']) {
                var family = css['font-family'];
                if (family.length > 0) {
                    if (family.indexOf(',') >= 0) {
                        family = family.substr(0, family.indexOf(',')).trim();
                    }

                    if (family.charAt(0) === '"' || family.charAt(0) === "'") {
                        family = family.substr(1);
                    }
                    if (family.charAt(family.length - 1) === '"' || family.charAt(family.length - 1) === "'") {
                        family = family.substr(0, family.length - 1);
                    }

                    return family;
                }
            }
        } else if (property === '_tfi') {
            var value = parseFloat(css['font-size']);
            if (!isNaN(value)) {
                return value;
            }
        } else if (property === '_tfw') {
            var value = parseInt(css['font-weight']);
            if (!isNaN(value)) {
                return value;
            } else {
                value = css['font-weight'];
                if (value === 'normal') {
                    return GFont.Weight.Regular;
                } else if (value === 'bold') {
                    return GFont.Weight.Bold;
                }
            }
        } else if (property === '_tfs') {
            if (css['font-style'] === 'normal') {
                return GFont.Style.Normal;
            } else if (css['font-style'] === 'italic') {
                return GFont.Style.Italic;
            }
        } else if (property === '_fc') {
            var cssStringColor = css['color'];
            if (cssStringColor) {
                var value = GRGBColor.fromCSSColor(cssStringColor);
                if (value) {
                    return value;
                }
            }
        } else if (property === '_tcs') {
            var value = parseFloat(css['letter-spacing']);
            if (!isNaN(value)) {
                return value;
            }
        } else if (property === '_tws') {
            var value = parseFloat(css['word-spacing']);
            if (!isNaN(value)) {
                return value;
            }
        } else {
            throw new Error('Unimplemented property (cssToProperty): ' + property);
        }

        return null;
    };

    /**
     * @return {GText}
     */
    GText.Block.prototype.getText = function () {
        for (var parent = this.getParent(); parent !== null; parent = parent.getParent()) {
            if (parent instanceof GText) {
                return parent;
            }
        }
        return null;
    };

    /** @override */
    GText.Block.prototype.validateInsertion = function (parent, reference) {
        return parent instanceof GText.Block;
    };

    /** @override */
    GText.Block.prototype._handleChange = function (change, args) {
        this._handleStyleChange(change, args);

        var text = this.getText();
        if (text) {
            if (change == GNode._Change.BeforeChildInsert || change == GNode._Change.BeforeChildRemove) {
                text.beginUpdate();
            } else if (change == GNode._Change.AfterChildInsert || change == GNode._Change.AfterChildRemove) {
                text._runsDirty = true;
                text.endUpdate();
            }
        }

        GNode.prototype._handleChange.call(this, change, args);
    };

    /** @override */
    GText.Block.prototype._stylePrepareGeometryChange = function () {
        var text = this.getText();
        if (text) {
            text._runsDirty = true;
        }
    };

    /**
     * @param {{}} css
     * @returns {{}}
     */
    GText.Block.prototype.propertiesToCss = function (css) {
        return this._propertiesToCss(css,
            $.extend({},
                GStylable.PropertySetInfo[GStylable.PropertySet.Text].geometryProperties,
                {'_fc': null}),
            GText.Block.propertyToCss);
    };

    /**
     * @param {{}} css
     */
    GText.Block.prototype.cssToProperties = function (css) {
        this._cssToProperties(css,
            $.extend({},
                GStylable.PropertySetInfo[GStylable.PropertySet.Text].geometryProperties,
                {'_fc': null}),
            GText.Block.cssToProperty);
    };

    GText.Block.prototype._propertiesToCss = function (css, propertyMap, propertyConverter) {
        for (var property in propertyMap) {
            var value = this.getProperty(property);
            if (value !== null) {
                propertyConverter(property, value, css);
            }
        }
        return css;
    };

    GText.Block.prototype._cssToProperties = function (css, propertyMap, propertyConverter) {
        var properties = [];
        var values = [];
        for (var property in propertyMap) {
            var value = propertyConverter(property, css);
            properties.push(property);
            values.push(value);
        }

        if (properties.length > 0) {
            this.setProperties(properties, values);
        }
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText.Span Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @class GText.Span
     * @extends GText.Block
     * @mixes GNode.Container
     * @private
     */
    GText.Span = function () {
        GText.Block.call(this);
    }

    GNode.inheritAndMix("txSpan", GText.Span, GText.Block, [GNode.Container]);

    /** @override */
    GText.Span.prototype.validateInsertion = function (parent, reference) {
        return parent instanceof GText.Paragraph || parent instanceof GText.Span;
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText.Paragraph Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @class GText.Paragraph
     * @extends GText.Block
     * @mixes GNode.Container
     * @private
     */
    GText.Paragraph = function () {
        GText.Block.call(this);
    }

    GNode.inheritAndMix("txPara", GText.Paragraph, GText.Block, [GNode.Container]);

    /** @override */
    GText.Paragraph.prototype.getStylePropertySets = function () {
        return [GStylable.PropertySet.Text, GStylable.PropertySet.Paragraph];
    };

    GText.Paragraph.propertyToCss = function (property, value, css) {
        if (property === '_pcc') {
            value = value !== null ? value : '';
            css['column-count'] = value;
            css['-webkit-column-count'] = value;
            css['-moz-column-count'] = value;
        } else if (property === '_pcg') {
            value = value !== null ? value : '';
            css['column-gap'] = value;
            css['-webkit-column-gap'] = value;
            css['-moz-column-gap'] = value;
        } else if (property === '_pwm') {
            if (value === null) {
                css['white-space'] = '';
                css['word-break'] = '';
            } else {
                switch (value) {
                    case GStylable.ParagraphWrapMode.None:
                        css['white-space'] = 'nowrap';
                        break;
                    case GStylable.ParagraphWrapMode.Words:
                        css['white-space'] = 'pre-wrap';
                        break;
                    case GStylable.ParagraphWrapMode.All:
                        css['white-space'] = 'pre-wrap';
                        css['word-break'] = 'break-all';
                        break;
                }
            }
        } else if (property === '_pal') {
            if (value === null) {
                css['text-align'] = '';
            } else {
                switch (value) {
                    case GStylable.ParagraphAlignment.Left:
                        css['text-align'] = 'left';
                        break;
                    case GStylable.ParagraphAlignment.Center:
                        css['text-align'] = 'center';
                        break;
                    case GStylable.ParagraphAlignment.Right:
                        css['text-align'] = 'right';
                        break;
                    case GStylable.ParagraphAlignment.Justify:
                        css['text-align'] = 'justify';
                        break;
                }
            }
        } else if (property === '_pin') {
            css['text-indent'] = value !== null ? value + 'px' : '';
        } else if (property === '_plh') {
            css['line-height'] = value !== null ? value : '';
        } else {
            throw new Error('Unimplemented property (propertyToCss): ' + property);
        }
    };

    GText.Paragraph.cssToProperty = function (property, css) {
        if (property === '_pcc') {
            var str = css['column-count'] || css['-webkit-column-count'] || css['-moz-column-count'];
            var value = parseInt(str);
            if (!isNaN(value)) {
                return value;
            }
        } else if (property === '_pcg') {
            var str = css['column-gap'] || css['-webkit-column-gap'] || css['-moz-column-gap'];
            var value = parseFloat(str);
            if (!isNaN(value)) {
                return value;
            }
        } else if (property === '_pwm') {
            var wspace = css['white-space'];
            var wbreak = css['word-break'];

            if (wspace === 'pre-wrap') {
                if (wbreak === 'break-all') {
                    return GStylable.ParagraphWrapMode.All;
                } else {
                    return GStylable.ParagraphWrapMode.Words;
                }
            } else if (wspace === 'nowrap') {
                return GStylable.ParagraphWrapMode.None;
            }
        } else if (property === '_pal') {
            var value = css['text-align'];
            if (value === 'left') {
                return GStylable.ParagraphAlignment.Left;
            } else if (value === 'center') {
                return GStylable.ParagraphAlignment.Center;
            } else if (value === 'right') {
                return GStylable.ParagraphAlignment.Right;
            } else if (value === 'justify') {
                return GStylable.ParagraphAlignment.Justify;
            }
        } else if (property === '_pin') {
            var value = parseFloat(css['text-indent']);
            if (!isNaN(value)) {
                return value;
            }
        } else if (property === '_plh') {
            var lineHeight = parseFloat(css['line-height']);
            if (!isNaN(lineHeight)) {
                return lineHeight;
            }
        } else {
            throw new Error('Unimplemented property (cssToProperty): ' + property);
        }
        return null;
    };

    /** @override */
    GText.Paragraph.prototype.validateInsertion = function (parent, reference) {
        return parent instanceof GText.Content;
    };

    /** @override */
    GText.Paragraph.prototype.propertiesToCss = function (css) {
        this._propertiesToCss(css, GStylable.PropertySetInfo[GStylable.PropertySet.Paragraph].geometryProperties, GText.Paragraph.propertyToCss);
        return GText.Block.prototype.propertiesToCss.call(this, css);
    };

    /**
     * @param {{}} css
     */
    GText.Paragraph.prototype.cssToProperties = function (css) {
        this._cssToProperties(css, GStylable.PropertySetInfo[GStylable.PropertySet.Paragraph].geometryProperties, GText.Paragraph.cssToProperty);
        GText.Block.prototype.cssToProperties.call(this, css);
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText.Content Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @class GText.Content
     * @extends GNode
     * @mixes GNode.Properties
     * @mixes GNode.Store
     * @mixes GNode.Container
     * @private
     */
    GText.Content = function () {
        GNode.call(this);
    };

    GNode.inheritAndMix("txContent", GText.Content, GNode, [GNode.Properties, GNode.Store, GNode.Container]);

    /** @override */
    GText.Content.prototype.validateInsertion = function (parent, reference) {
        return parent instanceof GText;
    };

    GText.Content.prototype.propertiesToCss = function (css) {
        // Setup default color taking care of style if any
        css['color'] = 'black';

        var text = this._parent;
        if (text) {
            // Take color of fill pattern and assign it to editor if any
            var fillPattern = text.getProperty('_fpt');
            if (fillPattern && fillPattern instanceof GColor) {
                css['color'] = GColor.rgbToHtmlHex(fillPattern.toScreen());
            }

            // Call property convert with our text as property source
            GText.Block.prototype._propertiesToCss.call(text, css, GStylable.PropertySetInfo[GStylable.PropertySet.Text].geometryProperties, GText.Block.propertyToCss);
            GText.Block.prototype._propertiesToCss.call(text, css, GStylable.PropertySetInfo[GStylable.PropertySet.Paragraph].geometryProperties, GText.Paragraph.propertyToCss);
        }

        return css;
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText.ColorChunkReader Class
    // Proxy class for GText readVertex modification to provide limited reading of only the near chars
    // of the same color pattern
    // -----------------------------------------------------------------------------------------------------------------

    GText.ColorChunkReader = function (textOwner) {
        this._textOwner = textOwner;
    };

    GObject.inherit(GText.ColorChunkReader, GVertexSource);

    /**
     * @type {GText}
     * @private
     */
    GText.ColorChunkReader.prototype._textOwner = null;

    GText.ColorChunkReader.prototype.readVertex = function (vertex) {
        return this._textOwner.readClrVertex(vertex);
    };

    GText.ColorChunkReader.prototype.rewindVertices = function (index) {
        return this._textOwner.rewindClrVertices(index);
    };

    // -----------------------------------------------------------------------------------------------------------------
    // GText Class
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * @type {GText.Content}
     * @private
     */
    GText.prototype._content = null;

    /**
     * The top left point of the text box (after some transformations applied the text box may be not rectangular)
     * @type {GPoint}
     * @private
     */
    GText.prototype._tl = null;

    /**
     * The top right point of the text box (after some transformations applied the text box may be not rectangular)
     * @type {GPoint}
     * @private
     */
    GText.prototype._tr = null;

    /**
     * The bottom left point of the text box (after some transformations applied the text box may be not rectangular)
     * @type {GPoint}
     * @private
     */
    GText.prototype._bl = null;

    /**
     * The bottom right point of the text box (after some transformations applied the text box may be not rectangular)
     * @type {GPoint}
     * @private
     */
    GText.prototype._br = null;

    /**
     * Used to store the shift of chars between calls of rewindVertices() and following readVertex()
     * @type {Number}
     * @private
     */
    GText.prototype._verticalShift = 0;

    /**
     * @type {Array<{}>}
     * @private
     */
    GText.prototype._runs = null;

    /**
     * @type {boolean}
     * @private
     */
    GText.prototype._runsDirty = false;

    /**
     * @type {number}
     * @private
     */
    GText.prototype._colorItIndex = null;

    /**
     * @type {number}
     * @private
     */
    GText.prototype._runItIndex = null;

    /**
     * @type {GVertexSource}
     * @private
     */
    GText.prototype._runItOutline = null;

    /**
     * Returns the content container of the text node
     * @returns {GText.Content}
     */
    GText.prototype.getContent = function () {
        if (!this._content) {
            this._content = new GText.Content();
            this._content._setParent(this);
        }

        return this._content;
    };

    /**
     * Returns the bounding box of the content
     * @return {GRect} null if there's no bbox or a valid bbox
     */
    GText.prototype.getContentBBox = function () {
        return this._sizeBox ? this._sizeBox : null;
    };

    /** @override */
    GText.prototype._calculateSourceBBox = function () {
        return this._textBox && !this._runsDirty ? this._textBox : new GRect.fromPoints(this._tl, this._tr, this._br, this._bl);
    };

    /**
     * Converts the underlying content to a html string
     * @param {Boolean} segments if true, each single character
     * will be enclosed by a span. Defaults to false.
     * Defaults to false.
     * @returns {String}
     */
    GText.prototype.asHtml = function (segments) {
        var dummy = $('<div></div>');
        this._asHtml(dummy, this.getContent(), segments);
        return dummy.html();
    };

    /**
     * Converts the underlying content to a plain text string
     * @returns {String}
     */
    GText.prototype.asPlainText = function () {
        var result = '';

        this.getContent().acceptChildren(function (node) {
            if (node instanceof GText.Break) {
                result += '\n';
            } else if (node instanceof GText.Chunk) {
                var content = node.getContent();
                if (content && content !== "") {
                    result += content;
                }
            }
        });

        return result;
    };

    /**
     * Clears and replaces the contents of this text from
     * a given html string
     * @param {String} html
     */
    GText.prototype.fromHtml = function (html) {
        this.beginUpdate();
        try {
            var content = this.getContent();

            // Clear our contents
            content.clearChildren(true);

            // Parse html into a dummy element for iterating (if any)
            if (html && html !== "") {
                var doc = document.createElement('div');
                doc.innerHTML = html;
                for (var child = doc.firstChild; child !== null; child = child.nextSibling) {
                    this._fromHtml(child, content);
                }
            }
        } finally {
            this.endUpdate();
        }
    };

    /** @override */
    GText.prototype.transform = function (transform) {
        if (transform && !transform.isIdentity()) {
            this.setProperties(['trf', 'ttrf'],
                [this.$trf ? this.$trf.multiplied(transform) : transform,
                    this.$ttrf ? this.$ttrf.multiplied(transform) : transform]);
        }
        GElement.Transform.prototype._transformChildren.call(this, transform);
    };

    /** @override */
    GText.prototype.getStylePropertySets = function () {
        return GShape.prototype.getStylePropertySets.call(this).concat(
            GStylable.PropertySet.Text, GStylable.PropertySet.Paragraph);
    };

    /** @override */
    GText.prototype.rewindVertices = function (index) {
        if (this._runsDirty || this._runs == null || !this._runs.length) {
            this._runs = [];
            var colorChunk = null;

            // Calculate our actual text box and line length
            this._textBox = new GRect.fromPoints(this._tl, this._tr, this._br, this._bl);
            var textBoxOrig = this._textBox;

            if (textBoxOrig) {
                // Create our temporary container for holding our html contents
                var container = $('<div></div>')
                    .addClass('contenteditable')
                    .css(this.getContent().propertiesToCss({}))
                    .css({
                        'position': 'absolute',
                        'top': '0px',
                        'left': '0px',
                        'visibility': 'hidden',
                        'width': textBoxOrig.getWidth() > 1 && !this.$aw ? textBoxOrig.getWidth() + 'px' : '',
                        'height': textBoxOrig.getHeight() > 1 && !this.$ah ? textBoxOrig.getHeight() + 'px' : ''
                    })
                    .html(this.asHtml(true))
                    .appendTo($('body'));

                var sizeBox = null;
                container.find('span:not(:has(span))').each(function (index, span) {
                    var $span = $(span);
                    var rect = span.getBoundingClientRect();
                    var textContent = $span.text();
                    if (textContent.length === 0) {
                        return;
                    }
                    var char = textContent[0];

                    // Ignore zero height/width, and binary chars
                    if (rect.height <= 0 || rect.width <= 0 || char >= '\x00' && char <= '\x1F') {
                        return;
                    }

                    var css = {
                        'font-family': $span.css('font-family'),
                        'font-size': $span.css('font-size'),
                        'font-style': $span.css('font-style'),
                        'font-weight': $span.css('font-weight'),
                        'color': $span.css('color')
                    };

                    var fontFamily = GText.Block.cssToProperty('_tff', css);
                    var fontSize = GText.Block.cssToProperty('_tfi', css);
                    var fontStyle = GText.Block.cssToProperty('_tfs', css);
                    var fontWeight = GText.Block.cssToProperty('_tfw', css);
                    var fontVariant = ifFont.getVariant(fontFamily, fontStyle, fontWeight);
                    var baseline = ifFont.getGlyphBaseline(fontFamily, fontVariant, fontSize);

                    var charColor = GText.Block.cssToProperty('_fc', css);
                    if (charColor) {
                        var fillPattern = this.getProperty('_fpt');
                        var fptValue = null;
                        if (fillPattern && fillPattern instanceof GColor) {
                            fptValue = fillPattern;
                        }
                        if (fptValue && GRGBColor.equals(charColor, fptValue)) {
                            charColor = null;
                        }
                    }

                    if (char !== ' ') {
                        if (!colorChunk ||
                            this._runs.length && !GRGBColor.equals(this._runs[this._runs.length - 1].clr, charColor)) {

                            colorChunk = [];
                            this._runs.push({
                                chars: colorChunk,
                                clr: charColor
                            });
                        }

                        colorChunk.push({
                            x: textBoxOrig.getX() + rect.left,
                            y: textBoxOrig.getY() + rect.top + baseline,
                            char: char,
                            family: fontFamily,
                            variant: fontVariant,
                            size: fontSize
                        });
                    }

                    var charSz = ifFont.getGlyphCharSzRect(fontFamily, fontVariant, fontSize, char);
                    var charRect = new GRect(rect.left + charSz.getX(), rect.top, charSz.getWidth(), rect.height);

                    sizeBox = sizeBox ? sizeBox.united(charRect) : charRect;
                }.bind(this));

                var verticalShift = 0;
                if (sizeBox) {
                    this._sizeBox = new GRect(sizeBox.getX() + textBoxOrig.getX(), sizeBox.getY() + textBoxOrig.getY(),
                        sizeBox.getWidth(), sizeBox.getHeight());

                    // Calculate vertical shift depending on vertical alignment
                    if (this._sizeBox && this._sizeBox.getHeight() < this._textBox.getHeight()) {
                        switch (this.$va) {
                            case GText.VerticalAlign.Top:
                                verticalShift = this._textBox.getY() - this._sizeBox.getY();
                                break;

                            case GText.VerticalAlign.Middle:
                                verticalShift = this._textBox.getY() - this._sizeBox.getY() +
                                (this._textBox.getHeight() - this._sizeBox.getHeight()) / 2;
                                break;

                            case GText.VerticalAlign.Bottom:
                                verticalShift = this._textBox.getY() - this._sizeBox.getY() +
                                this._textBox.getHeight() - this._sizeBox.getHeight();
                                break;
                        }
                    } else if (this._sizeBox) {
                        verticalShift = this._textBox.getY() - this._sizeBox.getY();
                    }
                    this._sizeBox = this._sizeBox.translated(0, verticalShift);
                } else {
                    this._sizeBox = null;
                }

                this._verticalShift = verticalShift;

                // Remove our container now
                container.remove();

                // We're done here
                this._runsDirty = false;

                if (this._sizeBox && (this.$ah || this.$aw || this._sizeBox.getWidth() > this._textBox.getWidth() ||
                    this._sizeBox.getHeight() > this._textBox.getHeight())) {

                    var lx = this.$aw ? this._sizeBox.getX() : this._textBox.getX();
                    var w = this.$aw || this._sizeBox.getWidth() > this._textBox.getWidth() ?
                        this._sizeBox.getWidth() : this._textBox.getWidth();

                    var ty = this.$ah ? this._sizeBox.getY() : this._textBox.getY();
                    var h = this.$ah || this._sizeBox.getHeight() > this._textBox.getHeight() ?
                        this._sizeBox.getHeight() : this._textBox.getHeight();

                    this._textBox = new GRect(lx, ty, w, h);
                    this._tl = this._textBox.getSide(GRect.Side.TOP_LEFT);
                    this._tr = this._textBox.getSide(GRect.Side.TOP_RIGHT);
                    this._br = this._textBox.getSide(GRect.Side.BOTTOM_RIGHT);
                    this._bl = this._textBox.getSide(GRect.Side.BOTTOM_LEFT);
                }
            }
        }

        if (this._runs && this._runs.length > 0) {
            this._colorItIndex = 0;
            this._runItIndex = 0;
            this._runItOutline = null;
            return true;
        }

        return false;
    };

    /** @override */
    GText.prototype.readVertex = function (vertex) {
        if (this._runItOutline) {
            if (this._runItOutline.readVertex(vertex)) {
                return true;
            } else {
                this._runItOutline = null;
                if (!this._hasRunToRead()) {
                    return false;
                }
            }
        }

        if (!this._runItOutline) {
            var run = this._getRun();
            if (!run) {
                return false;
            }
            return this._runReadVertex(run, vertex);
        }
    };

    /**
     * Rewind vertices of chars of the same color chunk
     * @param {Number} index
     * @returns {Boolean} true if rewind successful
     */
    GText.prototype.rewindClrVertices = function (index) {
        if (this._runs.length) {
            var chars = this._runs[this._colorItIndex].chars;
            if (chars.length && index < chars.length) {
                this._runItIndex = index;
                return true;
            } else {
                return false;
            }
        }
        return false;
    };

    /**
     * Read the next vertex of chars of the same color chunk
     * @param {GVertex} vertex
     * @returns {Boolean} true if read is successful
     */
    GText.prototype.readClrVertex = function (vertex) {
        if (this._runItOutline) {
            if (this._runItOutline.readVertex(vertex)) {
                return true;
            } else {
                this._runItOutline = null;
                var chars = this._runs[this._colorItIndex].chars;
                if (this._runItIndex >= chars.length) {
                    return false;
                }
            }
        }

        if (!this._runItOutline) {
            var run = this._getRun();
            if (!run) {
                return false;
            }
            return this._runReadVertex(run, vertex);
        }

        return false;
    };

    /**
     * Remember the current text box as a starting box for all the text transformations
     */
    GText.prototype.transformSourceBBox = function (resizeTrf) {
        if (resizeTrf) {
            this._notifyChange(GElement._Change.PrepareGeometryUpdate);
            this._tl = resizeTrf.mapPoint(this._tl);
            this._tr = resizeTrf.mapPoint(this._tr);
            this._br = resizeTrf.mapPoint(this._br);
            this._bl = resizeTrf.mapPoint(this._bl);
            this._textBox = new GRect.fromPoints(this._tl, this._tr, this._br, this._bl);
            this._runsDirty = true;
            this._notifyChange(GElement._Change.FinishGeometryUpdate);
        }
    };

    /** @override */
    GText.prototype._calculateGeometryBBox = function () {
        // Always rewind to ensure integrity
        this.rewindVertices(0);
        var bbox = this._textBox;
        if (this._sizeBox) {
            bbox = bbox.united(this._sizeBox);
        }
        if (this.$trf) {
            bbox = this.$trf.mapRect(bbox);
        }
        return bbox;
    };

    /** @override */
    GText.prototype._preparePaint = function (context) {
        if (GShape.prototype._preparePaint.call(this, context)) {
            // Check if we need to clip rect
            var clipBox = this._getClipBox(context);
            if (clipBox) {
                context.canvas.clipRect(clipBox.getX(), clipBox.getY(), clipBox.getWidth(), clipBox.getHeight());
            }

            return true;
        }
        return false;
    };

    /** @override */
    GText.prototype._finishPaint = function (context) {
        // Reset clipping if done previously
        if (this._getClipBox(context) !== null) {
            context.canvas.resetClip();
        }

        GShape.prototype._finishPaint.call(this, context);
    };

    /** @override */
    GText.prototype._detailHitTest = function (location, transform, tolerance, force) {
        // For now, text is always hit-test by its bbox only so return ourself
        // TODO : Add support for detailed range hit test information here
        return new GElement.HitResultInfo(this);
    };

    /** @override */
    GText.prototype._stylePrepareGeometryChange = function () {
        GShape.prototype._stylePrepareGeometryChange.call(this);
        this._runsDirty = true;
    };

    /** @override */
    GText.prototype._handleChange = function (change, args) {
        if (change === GNode._Change.Store) {
            this.storeProperties(args, GText.GeometryProperties, function (property, value) {
                if (property === 'ttrf' && value) {
                    return GTransform.serialize(value);
                }
                return value;
            });

            if (this._content) {
                args.ct = GNode.store(this._content);
            }
            args.tlx = this._tl.getX();
            args.tly = this._tl.getY();
            args.trx = this._tr.getX();
            args.try = this._tr.getY();
            args.blx = this._bl.getX();
            args.bly = this._bl.getY();
            args.brx = this._br.getX();
            args.bry = this._br.getY();
        } else if (change === GNode._Change.Restore) {
            this.restoreProperties(args, GText.GeometryProperties, function (property, value) {
                if (property === 'ttrf' && value) {
                    return GTransform.deserialize(value);
                }
                return value;
            });

            if (args.ct) {
                this._content = GNode.restore(args.ct);
                this._content._setParent(this);
            }

            this._tl = new GPoint(args.tlx, args.tly);
            this._tr = new GPoint(args.trx, args.try);
            this._br = new GPoint(args.brx, args.bry);
            this._bl = new GPoint(args.blx, args.bly);
            this._runsDirty = true;
        } else if (change === GNode._Change.ParentAttached || change === GNode._Change.ParentDetach) {
            if (this._content) {
                this._content._detachFromParent(this);
                if (change === GNode._Change.ParentAttached) {
                    this._content._attachToParent(this);
                }
            }
        } else if (change === GNode._Change.WorkspaceAttached || change === GNode._Change.WorkspaceDetach) {
            if (this._content) {
                this._content._setWorkspace(change === GNode._Change.WorkspaceDetach ? null : this._workspace);
            }
        }

        this._handleGeometryChangeForProperties(change, args, GText.GeometryProperties);
        this._handleGeometryChangeForProperties(change, args, GStylable.AllGeometryProperties);
        if (change === GElement._Change.PrepareGeometryUpdate) {
            this._runsDirty = true;
        }

        GShape.prototype._handleChange.call(this, change, args);
    };

    /** @override */
    GText.prototype._paintFill = function (context) {
        if (!context.configuration.isOutline(context)) {
            this.iterateColorChunks(this._paintChunkFill.bind(this, context));
        }
    };

    GText.prototype.iterateColorChunks = function (iterator) {
        for (this._colorItIndex = 0; this._colorItIndex < this._runs.length; ++this._colorItIndex) {
            var colorChunk = this._runs[this._colorItIndex];
            iterator(colorChunk);
        }
    };

    GText.prototype._paintChunkFill = function (context, colorChunk) {
        var fill;
        if (colorChunk.clr) {
            fill = this._createShapePaint(context, colorChunk.clr, this._getPatternBBox());
        } else if (this.hasStyleFill()) {
            fill = this._createShapePaint(context, this.$_fpt, this._getPatternBBox());
        }
        if (fill) {
            var canvas = context.canvas;
            canvas.putVertices(new GText.ColorChunkReader(this));

            if (fill.transform) {
                if (this.$trf) {
                    fill.transform = fill.transform.multiplied(this.$trf);
                }
                // Apply our fill pattern transformation if any
                if (this.$_fpx && !this.$_fpx.isIdentity()) {
                    fill.transform = fill.transform.preMultiplied(this.$_fpx);
                }

                var oldTransform = canvas.setTransform(canvas.getTransform(true).preMultiplied(fill.transform));
                canvas.fillVertices(fill.paint, this.$_fop);
                canvas.setTransform(oldTransform);
            } else {
                canvas.fillVertices(fill.paint, this.$_fop, null, this._isEvenOddFill());
            }
        }
    };

    /**
     * Returns a clip-box if required, otherwise null
     * @param context
     * @returns {GRect}
     * @private
     */
    GText.prototype._getClipBox = function (context) {
        return null;
    };

    /**
     * Convert contents to html
     * @param parent
     * @param node
     * @param segments
     * @private
     */
    GText.prototype._asHtml = function (parent, node, segments) {
        if (node instanceof GText.Break) {
            $('<br>')
                .appendTo(parent);
        } else if (node instanceof GText.Chunk) {
            var content = node.getContent();
            if (content && content !== "") {
                if (segments) {
                    for (var i = 0; i < content.length; ++i) {
                        $('<span></span>')
                            .text(content[i])
                            .appendTo(parent);
                    }
                } else {
                    parent.append(document.createTextNode(content));
                }
            }
        } else if (node instanceof GText.Content) {
            // ignore root
        } else if (node instanceof GText.Paragraph) {
            parent = $('<p></p>')
                .css('margin', '0px') // !!
                .css(node.propertiesToCss({}))
                .appendTo(parent);
        } else if (node instanceof GText.Span) {
            parent = $('<span></span>')
                .css(node.propertiesToCss({}))
                .appendTo(parent);
        }
        if (node.hasMixin(GNode.Container)) {
            for (var child = node.getFirstChild(); child !== null; child = child.getNext()) {
                this._asHtml(parent, child, segments);
            }
        }
    };

    /**
     * @param element
     * @param parent
     * @private
     */
    GText.prototype._fromHtml = function (node, parent) {
        if (node.nodeType === 1) {
            var nodeName = node.nodeName.toLowerCase();

            if (nodeName === 'p' || nodeName === 'div') {
                var paragraph = new GText.Paragraph();
                paragraph.cssToProperties(node.style);
                parent.appendChild(paragraph);
                parent = paragraph;
            } else if (nodeName === 'span' || nodeName === 'b' || nodeName === 'strong' || nodeName === 'i') {
                var span = new GText.Span();
                span.cssToProperties(node.style);
                parent.appendChild(span);
                parent = span;

                if (nodeName === 'b' || nodeName === 'strong') {
                    span.setProperty('_tfw', GFont.Weight.Bold);
                } else if (nodeName === 'i') {
                    span.setProperty('_tfs', GFont.Style.Italic);
                }
            } else if (nodeName === 'br') {
                parent.appendChild(new GText.Break());
                return; // no children for breaks
            } else {
                // ignore the element alltogether
                return;
            }

            for (var child = node.firstChild; child !== null; child = child.nextSibling) {
                this._fromHtml(child, parent);
            }
        } else if (node.nodeType === 3) {
            if (node.textContent !== "") {
                parent.appendChild(new GText.Chunk(node.textContent));
            }
        }
    };

    /** @override */
    GText.prototype._requireMiterLimitApproximation = function () {
        return true;
    };

    /**
     * Checks if there remains new run to read vertices from
     * @returns {Boolean}
     * @private
     */
    GText.prototype._hasRunToRead = function () {
        if (this._runs.length) {
            var chars = this._runs[this._colorItIndex].chars;

            if (this._colorItIndex + 1 < this._runs.length ||
                this._runItIndex < chars.length) {
                return true;
            }
        }
        return false;
    };

    /**
     * Returns the next run and increases this._runItIndex by 1
     * @returns {{*}}
     * @private
     */
    GText.prototype._getRun = function () {
        if (this._runs.length) {
            var chars = this._runs[this._colorItIndex].chars;

            if (this._colorItIndex + 1 < this._runs.length ||
                this._runItIndex < chars.length) {

                if (this._runItIndex < chars.length) {
                    return chars[this._runItIndex++];
                } else {
                    this._runItIndex = 0;
                    ++this._colorItIndex;
                    chars = this._runs[this._colorItIndex].chars;
                    return chars[this._runItIndex++];
                }
            }
        }
        return null;
    };

    /**
     * Creates char outline and reads vertices from it
     * @param {{*}} [run]
     * @param {GVertex} [vertex]
     * @returns {Boolean} true if read successfull
     * @private
     */
    GText.prototype._runReadVertex = function (run, vertex) {
        this._runItOutline = ifFont.getGlyphOutline(run.family, run.variant, run.size, run.x, run.y, run.char);
        var transform = this.$ttrf && !this.$ttrf.isIdentity() ? this.$ttrf : null;
        if (this._verticalShift) {
            var vtrans = new GTransform(1, 0, 0, 1, 0, this._verticalShift);
            transform = transform ? vtrans.multiplied(transform) : vtrans;
        }
        if (transform) {
            this._runItOutline = new GVertexTransformer(this._runItOutline, transform);
        }
        if (!this._runItOutline.rewindVertices(0)) {
            throw new Error('Unexpected end of outline');
        }
        return this._runItOutline.readVertex(vertex);
    };

    /** @override */
    GText.prototype.toString = function () {
        return "[GText]";
    };

    _.GText = GText;
})(this);