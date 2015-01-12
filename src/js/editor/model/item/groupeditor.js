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
        if (!this._transform || !this._editors) {
            GBlockEditor.prototype._paintOutline.call(this, transform, context, paintBBox, color);
        } else {
            // We are in transformation, show children outline instead of self bbox
            for (var i = 0; i < this._editors.length; ++i) {
                var ed = this._editors[i];
                ed._paintOutline(transform, context, paintBBox, color);
            }
        }
    };

    /** @override */
    GGroupEditor.prototype._setTransform = function (transform) {
        var element = this.getElement();
        for (var node = element.getFirstChild(); node != null; node = node.getNext()) {
            if (node instanceof GElement) {
                var ed = GElementEditor.openEditor(node);
                ed._setTransform(transform);
            }
        }

        GBlockEditor.prototype._setTransform.call(this, transform);
    };

    /** @override */
    GGroupEditor.prototype.resetTransform = function () {
        for (var i = this._editors ? this._editors.length : 0; i > 0; --i) {
            var ed = this._editors[i-1];
            ed.resetTransform();
            GElementEditor.closeEditor(ed.getElement());
        }

        GBlockEditor.prototype.resetTransform.call(this);
    };

    /** @override */
    GGroupEditor.prototype.toString = function () {
        return "[Object GGroupEditor]";
    };

    _.GGroupEditor = GGroupEditor;
})(this);