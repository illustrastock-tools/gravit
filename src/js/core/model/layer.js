(function (_) {
    /**
     * An element representing a layer
     * @class GLayer
     * @extends GBlock
     * @mixes GNode.Container
     * @mixes GElement.Transform
     * @mixes GElement.Stylable
     * @constructor
     */
    function GLayer() {
        GBlock.call(this);
        this._setDefaultProperties(GLayer.VisualProperties);
    }

    GNode.inheritAndMix("layer", GLayer, GBlock, [GNode.Container, GElement.Transform, GElement.Stylable]);

    /**
     * The visual properties of a layer with their default values
     */
    GLayer.VisualProperties = {
        // Whether layer is outlined or not
        otl: false,
        // Whether layer is printable or not
        prt: true,
        // The color of the layer
        cls: new GRGBColor([0, 168, 255])
    };

    /** @override */
    GLayer.prototype.validateInsertion = function (parent, reference) {
        return parent instanceof GLayer || parent instanceof GScene;
    };

    /** @override */
    GLayer.prototype._preparePaint = function (context) {
        if (GBlock.prototype._preparePaint.call(this, context)) {
            if (!this.$prt && !context.configuration.isAnnotationsVisible(context)) {
                return false;
            }

            if (context.configuration.paintMode !== GScenePaintConfiguration.PaintMode.Outline && this.$otl) {
                context.outlineColors.push(this.$cls);
            }

            return true;
        }
        return false;
    };

    /** @override */
    GLayer.prototype._finishPaint = function (context) {
        if (context.configuration.paintMode !== GScenePaintConfiguration.PaintMode.Outline && this.$otl) {
            context.outlineColors.pop();
        }

        GBlock.prototype._finishPaint.call(this, context);
    };

    /** @override */
    GLayer.prototype._paintStyleContent = function (context, contentPaintBBox, styleLayers, orderedEffects, effectCanvas) {
        this._paintChildren(context);
    };

    /** @override */
    GLayer.prototype._detailHitTest = function (location, transform, tolerance, force) {
        return new GElement.HitResultInfo(this);
    };

    /** @override */
    GLayer.prototype._handleChange = function (change, args) {
        if (change === GNode._Change.Store) {
            this.storeProperties(args, GLayer.VisualProperties, function (property, value) {
                if (property === 'cls' && value) {
                    return GPattern.serialize(value);
                }
                return value;
            });

            // Store activeness flag which is special to layers
            if (this.hasFlag(GNode.Flag.Active)) {
                args.__active = true;
            }
        } else if (change === GNode._Change.Restore) {
            this.restoreProperties(args, GLayer.VisualProperties, function (property, value) {
                if (property === 'cls' && value) {
                    return GPattern.deserialize(value);
                }
                return value;
            });

            // Restore activeness flag which is special to pages and layers
            if (args.__active) {
                this.setFlag(GNode.Flag.Active);
            }
        }
        
        this._handleVisualChangeForProperties(change, args, GLayer.VisualProperties);

        GBlock.prototype._handleChange.call(this, change, args);
    };

    _.GLayer = GLayer;
})(this);