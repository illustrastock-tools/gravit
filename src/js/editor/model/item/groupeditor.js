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

    /** @override */
    GGroupEditor.prototype.toString = function () {
        return "[Object GGroupEditor]";
    };

    _.GGroupEditor = GGroupEditor;
})(this);