(function (_) {

    /**
     * Layers Palette
     * @class GLayersPalette
     * @extends GPalette
     * @constructor
     */
    function GLayersPalette() {
        GPalette.call(this);
    }

    GObject.inherit(GLayersPalette, GPalette);

    GLayersPalette.ID = "layers";
    GLayersPalette.TITLE = new GLocale.Key(GLayersPalette, "title");

    /**
     * @type {JQuery}
     * @private
     */
    GLayersPalette.prototype._layersTree = null;

    /**
     * @type {JQuery}
     * @private
     */
    GLayersPalette.prototype._layerAddControl = null;

    /**
     * @type {JQuery}
     * @private
     */
    GLayersPalette.prototype._layerDeleteControl = null;

    /** @override */
    GLayersPalette.prototype.getId = function () {
        return GLayersPalette.ID;
    };

    /** @override */
    GLayersPalette.prototype.getTitle = function () {
        return GLayersPalette.TITLE;
    };

    /** @override */
    GLayersPalette.prototype.getGroup = function () {
        return "structure";
    };

    /** @override */
    GLayersPalette.prototype.isEnabled = function () {
        return this._document !== null;
    };

    /** @override */
    GLayersPalette.prototype.isAutoSize = function () {
        return true;
    };

    /** @override */
    GLayersPalette.prototype.init = function (htmlElement, controls) {
        GPalette.prototype.init.call(this, htmlElement, controls);

        this._layersTree = $('<div></div>')
            .addClass('g-list layers')
            .appendTo(htmlElement);

        this._layersTree.gLayerPanel({
                moveCallback: this._moveLayerTreeNodeCallback.bind(this),
                clickCallback: this._clickLayerTreeNodeCallback.bind(this)
            });

        gApp.addEventListener(GApplication.DocumentEvent, this._documentEvent, this);

        this._layerAddControl =
            $('<button></button>')
                // TODO : I18N
                .attr('title', 'Add Layer')
                .on('click', function () {
                    gApp.executeAction(GAddLayerAction.ID);
                }.bind(this))
                .append($('<span></span>')
                    .addClass('fa fa-plus'))
                .appendTo(controls);

        this._layerDeleteControl =
            $('<button></button>')
                // TODO : I18N
                .attr('title', 'Delete Layer')
                .on('click', function () {
                    gApp.executeAction(GDeleteLayerAction.ID);
                }.bind(this))
                .append($('<span></span>')
                    .addClass('fa fa-trash-o'))
                .appendTo(controls);
    };

    GLayersPalette.prototype.refresh = function () {
        this._layersTree.gLayerPanel('refresh');
    };

    GLayersPalette.prototype._documentEvent = function (event) {
        if (event.type === GApplication.DocumentEvent.Type.Activated) {
            this._document = event.document;
            if (this._document) {
                this._layersTree.gLayerPanel('treeOwner', this._document.getScene());
            }
            this.trigger(GPalette.UPDATE_EVENT);
        } else if (event.type === GApplication.DocumentEvent.Type.Deactivated) {
            if (this._document) {
                this._layersTree.gLayerPanel('treeOwner', null);
            }
            this._document = null;
            this.trigger(GPalette.UPDATE_EVENT);
        }
    };

    /** @private */
    GLayersPalette.prototype._moveLayerTreeNodeCallback = function (targetNode, beforeNode, movedNode) {
        if (movedNode && targetNode) {
            this._layersTree.gLayerPanel('blockHandlers', true);
            // TODO : I18N
            GEditor.tryRunTransaction(
                this._document.getScene(),
                function () {
                    movedNode.getParent().removeChild(movedNode);
                    targetNode.insertChild(movedNode, beforeNode);
                }.bind(this), 'Move Layer/Item');

            this._layersTree.gLayerPanel('blockHandlers', false);
        }
    };

    /** @private */
    GLayersPalette.prototype._clickLayerTreeNodeCallback = function (layerOrItem) {
        if (layerOrItem) {
            this._document.getScene().updateActiveLayerForElem(layerOrItem);
            if (layerOrItem instanceof GItem) {
                if (ifPlatform.modifiers.shiftKey || !layerOrItem.hasFlag(GNode.Flag.Selected)) {
                    // Add element to selection
                    this._document.getEditor().updateSelection(ifPlatform.modifiers.shiftKey, [layerOrItem]);
                } else if (layerOrItem.hasFlag(GNode.Flag.Selected)) {
                    // Clear selection leaving only the one element
                    this._document.getEditor().clearSelection([layerOrItem]);
                }
            }
        }
    };

    /** @override */
    GLayersPalette.prototype.toString = function () {
        return "[Object GLayersPalette]";
    };

    _.GLayersPalette = GLayersPalette;
})(this);