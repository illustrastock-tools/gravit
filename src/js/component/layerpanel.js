(function ($) {

    function updateSelectedSwatch($this, swatch) {
        if ($this.data('glayerpanel').options.allowSelect) {
            $this.find('.swatch-block').each(function (index, element) {
                var $element = $(element);
                $element
                    .toggleClass('selected', $element.data('swatch') === swatch);
            });
        }
    };

    function canDrop(parent, reference, dropNode) {
        var $this = $(this);
        var res = true;
        var data = $this.data('glayerpanel');
        if (data.options.canDropCallback) {
            res = data.options.canDropCallback(parent.id, reference ? reference.id : null, dropNode.id);
        }
        return res;
    };

    function moveHere(parent, reference, dropNode) {
        var $this = $(this);
        //$this.trigger('moveHere', parent.id, reference.id, dropNode.id);
        var data = $this.data('glayerpanel');
        if (data.options.moveCallback) {
            data.options.moveCallback(parent.id, reference ? reference.id : null, dropNode.id);
        }
    };

    function nodeClick(node) {
        var $this = $(this);
        var data = $this.data('glayerpanel');
        if (data.options.clickCallback) {
            data.options.clickCallback(node.id);
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
        vtree._root.acceptChildren(function(node) {
            if (node.id === refNodeId) {
                refNode = node;
                return false;
            }
            return true;
        }, false);
        return refNode;
    };

    function createLayerTreeItem(nodeId, expanded, row) {
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


    var methods = {
        init: function (options) {
            options = $.extend({
                // {Element} a HTML container for displaying the tree
                container: $(this)[0],
                // {Function(TreeNode, Element)} renderer to fill the tree node visible element with content
                renderer: null,
                // {String} a tree node visible element CSS style name. If not passed, the default style name is used.
                nodeStyle: 'layer-row',
                // {Function(Element)} renderer for the 'expand' span element
                expandRenderer: expandRenderer,
                expandStyle: 'layer-icon fa fa-caret-right',
                collapseStyle: 'layer-icon fa fa-caret-down',
                freeHeight: 7,
                insertIntoStyle: 'g-drop',
                upSeparatorStyle: 'g-up-separator-span1',
                downSeparatorStyle: 'g-down-separator-span1',
                paddingLeft: 50,
                rowHeight: 30,
                canDropCallback: null,
                moveCallback: null,
                clickCallback: null
            }, options);

            return this.each(function () {
                var self = this;
                var $this = $(this);
                $this.data('glayerpanel', {
                        vtree: new VTree(options.container, renderer.bind($(this)), options.nodeStyle,
                            options.expandRenderer.bind($(this)),
                            null, null, options.insertIntoStyle,
                            canDrop.bind($(this)), moveHere.bind($(this)), nodeClick.bind($(this)),
                            options.upSeparatorStyle, 'g-up-separator-span2', options.downSeparatorStyle, 'g-down-separator-span2'),
                        options: options
                    });
            });
        },

        addNodeBefore: function (treeNodeId, refNodeId) {
            var newNode = new TreeNodeNamed(treeNodeId);
            var $this = $(this);
            var vtree = $this.data('glayerpanel').vtree;
            var refNode = getRefNode(vtree, refNodeId);
            vtree.insertNodeBefore(refNode, newNode);
        },

        prependNode: function (treeNodeId, refNodeId) {
            var newNode = new TreeNodeNamed(treeNodeId);
            var $this = $(this);
            var vtree = $this.data('glayerpanel').vtree;
            var refNode = getRefNode(vtree, refNodeId);
            vtree.prependNode(refNode, newNode);
        },

        // TODO: add appendNode and addNodeAfter

        removeNode: function (treeNodeId) {
            var vtree = $(this).data('glayerpanel').vtree;
            var refNode = getRefNode(vtree, treeNodeId);
            vtree.removeNode(refNode);
        },

        beginUpdate: function () {
            $(this).data('glayerpanel').vtree.beginUpdate();
        },

        endUpdate: function () {
            var $this = $(this);
            $(this).data('glayerpanel').vtree.endUpdate();
        },

        requestInvalidation: function () {
            $(this).data('glayerpanel').vtree.requestInvalidation();
        },

        clean: function () {
            $(this).data('glayerpanel').vtree.clean();
        },

        refresh: function () {
            $(this).data('glayerpanel').vtree.refresh();
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