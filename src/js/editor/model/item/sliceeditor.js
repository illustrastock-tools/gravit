(function (_) {
    /**
     * An editor for a slice
     * @param {GSlice} slice the slice this editor works on
     * @class GSliceEditor
     * @extends GBlockEditor
     * @constructor
     */
    function GSliceEditor(slice) {
        GBlockEditor.call(this, slice);
        this._flags |= GBlockEditor.Flag.ResizeAll;
    };
    GObject.inherit(GSliceEditor, GBlockEditor);
    GElementEditor.exports(GSliceEditor, GSlice);

    /** @override */
    GSliceEditor.prototype.createElementPreview = function () {
        if (!this._elementPreview) {
            var sourceBBox = this._element.getSourceBBox();
            // Create a rectangle instead for the preview
            this._elementPreview = new GRectangle(
                sourceBBox.getX(), sourceBBox.getY(), sourceBBox.getWidth(), sourceBBox.getHeight());

            // We may transform GSlice.GeometryProperties here, as they contain only 'trf' property,
            // the same as GShape.GeometryProperties
            this._elementPreview.transferProperties(this._element, [GSlice.GeometryProperties]);
        }
    };

    /** @override */
    GSliceEditor.prototype.canApplyTransform = function () {
        return this._elementPreview || GBlockEditor.prototype.canApplyTransform.call(this);
    };

    /** @override */
    GSliceEditor.prototype.applyTransform = function (element) {
        if (element && this._elementPreview) {
            element.transferProperties(this._elementPreview, [GSlice.GeometryProperties]);
            this.resetTransform();
        } else {
            GBlockEditor.prototype.applyTransform.call(this, element);
        }
    };

    /** @override */
    GSliceEditor.prototype._prePaint = function (transform, context) {
        if (this.hasFlag(GElementEditor.Flag.Selected) || this.hasFlag(GElementEditor.Flag.Highlighted)) {
           /* var element = this.getPaintElement();
            if (element.hasMixin(GVertexSource)) {
                // Work in transformed coordinates to avoid scaling outline
                var transformer = new GVertexTransformer(element, transform);
                context.canvas.putVertices(new GVertexPixelAligner(transformer));

                // Paint either outlined or highlighted (highlighted has a higher precedence)
                context.canvas.strokeVertices(this.hasFlag(GElementEditor.Flag.Highlighted) ? context.highlightOutlineColor : context.selectionOutlineColor, 1);
            } else { */
                this._paintBBoxOutline(transform, context);
            //}
        }
        //GBlockEditor.prototype._prePaint.call(this, transform, context);
    };

    /** @override */
    GSliceEditor.prototype.toString = function () {
        return "[Object GSliceEditor]";
    };

    _.GSliceEditor = GSliceEditor;
})(this);