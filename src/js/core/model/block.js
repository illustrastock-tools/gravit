(function (_) {
    /**
     * A block element that supports properties and storage
     * @class GBlock
     * @extends GElement
     * @mixes GNode.Properties
     * @mixes GNode.Store
     * @constructor
     */
    function GBlock() {
        GElement.call(this);
        this._setDefaultProperties(GBlock.VisualProperties, GBlock.MetaProperties);
    }

    GObject.inheritAndMix(GBlock, GElement, [GNode.Properties, GNode.Store]);

    /**
     * @enum
     */
    GBlock.LockType = {
        Partial: 'P',
        Full: 'F'
    };

    /**
     * The visual properties of a block with their default values
     */
    GBlock.VisualProperties = {
        /** Visibility */
        vis: true
    };

    /**
     * The meta properties of a block with their default values
     */
    GBlock.MetaProperties = {
        /** Name */
        name: null,
        /** Locked type (GBlock.LockType) */
        lkt: null
    };

    /** @override */
    GBlock.prototype.assignFrom = function (other) {
        GElement.prototype.assignFrom.call(this, other);

        if (other instanceof GBlock) {
            this.transferProperties(other, [GBlock.VisualProperties, GBlock.MetaProperties]);
        }
    };

    /**
     * Returns the label of the block which is either the name
     * of the block if it has one or the name of the block's type
     * @return {String}
     */
    GBlock.prototype.getLabel = function () {
        if (this.$name && this.$name !== "") {
            return this.$name;
        }
        return this.getNodeNameTranslated();
    };

    /**
     * Returns the owner layer of this block if any
     * @return {GLayer}
     */
    GBlock.prototype.getOwnerLayer = function () {
        for (var p = this.getParent(); p !== null; p = p.getParent()) {
            if (p instanceof GLayer) {
                return p;
            }
        }
        return null;
    };

    /**
     * Returns the root layer of this block if any
     * @return {GLayer}
     */
    GBlock.prototype.getRootLayer = function () {
        var lastLayer = null;
        for (var p = this.getParent(); p !== null; p = p.getParent()) {
            if (p instanceof GLayer) {
                lastLayer = p;
            }
        }
        return lastLayer;
    };

    /** @override */
    GBlock.prototype._handleChange = function (change, args) {
        if (change === GNode._Change.Store) {
            this.storeProperties(args, GBlock.VisualProperties);
            this.storeProperties(args, GBlock.MetaProperties);
        } else if (change === GNode._Change.Restore) {
            this.restoreProperties(args, GBlock.VisualProperties);
            this.restoreProperties(args, GBlock.MetaProperties);
        } else if (change == GNode._Change.AfterPropertiesChange) {
            /** @type {{properties: Array<String>, values: Array<*>}} */
            var propertyArgs = args;

            // React on various known property changes
            var visibilityChange = propertyArgs.properties.indexOf('vis') >= 0;
            var lockedChange = propertyArgs.properties.indexOf('lkt') >= 0;

            if (visibilityChange || lockedChange) {
                this.accept(function (node) {
                    if (node instanceof GElement) {
                        if (visibilityChange) {
                            this._updateElementVisibility(node);
                        }

                        if (lockedChange) {
                            this._updateElementLock(node);
                        }
                    }
                }.bind(this));
            }
        }
        GElement.prototype._handleChange.call(this, change, args);
    };

    /**
     * @param {GElement} element
     * @private
     */
    GBlock.prototype._updateElementVisibility = function (element) {
        var isVisible = this.getProperty('vis');

        if (isVisible && element instanceof GBlock) {
            isVisible = element.getProperty('vis');
        }

        if (isVisible) {
            element.removeFlag(GElement.Flag.Hidden);

            // Making something visible needs to invalidate parent's geometry
            if (element.getParent()) {
                element.getParent()._notifyChange(GElement._Change.ChildGeometryUpdate, element);
            }

            element._requestInvalidation();
        } else {
            element._requestInvalidation();
            element.setFlag(GElement.Flag.Hidden);
        }
    };

    /**
     * @param {GElement} element
     * @private
     */
    GBlock.prototype._updateElementLock = function (element) {
        var lockType = this.getProperty('lkt');

        if (!lockType && element instanceof GBlock) {
            lockType = element.getProperty('lkt');
        }

        if (lockType) {
            switch (lockType) {
                case GBlock.LockType.Full:
                    element.setFlag(GElement.Flag.FullLocked);
                // fall-through intended
                case GBlock.LockType.Partial:
                    element.setFlag(GElement.Flag.PartialLocked);
                    break;
            }
        } else {
            element.removeFlag(GElement.Flag.PartialLocked);
            element.removeFlag(GElement.Flag.FullLocked);
        }
    };

    _.GBlock = GBlock;
})(this);