(function (_) {
    /**
     * A base editor for an image
     * @param {GImage} image the image this editor works on
     * @class GImageEditor
     * @extends GShapeEditor
     * @constructor
     */
    function GImageEditor(image) {
        GShapeEditor.call(this, image);
        this._flags |= GBlockEditor.Flag.ResizeAll;
    };
    GObject.inherit(GImageEditor, GShapeEditor);
    GElementEditor.exports(GImageEditor, GImage);

    /** @override */
    GImageEditor.prototype.initialSetup = function () {
        // NO-OP as image shouldn't gain a default style
    };

    /** @override */
    GImageEditor.prototype.createElementPreview = function () {
        if (!this._elementPreview) {
            var imageSourceBBox = this._element.getSourceBBox();
            // Create a rectangle instead of an image for the preview
            this._elementPreview = new GRectangle(imageSourceBBox.getX(), imageSourceBBox.getY(), imageSourceBBox.getWidth(), imageSourceBBox.getHeight());
            this._elementPreview.transferProperties(this._element, [GShape.GeometryProperties]);
        }
    };

    /** @override */
    GImageEditor.prototype.canApplyTransform = function () {
        return this._elementPreview || GShapeEditor.prototype.canApplyTransform.call(this);
    };

    /** @override */
    GImageEditor.prototype.applyTransform = function (element) {
        if (element && this._elementPreview) {
            element.transferProperties(this._elementPreview, [GShape.GeometryProperties]);
            this.resetTransform();
        } else {
            GShapeEditor.prototype.applyTransform.call(this, element);
        }
    };

    /** @override */
    GImageEditor.prototype.toString = function () {
        return "[Object GImageEditor]";
    };

    _.GImageEditor = GImageEditor;
})(this);