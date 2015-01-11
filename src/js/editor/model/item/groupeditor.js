(function (_) {
    /**
     * An editor for a shapeSet
     * @param {GGroup} set the set this editor works on
     * @class GGroupEditor
     * @extends GBlockEditor
     * @constructor
     */
    function GGroupEditor(set) {
        GBlockEditor.call(this, set);
        this._flags |= GBlockEditor.Flag.ResizeAll;
    };
    GObject.inherit(GGroupEditor, GBlockEditor);
    GElementEditor.exports(GGroupEditor, GGroup);

    /** override */
    GGroupEditor.prototype._paintOutline = function (transform, context, paintBBox, color) {
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
    GGroupEditor.prototype.toString = function () {
        return "[Object GGroupEditor]";
    };

    _.GGroupEditor = GGroupEditor;
})(this);