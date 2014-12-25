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
     * @type {Array<*>}
     * @private
     */
    GLayersPalette.prototype._layersTreeNodeMap = null;

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

    /**
     * @type {Boolean}
     * @private
     */
    GLayersPalette.prototype._blockPropagation = false;

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

        gApp.addEventListener(GApplication.DocumentEvent, this._documentEvent, this);

        this._layersTree = $('<div></div>')
            .addClass('g-list layers vtree')
            .appendTo(htmlElement);

        this._layersTree.gLayerPanel({
                container: $(this._layersTree)[0],
                renderer: this._createLayerTreeItem.bind(this),
                canDropCallback: this._canMoveLayerTreeNode.bind(this),
                moveCallback: this._moveLayerTreeNode.bind(this),
                clickCallback: this._clickLayerTreeNode.bind(this)
            });

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
            var scene = this._document.getScene();
            scene.addEventListener(GNode.AfterInsertEvent, this._afterNodeInsert, this);
            scene.addEventListener(GNode.BeforeRemoveEvent, this._beforeNodeRemove, this);
            scene.addEventListener(GNode.AfterPropertiesChangeEvent, this._afterPropertiesChange, this);
            scene.addEventListener(GNode.AfterFlagChangeEvent, this._afterFlagChange, this);
            this._init();
            this.trigger(GPalette.UPDATE_EVENT);
        } else if (event.type === GApplication.DocumentEvent.Type.Deactivated) {
            var scene = this._document.getScene();
            this._document = null;
            scene.removeEventListener(GNode.AfterInsertEvent, this._afterNodeInsert, this);
            scene.removeEventListener(GNode.BeforeRemoveEvent, this._beforeNodeRemove, this);
            scene.removeEventListener(GNode.AfterPropertiesChangeEvent, this._afterPropertiesChange, this);
            scene.removeEventListener(GNode.AfterFlagChangeEvent, this._afterFlagChange, this);
            this._clear();
            this.trigger(GPalette.UPDATE_EVENT);
        }
    };

    /** @private */
    GLayersPalette.prototype._clear = function () {
        this._layersTree.gLayerPanel('clean');
        this._layersTreeNodeMap = [];
    };

    /** @private */
    GLayersPalette.prototype._init = function () {
        // Clear layer tree and mark root opened afterwards (!!)
        this._layersTreeNodeMap = [];

        if (this._document) {
            for (var child = this._document.getScene().getFirstChild(); child !== null; child = child.getNext()) {
                if (child instanceof GLayer) {
                    this._insertLayer(child);
                }
            }
        }
    };

    /** @private */
    GLayersPalette.prototype._insertLayer = function (layerOrItem) {
        // Create an unique treeId for the new tree node
        var treeId = GUtil.uuid();

        this._layersTree.gLayerPanel('beginUpdate');

        // Either insert before or insert first but ensure to reverse order (last=top)
        var previousNodeId = layerOrItem.getPrevious() ? this._getLayerTreeNodeId(layerOrItem.getPrevious()) : null;
        if (previousNodeId) {
            this._layersTree.gLayerPanel('addNodeBefore', treeId, previousNodeId);
        } else {
            var parent = layerOrItem.getParent();
            var parentTreeNodeId = !parent || parent instanceof GScene ? null : this._getLayerTreeNodeId(parent);
            var addBeforeNodeId = null;

            if (parentTreeNodeId) {
                if (parent.getFirstChild()) {
                    addBeforeNodeId = this._getLayerTreeNodeId(parent.getFirstChild());
                }
            }

            if (addBeforeNodeId) {
                this._layersTree.gLayerPanel('addNodeBefore', treeId, addBeforeNodeId);
            } else {
                this._layersTree.gLayerPanel('prependNode', treeId, parentTreeNodeId);
            }
        }

        // Insert the mapping
        this._layersTreeNodeMap.push({
            node: layerOrItem,
            treeId: treeId
        });

        // Iterate children and add them as well
        if (layerOrItem.hasMixin(GNode.Container)) {

            for (var child = layerOrItem.getFirstChild(); child !== null; child = child.getNext()) {
                if (child instanceof GLayer || child instanceof GItem) {
                    this._insertLayer(child);
                }
            }
        }

        this._layersTree.gLayerPanel('endUpdate');
    };

    /** @private */
    GLayersPalette.prototype._updateLayer = function (layerOrItem) {
        // Gather a tree node for the item
        var treeNodeId = this._getLayerTreeNodeId(layerOrItem);

        if (treeNodeId) {
            this._layersTree.gLayerPanel('requestInvalidation');
        }
    };

    /** @private */
    GLayersPalette.prototype._removeLayer = function (layerOrItem) {
        var treeNodeId = this._getLayerTreeNodeId(layerOrItem);
        if (treeNodeId) {
            this._layersTree.gLayerPanel('removeNode', treeNodeId);

            this._removeNodeFromMap(layerOrItem);
        }
    };

    GLayersPalette.prototype._removeNodeFromMap = function (layerOrItem) {
        // Visit to remove each mapping as well
        layerOrItem.accept(function (node) {
            if (node instanceof GLayer || node instanceof GItem) {
                for (var i = 0; i < this._layersTreeNodeMap.length; ++i) {
                    if (this._layersTreeNodeMap[i].node === node) {
                        this._layersTreeNodeMap.splice(i, 1);
                        break;
                    }
                }
            }
        }.bind(this));
    };

    /**
     * @param {GNode.AfterInsertEvent} event
     * @private
     */
    GLayersPalette.prototype._afterNodeInsert = function (event) {
        if (!this._blockPropagation && (event.node instanceof GLayer || event.node instanceof GItem)) {
            this._insertLayer(event.node);
        }
    };

    /**
     * @param {GNode.BeforeRemoveEvent} event
     * @private
     */
    GLayersPalette.prototype._beforeNodeRemove = function (event) {
        if (!this._blockPropagation && (event.node instanceof GLayer || event.node instanceof GItem)) {
            this._removeLayer(event.node);
        }
    };

    /**
     * @param {GNode.AfterPropertiesChangeEvent} event
     * @private
     */
    GLayersPalette.prototype._afterPropertiesChange = function (event) {
        if (!this._blockPropagation && (event.node instanceof GLayer || event.node instanceof GItem)) {
            this._updateLayer(event.node);
        }
    };

    /**
     * @param {GNode.AfterFlagChangeEvent} event
     * @private
     */
    GLayersPalette.prototype._afterFlagChange = function (event) {
        if (!this._blockPropagation) {
            if ((event.node instanceof GLayer || event.node instanceof GItem) &&
                (event.flag === GElement.Flag.Hidden ||
                event.flag === GElement.Flag.PartialLocked ||
                event.flag === GElement.Flag.FullLocked ||
                event.flag === GNode.Flag.Selected) ||
                event.node instanceof GLayer && (event.flag === GNode.Flag.Active)) {

                this._updateLayer(event.node);
            }
        }
    };

    /** @private */
    GLayersPalette.prototype._clickLayerTreeNode = function (nodeId) {
        var layerOrItem = this._getNodeByTreeId(nodeId);
        if (layerOrItem) {
            if (layerOrItem instanceof GLayer) {
                this._document.getScene().setActiveLayer(layerOrItem);
            } else if (layerOrItem instanceof GItem) {
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

    /** @private */
    GLayersPalette.prototype._createLayerTreeItem = function (nodeId, expanded, row) {
        var layerOrItem = this._getNodeByTreeId(nodeId);
        if (layerOrItem) {
            // Iterate parents up and collect some information
            var itemLevel = 0;
            var parentHidden = false;
            var parentLockType = null;
            var parentOutlined = false;

            for (var p = layerOrItem.getParent(); p !== null; p = p.getParent()) {
                // Stop on root
                if (p instanceof GScene) {
                    break;
                }

                // Query information
                if (p instanceof GBlock) {
                    parentHidden = p.getProperty('vis') === false || parentHidden;

                    var lockType = p.getProperty('lkt');
                    if (lockType) {
                        if (!parentLockType) {
                            parentLockType = lockType;
                        } else {
                            if (lockType === GBlock.LockType.Full) {
                                parentLockType = lockType;
                            }
                        }
                    }
                }

                if (p instanceof GLayer) {
                    parentOutlined = p.getProperty('otl') === true || parentOutlined;
                }

                itemLevel += 1;
            }

            var isHidden = parentHidden || layerOrItem.getProperty('vis') === false;
            var lockType = parentLockType || layerOrItem.getProperty('lkt');
            var isOutlined = parentOutlined || (layerOrItem instanceof GLayer && layerOrItem.getProperty('otl'));

            // Gather a reference to the element container
            var container = row;
            var nodeName = layerOrItem.getProperty('name');
            nodeName = nodeName ? nodeName : layerOrItem.getNodeNameTranslated();
            var title = $('<span></span>').html(nodeName);
            title.addClass('layer-title')
                .attr('draggable', true)
                .on('dragstart', function(evt) {
                    $(this).addClass('g-dragging');
                    setTimeout(function() {
                        $(this).removeClass('g-dragging');
                    }.bind($(this)), 0);
                })
                .appendTo(container);

            // First, we'll make our title editable and toogle active/selected
            $(container)
                .toggleClass('g-active', layerOrItem.hasFlag(GNode.Flag.Active))
                .toggleClass('g-selected', layerOrItem.hasFlag(GNode.Flag.Selected))
                .gAutoEdit({
                    selector: '> .layer-title'
                })
                .on('submitvalue', function (evt, value) {
                    // TODO : I18M
                    if (value && value.trim() !== '') {
                        GEditor.tryRunTransaction(layerOrItem, function () {
                            layerOrItem.setProperty('name', value);
                        }, 'Rename Layer/Item');
                    }
                });

            // Prepend level spacers
            for (var i = 0; i < itemLevel; ++i) {
                $('<span></span>')
                    .addClass('layer-spacer')
                    .prependTo(container);
            }

            // Figure an icon for the item if any
            var icon = null;
            if (layerOrItem instanceof GLayer) {
                icon = expanded ? 'folder-open' : 'folder';
            } else if (layerOrItem instanceof GSlice) {
                icon = 'crop';
            } else if (layerOrItem instanceof GShape) {
                if (layerOrItem instanceof GText) {
                    icon = 'font';
                } else if (layerOrItem instanceof GImage) {
                    icon = 'image';
                } else if (layerOrItem instanceof GEllipse) {
                    icon = 'circle';
                } else if (layerOrItem instanceof GRectangle) {
                    icon = 'stop';
                } else if (layerOrItem instanceof GPath || layerOrItem instanceof GCompoundPath) {
                    icon = 'pencil';
                } else if (layerOrItem instanceof GPolygon) {
                    icon = 'star';
                }
            }

            if (icon) {
                $('<span></span>')
                    .addClass('layer-icon fa fa-' + icon)
                    .insertBefore(title);
            }

            // Prepend locked and visibility markers
            $('<span></span>')
                .addClass('layer-lock fa fa-fw fa-' + (!lockType ? 'unlock' : (lockType === GBlock.LockType.Full ? 'ban' : 'lock')))
                .toggleClass('layer-default', !lockType)
                // TODO : I18N
                .attr('title', 'Toggle Lock')
                .on('click', function (evt) {
                    evt.stopPropagation();
                    if (!parentLockType) {
                        // TODO : I18N
                        GEditor.tryRunTransaction(layerOrItem, function () {
                            var lockType = layerOrItem.getProperty('lkt');

                            if (!lockType) {
                                lockType = GBlock.LockType.Partial;
                            } else if (lockType === GBlock.LockType.Partial) {
                                lockType = GBlock.LockType.Full;
                            } else if (lockType === GBlock.LockType.Full) {
                                lockType = null;
                            }

                            layerOrItem.setProperty('lkt', lockType);
                        }, 'Toggle Lock');
                    }
                })
                .prependTo(container);

            $('<span></span>')
                .addClass('layer-visibility fa fa-' + (isHidden ? 'eye-slash' : 'eye'))
                .toggleClass('layer-default', !isHidden)
                // TODO : I18N
                .attr('title', 'Toggle Visibility')
                .on('click', function (evt) {
                    evt.stopPropagation();
                    if (!parentHidden) {
                        var show = !layerOrItem.getProperty('vis');

                        // Remove highlight when made invisible
                        if (!show) {
                            layerOrItem.removeFlag(GNode.Flag.Highlighted);
                        }

                        // TODO : I18N
                        GEditor.tryRunTransaction(layerOrItem, function () {
                            layerOrItem.setProperty('vis', show);
                        }, 'Toggle Visibility');

                        // Show highlight when made visible
                        if (show) {
                            layerOrItem.setFlag(GNode.Flag.Highlighted);
                        }
                    }
                })
                .on('mouseenter', function (evt) {
                    if (!layerOrItem.hasFlag(GElement.Flag.Hidden)) {
                        layerOrItem.setFlag(GNode.Flag.Highlighted);
                    }
                })
                .on('mouseleave', function (evt) {
                    if (!layerOrItem.hasFlag(GElement.Flag.Hidden)) {
                        layerOrItem.removeFlag(GNode.Flag.Highlighted);
                    }
                })
                .prependTo(container);

            // Do some special handling for layers
            if (layerOrItem instanceof GLayer) {
                // Outline Marker
                $('<span></span>')
                    .addClass('layer-outline fa fa-' + (isOutlined ? 'circle-o' : 'circle'))
                    .toggleClass('layer-default', !isOutlined)
                    // TODO : I18N
                    .attr('title', 'Toggle Outline')
                    .on('click', function (evt) {
                        evt.stopPropagation();
                        if (!parentHidden) {
                            // TODO : I18N
                            GEditor.tryRunTransaction(layerOrItem, function () {
                                layerOrItem.setProperty('otl', !layerOrItem.getProperty('otl'));
                            }, 'Toggle Layer Outline');
                        }
                    })
                    .appendTo(container);

                var patternChange = function (evt, color) {
                    // TODO : I18N
                    GEditor.tryRunTransaction(layerOrItem, function () {
                        var myColor = layerOrItem.getProperty('cls');
                        layerOrItem.setProperty('cls', color);

                        // Apply color to all child layers recursively that
                        // do have the same color as our layer
                        layerOrItem.acceptChildren(function (node) {
                            if (node instanceof GLayer) {
                                var childColor = node.getProperty('cls');
                                if (GUtil.equals(childColor, myColor)) {
                                    node.setProperty('cls', color);
                                }
                            }
                        });
                    }, 'Change Layer Color');
                }

                $('<span></span>')
                    .addClass('layer-color')
                    .gPatternTarget()
                    .gPatternTarget('types', [GColor])
                    .gPatternTarget('value', layerOrItem.getProperty('cls'))
                    .css('background', GPattern.asCSSBackground(layerOrItem.getProperty('cls')))
                    .on('click', function (evt) {
                        evt.stopPropagation();

                        var $target = $(evt.target);

                        $.gPatternPicker.open({
                            target: $target,
                            swatches: layerOrItem.getWorkspace().getSwatches(),
                            types: [GColor],
                            value: $target.gPatternTarget('value'),
                            changeCallback: patternChange
                        });
                    }.bind(this))
                    .on('patternchange', patternChange)
                    .appendTo(container);
            }
        }
    };

    /** @private */
    GLayersPalette.prototype._canMoveLayerTreeNode = function (parentNodeId, refNodeId, movedNodeId) {
        return this._getLayerTreeNodeMoveInfo(parentNodeId, refNodeId, movedNodeId) !== null;
    };

    /** @private */
    GLayersPalette.prototype._moveLayerTreeNode = function (parentNodeId, refNodeId, movedNodeId) {
        var moveInfo = this._getLayerTreeNodeMoveInfo(parentNodeId, refNodeId, movedNodeId);
        if (moveInfo) {
            this._blockPropagation = true;
            // TODO : I18N
            GEditor.tryRunTransaction(this._document.getScene(), function () {
                moveInfo.source.getParent().removeChild(moveInfo.source);
                moveInfo.parent.insertChild(moveInfo.source, moveInfo.before);
            }.bind(this), 'Move Layer/Item');

            this._blockPropagation = false;
        }
    };

    /**
     * @param {*} parentNodeId
     * @param {*} refNodeId
     * @param {*} movedNodeId
     * @return {{parent: GNode, before: GNode, source: GNode}} the result of the move
     * or null if the actual move is not allowed
     * @private
     */
    GLayersPalette.prototype._getLayerTreeNodeMoveInfo = function (parentNodeId, refNodeId, movedNodeId) {
        var parent = parentNodeId ? this._getNodeByTreeId(parentNodeId) : this._document.getScene();
        var before = refNodeId ? this._getNodeByTreeId(refNodeId) : null;
        var source = movedNodeId ? this._getNodeByTreeId(movedNodeId) : null;

        if (source && parent && source.validateInsertion(parent, before)) {
            return {
                parent: parent,
                before: before,
                source: source
            };
        }

        return null;
    };

    /**
     * @param {GNode} node
     * @return {*}
     * @private
     */
    GLayersPalette.prototype._getLayerTreeNodeId = function (node) {
        if (this._layersTreeNodeMap) {
            for (var i = 0; i < this._layersTreeNodeMap.length; ++i) {
                if (this._layersTreeNodeMap[i].node === node) {
                    return this._layersTreeNodeMap[i].treeId;
                }
            }
        }
    };

    /**
     * @param {*} nodeId
     * @return {GNode}
     * @private
     */
    GLayersPalette.prototype._getNodeByTreeId = function (nodeId) {
        if (this._layersTreeNodeMap) {
            for (var i = 0; i < this._layersTreeNodeMap.length; ++i) {
                if (this._layersTreeNodeMap[i].treeId === nodeId) {
                    return this._layersTreeNodeMap[i].node;
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