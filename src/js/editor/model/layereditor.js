(function (_) {
    /**
     * An editor for a layer
     * @param {GLayer} layer the layer this editor works on
     * @class GLayerEditor
     * @extends GBlockEditor
     * @constructor
     */
    function GLayerEditor(layer) {
        GBlockEditor.call(this, layer);
        this._flags |= GBlockEditor.Flag.ResizeAll;
    };
    GObject.inherit(GLayerEditor, GBlockEditor);
    GElementEditor.exports(GLayerEditor, GLayer);

    /** @override */
    GLayerEditor.prototype.paint = function (transform, context) {
        // Setup outline colors if we have a color
        var oldSelOutlineColor = context.selectionOutlineColor;
        var layerColor = this._element.getProperty('cls');
        context.selectionOutlineColor = layerColor;

        // Call super
        GBlockEditor.prototype.paint.call(this, transform, context);

        // Reset outline colors if set
        context.selectionOutlineColor = oldSelOutlineColor;
    };

    /** override */
    GLayerEditor.prototype._paintOutline = function (transform, context, paintBBox, color) {
        if (!this._transform) {
            GBlockEditor.prototype._paintOutline.call(this, transform, context, paintBBox, color);
        } else {
            // We are in transformation, show children outline instead of self bbox
            var element = this.getPaintElement();
            for (var node = element.getFirstChild(); node != null; node = node.getNext()) {
                if (node instanceof GElement) {
                    GElementEditor.openEditor(node)._paintOutline(transform, context, paintBBox, color);
                }
            }
        }
    };

    /** @override */
    GLayerEditor.prototype.toString = function () {
        return "[Object GLayerEditor]";
    };

    _.GLayerEditor = GLayerEditor;
})(this);