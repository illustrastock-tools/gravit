(function ($) {
    function canDrop(parent, reference, dropNode) {
        var $this = $(this);
        var res = true;
        var data = $this.data('glayerpanel');
        if (data.options.canDropCallback) {
            var targetNode = parent.id ? getNodeByTreeId.call(this, parent.id) : $(this).data('glayerpanel').treeOwner;
            var beforeNode = reference ? getNodeByTreeId.call(this, reference.id) : null;
            var movedNode = getNodeByTreeId.call(this, dropNode.id);
            res = data.options.canDropCallback(targetNode, beforeNode, movedNode);
        }
        return res;
    };

    /**
     * @param {GNode} targetNode
     * @param {GNode} beforeNode
     * @param {GNode} movedNode
     * @return {Boolean} if move allowed
     */
    function canDropCallback(targetNode, beforeNode, movedNode) {
        return movedNode && targetNode && movedNode.validateInsertion(targetNode, beforeNode);
    };

    function moveHere(parent, reference, dropNode) {
        var $this = $(this);
        var data = $this.data('glayerpanel');
        if (data.options.moveCallback) {
            var targetNode = parent.id ? getNodeByTreeId.call(this, parent.id) : $(this).data('glayerpanel').treeOwner;
            var beforeNode = reference ? getNodeByTreeId.call(this, reference.id) : null;
            var movedNode = getNodeByTreeId.call(this, dropNode.id);
            data.options.moveCallback(targetNode, beforeNode, movedNode);
        }
    };

    function nodeClick(node) {
        var $this = $(this);
        var data = $this.data('glayerpanel');
        if (data.options.clickCallback) {
            var layerOrItem = getNodeByTreeId.call(this, node.id);
            data.options.clickCallback(layerOrItem);
        }
    };

    function renderer(node, row) {
        var $this = $(this);
        var data = $this.data('glayerpanel');
        if (data.options.renderer) {
            data.options.renderer(node.id, node.expanded, row);
        }
    };

    function expandRenderer(elem) {
        var $this = $(this);
        if (elem.id === VTree.COLLAPSE_ID) {
            $(elem).addClass($this.data('glayerpanel').options.collapseStyle);
        } else if (elem.id === VTree.EXPAND_ID) {
            $(elem).addClass($this.data('glayerpanel').options.expandStyle);
        }
    };

    function getRefNode(vtree, refNodeId) {
        var refNode = null;
        vtree.acceptChildren(function(node) {
            if (node.id === refNodeId) {
                refNode = node;
                return false;
            }
            return true;
        }, false);
        return refNode;
    };

    /**
     * @param {*} nodeId
     * @return {GNode}
     */
    function getNodeByTreeId(nodeId) {
        var layersTreeNodeMap = $(this).data('glayerpanel').layersTreeNodeMap;
        for (var i = 0; i < layersTreeNodeMap.length; ++i) {
            if (layersTreeNodeMap[i].treeId === nodeId) {
                return layersTreeNodeMap[i].node;
            }
        }
    };

    /**
     * @param {GNode} node
     * @return {*}
     */
    function getLayerTreeNodeId(node) {
        var layersTreeNodeMap = $(this).data('glayerpanel').layersTreeNodeMap;
        for (var i = 0; i < layersTreeNodeMap.length; ++i) {
            if (layersTreeNodeMap[i].node === node) {
                return layersTreeNodeMap[i].treeId;
            }
        }
    };

    function removeNodeFromMap(layerOrItem) {
        // Visit to remove each mapping as well
        layerOrItem.accept(function (node) {
            if (node instanceof GLayer || node instanceof GItem) {
                var layersTreeNodeMap = $(this).data('glayerpanel').layersTreeNodeMap;
                for (var i = 0; i < layersTreeNodeMap.length; ++i) {
                    if (layersTreeNodeMap[i].node === node) {
                        layersTreeNodeMap.splice(i, 1);
                        break;
                    }
                }
            }
        }.bind(this));
    };

    /**
     * @param {GNode} targetNode
     * @param {GNode} beforeNode
     * @param {GNode} movedNode
     * @return {Boolean} if move allowed
     */
    function canDropCallback(targetNode, beforeNode, movedNode) {
        return movedNode && targetNode && movedNode.validateInsertion(targetNode, beforeNode);
    };

    function createLayerTreeItem(nodeId, expanded, row) {
        var layerOrItem = getNodeByTreeId.call(this, nodeId);
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
                    }.bind(this), 0);
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

    function vtreeAddNodeBefore(treeNodeId, refNodeId) {
        var newNode = new TreeNodeNamed(treeNodeId);
        var $this = $(this);
        var vtree = $this.data('glayerpanel').vtree;
        var refNode = getRefNode(vtree, refNodeId);
        vtree.insertNodeBefore(refNode, newNode);
    };

    function vtreePrependNode(treeNodeId, refNodeId) {
        var newNode = new TreeNodeNamed(treeNodeId);
        var $this = $(this);
        var vtree = $this.data('glayerpanel').vtree;
        var refNode = getRefNode(vtree, refNodeId);
        vtree.prependNode(refNode, newNode);
    };

    function vtreeRemoveNode(treeNodeId) {
        var vtree = $(this).data('glayerpanel').vtree;
        var refNode = getRefNode(vtree, treeNodeId);
        vtree.removeNode(refNode);
    };

    function insertLayer(layerOrItem) {
        // Create an unique treeId for the new tree node
        var treeId = GUtil.uuid();
        var data = $(this).data('glayerpanel');
        var vtree = data.vtree;
        vtree.beginUpdate();

        // Either insert before or insert first but ensure to reverse order (last=top)
        var previousNodeId = layerOrItem.getPrevious() ? getLayerTreeNodeId.call(this, layerOrItem.getPrevious()) : null;
        if (previousNodeId) {
            vtreeAddNodeBefore.call(this, treeId, previousNodeId);
        } else {
            var parent = layerOrItem.getParent();
            var parentTreeNodeId = !parent || parent instanceof GScene ? null : getLayerTreeNodeId.call(this, parent);
            var addBeforeNodeId = null;

            if (parentTreeNodeId) {
                if (parent.getFirstChild()) {
                    addBeforeNodeId = getLayerTreeNodeId.call(this, parent.getFirstChild());
                }
            }

            if (addBeforeNodeId) {
                vtreeAddNodeBefore.call(this, treeId, addBeforeNodeId);
            } else {
                vtreePrependNode.call(this, treeId, parentTreeNodeId);
            }
        }

        // Insert the mapping
        data.layersTreeNodeMap.push({
            node: layerOrItem,
            treeId: treeId
        });

        // Iterate children and add them as well
        if (layerOrItem.hasMixin(GNode.Container)) {

            for (var child = layerOrItem.getFirstChild(); child !== null; child = child.getNext()) {
                if (child instanceof GLayer || child instanceof GItem) {
                    insertLayer.call(this, child);
                }
            }
        }

        vtree.endUpdate();
    };

    function updateLayer(layerOrItem) {
        // Gather a tree node for the item
        var treeNodeId = getLayerTreeNodeId.call(this, layerOrItem);

        if (treeNodeId) {
            $(this).data('glayerpanel').vtree.requestInvalidation();
        }
    };

    function removeLayer(layerOrItem) {
        // Gather a tree node for the item
        var treeNodeId = getLayerTreeNodeId.call(this, layerOrItem);

        if (treeNodeId) {
            vtreeRemoveNode.call(this, treeNodeId);
            removeNodeFromMap.call(this, layerOrItem);
        }
    };

    /**
     * @param {GNode.AfterInsertEvent} event
     */
    function afterNodeInsert(event) {
        var data = $(this).data('glayerpanel');
        if (!data.blockHandlers && (event.node instanceof GLayer || event.node instanceof GItem)) {
            insertLayer.call(this, event.node);
        }
    };

    /**
     * @param {GNode.BeforeRemoveEvent} event
     */
    function beforeNodeRemove(event) {
        var data = $(this).data('glayerpanel');
        if (!data.blockHandlers && (event.node instanceof GLayer || event.node instanceof GItem)) {
            removeLayer.call(this, event.node);
        }
    };

    /**
     * @param {GNode.AfterPropertiesChangeEvent} event
     */
    function afterPropertiesChange(event) {
        var data = $(this).data('glayerpanel');
        if (!data.blockHandlers && (event.node instanceof GLayer || event.node instanceof GItem)) {
            updateLayer.call(this, event.node);
        }
    };

    /**
     * @param {GNode.AfterFlagChangeEvent} event
     */
    function afterFlagChange(event) {
        var data = $(this).data('glayerpanel');
        if (!data.blockHandlers) {
            if ((event.node instanceof GLayer || event.node instanceof GItem) &&
                (event.flag === GElement.Flag.Hidden ||
                    event.flag === GElement.Flag.PartialLocked ||
                    event.flag === GElement.Flag.FullLocked ||
                    event.flag === GNode.Flag.Selected) ||
                event.node instanceof GLayer && (event.flag === GNode.Flag.Active)) {

                updateLayer.call(this, event.node);
            }
        }
    };

    function clean() {
        var data = $(this).data('glayerpanel');
        data.vtree.clean();
        data.layersTreeNodeMap = [];
        data.treeOwner = null;
    };

    var methods = {
        init: function (options) {
            options = $.extend({
                // {String} a tree node visible element CSS style name. If not passed, the default style name is used.
                nodeStyle: 'layer-row',
                expandStyle: 'layer-icon fa fa-caret-right',
                collapseStyle: 'layer-icon fa fa-caret-down',
                freeHeight: 7,
                insertIntoStyle: 'g-drop',
                upSeparatorSpan1Style: 'g-up-separator-span1',
                upSeparatorSpan2Style: 'g-up-separator-span2',
                downSeparatorSpan1Style: 'g-down-separator-span1',
                downSeparatorSpan2Style: 'g-down-separator-span2',
                // {Function(TreeNode, Element)} renderer to fill the tree node visible element with content
                renderer: createLayerTreeItem.bind(this),
                // {Function(Element)} renderer for the 'expand' span element
                expandRenderer: expandRenderer.bind(this),
                separatorRenderer: null,
                canDropCallback: canDropCallback.bind(this),
                moveCallback: null,
                clickCallback: null
            }, options);

            return this.each(function () {
                // {Element} a HTML container for displaying the tree
                var container = this;
                var $this = $(this)
                    .addClass('g-layer-panel')
                    .data('glayerpanel', {
                        vtree: new VTree(container, renderer.bind(this), options.nodeStyle,
                            options.expandRenderer ? options.expandRenderer : null,
                            options.expandStyle == options.collapseStyle ? options.expandStyle : null,
                            options.separatorRenderer ? options.separatorRenderer : null,
                            options.freeHeight, options.insertIntoStyle,
                            canDrop.bind(this), moveHere.bind(this), nodeClick.bind(this),
                            options.upSeparatorSpan1Style, options.upSeparatorSpan2Style,
                            options.downSeparatorSpan1Style,  options.downSeparatorSpan2Style),
                        options: options,
                        layersTreeNodeMap: [],
                        treeOwner: null
                    });
            });
        },

        refresh: function () {
            $(this).data('glayerpanel').vtree.refresh();
        },

        treeOwner: function (treeOwner) {
            var $this = $(this);
            var data = $this.data('glayerpanel');
            if (!arguments.length) {
                return data.treeOwner;
            } else if (treeOwner !== data.treeOwner) {
                if (data.treeOwner && data.treeOwner.hasMixin(GEventTarget)) {
                    data.treeOwner.removeEventListener(GNode.AfterInsertEvent, data.afterNodeInsertHandler, this);
                    data.treeOwner.removeEventListener(GNode.BeforeRemoveEvent, data.beforeNodeRemoveHandler, this);
                    data.treeOwner.removeEventListener(GNode.AfterPropertiesChangeEvent, data.afterPropertiesChangeHandler, this);
                    data.treeOwner.removeEventListener(GNode.AfterFlagChangeEvent, data.afterFlagChangeHandler, this);
                }
                clean.call(this);
                data.treeOwner = treeOwner;
                if (data.treeOwner) {
                    if (data.treeOwner.hasMixin(GEventTarget)) {
                        data.afterNodeInsertHandler = afterNodeInsert.bind(this);
                        data.beforeNodeRemoveHandler = beforeNodeRemove.bind(this);
                        data.afterPropertiesChangeHandler = afterPropertiesChange.bind(this);
                        data.afterFlagChangeHandler = afterFlagChange.bind(this);

                        data.treeOwner.addEventListener(GNode.AfterInsertEvent, data.afterNodeInsertHandler, this);
                        data.treeOwner.addEventListener(GNode.BeforeRemoveEvent, data.beforeNodeRemoveHandler, this);
                        data.treeOwner.addEventListener(GNode.AfterPropertiesChangeEvent, data.afterPropertiesChangeHandler, this);
                        data.treeOwner.addEventListener(GNode.AfterFlagChangeEvent, data.afterFlagChangeHandler, this);
                    }
                    for (var child = data.treeOwner.getFirstChild(); child !== null; child = child.getNext()) {
                        if (child instanceof GLayer || child instanceof GItem) {
                            insertLayer.call(this, child);
                        }
                    }
                }
            }
            return this;
        },

        blockHandlers: function (blockHandlers) {
            $(this).data('glayerpanel').blockHandlers = !!blockHandlers;
        }
    };

    /**
     * Block to transform divs to swatch panels
     */
    $.fn.gLayerPanel = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.myPlugin');
        }
    }

}(jQuery));