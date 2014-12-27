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
            // Create a rectangle instead of an image for the preview
            this._elementPreview = new GRectangle();
            var imageTransform = this._element.getTransform();

            var imageSourceBBox = this._element.getSourceBBox();

            var rectToImageTransform = new GTransform(imageSourceBBox.getWidth() / 2, 0, 0, imageSourceBBox.getHeight() / 2,
                imageSourceBBox.getX() + imageSourceBBox.getWidth() / 2, imageSourceBBox.getY() + imageSourceBBox.getHeight() / 2)

            if (imageTransform) {
                rectToImageTransform = rectToImageTransform.multiplied(imageTransform);
            }

            this._elementPreview.setProperty('trf', rectToImageTransform);
        }
    };

    /** @override */
    GImageEditor.prototype.toString = function () {
        return "[Object GImageEditor]";
    };

    _.GImageEditor = GImageEditor;
})(this);