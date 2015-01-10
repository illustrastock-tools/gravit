(function (_) {
    /**
     * A base editor for shapes
     * @param {GBlock} block the block this editor works on
     * @class GBlockEditor
     * @extends GElementEditor
     * @constructor
     */
    function GBlockEditor(block) {
        GElementEditor.call(this, block);
    };
    GObject.inherit(GBlockEditor, GElementEditor);

    GBlockEditor.Flag = {
        /**
         * The editor supports edge resize handles
         * @type Number
         */
        ResizeEdges: 1 << 10,

        /**
         * The editor supports center resize handles
         * @type Number
         */
        ResizeCenters: 1 << 11,

        /**
         * The editor supports all resize handles
         * @type Number
         */
        ResizeAll: (1 << 10) | (1 << 11)
    };

    GBlockEditor.RESIZE_HANDLE_PART_ID = GUtil.uuid();

    /** @override */
    GBlockEditor.prototype.getBBoxMargin = function () {
        if (this._showResizeHandles()) {
            return GElementEditor.OPTIONS.annotationSizeSmall + 1.5;
        } else {
            return 1.5;
        }
    };

    /**
     * Called to create a new element for previewing
     */
    GBlockEditor.prototype.createElementPreview = function () {
        // NO-OP
    };

    /** @override */
    GBlockEditor.prototype.movePart = function (partId, partData, position, viewToWorldTransform, guides, shift, option) {
        GElementEditor.prototype.movePart.call(this, partId, partData, position, viewToWorldTransform, guides, shift, option);

        if (partId === GBlockEditor.RESIZE_HANDLE_PART_ID) {
            var newPos = viewToWorldTransform.mapPoint(position);
            newPos = guides.mapPoint(newPos);

            var bbox = this._element.getSourceBBox();
            var useSourceBBox = true;
            if (!bbox || bbox.isEmpty()) {
                bbox = this._element.getGeometryBBox();
                useSourceBBox = false;
            }

            var trf = null;
            if (useSourceBBox) {
                trf = this._element.getTransform() || new GTransform();
                var trfInv = trf.inverted();
                newPos = trfInv.mapPoint(newPos);
            }

            var origPos = bbox.getSide(partData.side);

            var dx = newPos.getX() - origPos.getX();
            var dy = newPos.getY() - origPos.getY();

            var curTrf = bbox.getResizeTransform(partData.side, dx, dy, shift, option);

            if (useSourceBBox) {
                this.createElementPreview();
                var pe = this.getPaintElement();
                trf = curTrf.multiplied(trf);
                pe.setProperties(['trf'], [trf]);
                this.requestInvalidation();
            } else {
                this.transform(curTrf);
            }
        }
    };

    /** @override */
    GBlockEditor.prototype.applyPartMove = function (partId, partData) {
        if (partId === GBlockEditor.RESIZE_HANDLE_PART_ID) {
            if (!this.canApplyTransform()) {
                // Reset editor transformation
                this.resetTransform();
            } else {
                this.applyTransform(this._element);
            }
        }
        GElementEditor.prototype.applyPartMove.call(this, partId, partData);
    };

    /** @override */
    GBlockEditor.prototype.paint = function (transform, context) {
        if (this.hasFlag(GElementEditor.Flag.Selected) || this.hasFlag(GElementEditor.Flag.Highlighted)) {
            var targetTransform = transform;

            // Pre-multiply internal transformation if any
            if (this._transform) {
                targetTransform = this._transform.multiplied(transform);
            }

            // Paint outline
            this._paintOutline(targetTransform, context);

            // Paint resize handles if desired
            if (this._showResizeHandles()) {
                this._paintHandles(transform, context);
            }

            // Let descendant classes do some post-painting
            this._postPaint(targetTransform, context);
        }

        // Paint any children editors now
        this._paintChildren(transform, context);
    };

    /** @override */
    GBlockEditor.prototype._getPartInfoAt = function (location, transform, tolerance) {
        // Hit-Test our resize handles if any
        if (this._showResizeHandles()) {
            var result = null;
            this._iterateResizeHandles(function (point, side) {
                if (this._getAnnotationBBox(transform, point).containsPoint(location)) {
                    result = new GElementEditor.PartInfo(this, GBlockEditor.RESIZE_HANDLE_PART_ID, {side: side, point: point}, true, false);
                    return true;
                }
            }.bind(this), transform);

            if (result) {
                return result;
            }
        }

        return null;
    };

    /**
     * Used to paint resize handles
     * @param {GTransform} transform the current transformation in use
     * @param {GPaintContext} context the paint context to paint on
     * @private
     */
    GBlockEditor.prototype._paintHandles = function (transform, context) {
        this._iterateResizeHandles(function (point, side) {
            this._paintAnnotation(context, transform, point, GElementEditor.Annotation.Rectangle, false, true);
        }.bind(this), transform);
    };

    /**
     * Called for subclasses to do some custom painting on top of the outline
     * @param {GTransform} transform the current transformation in use
     * @param {GPaintContext} context the paint context to paint on
     * @private
     */
    GBlockEditor.prototype._postPaint = function (transform, context) {
        // NO-OP
    };

    /**
     * @returns {Boolean}
     * @private
     */
    GBlockEditor.prototype._showResizeHandles = function () {
        return this._showAnnotations() && (this.hasFlag(GBlockEditor.Flag.ResizeEdges) || this.hasFlag(GBlockEditor.Flag.ResizeCenters));
    };

    /**
     * Iterate all resize handles
     * @param {Function(point: GPoint, side: GRect.Side)} iterator
     * the iterator receiving the parameters. If this returns true then the iteration will be stopped.
     * @param {GTransform} transform - current view transformation to check that shape has enough space
     * to show resize handles
     */
    GBlockEditor.prototype._iterateResizeHandles = function (iterator, transform) {
        var pe = this.getPaintElement();
        var trf = null;
        var bbox = pe.getSourceBBox();

        if (bbox && !bbox.isEmpty()) {
            trf = pe.getTransform() || new GTransform();
        } else {
            trf = new GTransform();
            bbox = pe.getGeometryBBox();
        }

        if (bbox && !bbox.isEmpty()) {
            var sides = [];
            // TODO: fix here for more correct identification, which handles should be painted / iterated
            var transformedBBox = transform ? trf.multiplied(transform).mapRect(bbox) : trf.mapRect(bbox);

            if (this.hasFlag(GBlockEditor.Flag.ResizeEdges) &&
                    transformedBBox.getHeight() > (GElementEditor.OPTIONS.annotationSizeSmall + 2) * 2 &&
                    transformedBBox.getWidth() > (GElementEditor.OPTIONS.annotationSizeSmall + 2) * 2) {

                sides = sides.concat([GRect.Side.TOP_LEFT, GRect.Side.TOP_RIGHT, GRect.Side.BOTTOM_LEFT, GRect.Side.BOTTOM_RIGHT]);
            }

            if (this.hasFlag(GBlockEditor.Flag.ResizeCenters)) {
                if (transformedBBox.getHeight() > (GElementEditor.OPTIONS.annotationSizeSmall + 2) * 3) {
                    sides = sides.concat([GRect.Side.RIGHT_CENTER, GRect.Side.LEFT_CENTER]);
                }
                if (transformedBBox.getWidth() > (GElementEditor.OPTIONS.annotationSizeSmall + 2) * 3) {
                    sides = sides.concat([GRect.Side.TOP_CENTER, GRect.Side.BOTTOM_CENTER]);
                }
            }

            for (var i = 0; i < sides.length; ++i) {
                var side = sides[i];
                var point = trf.mapPoint(bbox.getSide(side));
                if (iterator(point, side) === true) {
                    break;
                }
            }
        }
    };

    /**
     * Paint outline or bbox outline of underlying element
     * @param {GTransform} transform the current transformation in use
     * @param {GPaintContext} context the paint context to paint on
     * @param {Boolean} paintBBox - if true, only bbox outline will be painted instead of element itself
     * @param {GColor} [color] the color for the outline. If not provided,
     * uses either selection or highlight color depending on the current state.
     * @private
     */
    GBlockEditor.prototype._paintOutline = function (transform, context, paintBBox, color) {
        var element = this.getPaintElement();
        var vertices = null;
        var makeClosed = false;
        if (element.hasMixin(GVertexSource) && !paintBBox) {
            // Work in transformed coordinates to avoid scaling outline
            var transformer = new GVertexTransformer(element, transform);
            vertices = new GVertexPixelAligner(transformer);
        } else {
            var targetTransform = transform;
            var sourceRect = element.getSourceBBox();
            if (!sourceRect || sourceRect.isEmpty()) {
                sourceRect = element.getGeometryBBox();
            } else {
                var trf = element.getTransform();
                if (trf) {
                    targetTransform = trf.multiplied(targetTransform);
                }
            }
            var transformedQuadrilateral = targetTransform.mapQuadrilateral(sourceRect);

            if (transformedQuadrilateral && transformedQuadrilateral.length) {
                vertices = transformedQuadrilateral.map(function (point) {
                    return new GPoint(Math.floor(point.getX()) + 0.5, Math.floor(point.getY()) + 0.5)
                });

                makeClosed = true;
            }
        }
        if (vertices) {
            context.canvas.putVertices(vertices, makeClosed);

            // Paint either outlined or highlighted (highlighted has a higher precedence)
            context.canvas.strokeVertices(
                color ? color :
                    (this.hasFlag(GElementEditor.Flag.Highlighted) ? context.highlightOutlineColor :
                        context.selectionOutlineColor),
                1);
        }
    };

    /** @override */
    GBlockEditor.prototype.toString = function () {
        return "[Object GBlockEditor]";
    };

    _.GBlockEditor = GBlockEditor;
})(this);