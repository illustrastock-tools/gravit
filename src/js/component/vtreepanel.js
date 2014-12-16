(function ($) {

    function updateSelectedSwatch($this, swatch) {
        if ($this.data('gvtreepanel').options.allowSelect) {
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
        var data = $this.data('gvtreepanel');
        if (data.options.canDropCallback) {
            res = data.options.canDropCallback(parent.id, reference ? reference.id : null, dropNode.id);
        }
        return res;
    };

    function moveHere(parent, reference, dropNode) {
        var $this = $(this);
        //$this.trigger('moveHere', parent.id, reference.id, dropNode.id);
        var data = $this.data('gvtreepanel');
        if (data.options.moveCallback) {
            data.options.moveCallback(parent.id, reference ? reference.id : null, dropNode.id);
        }
    };

    function renderer(node, row) {
        var $this = $(this);
        var data = $this.data('gvtreepanel');
        if (data.options.renderer) {
            data.options.renderer(node.id, row);
        }
    };

    function expandRenderer(elem) {
        var $this = $(this);
        if (elem.id === VTree.COLLAPSE_ID) {
            $(elem).addClass($this.data('gvtreepanel').options.collapseStyle);
        } else if (elem.id === VTree.EXPAND_ID) {
            $(elem).addClass($this.data('gvtreepanel').options.expandStyle);
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

    var methods = {
        init: function (options) {
            options = $.extend({
                // {Element} a HTML container for displaying the tree
                container: $(this),
                // {Function(TreeNode, Element)} renderer to fill the tree node visible element with content
                renderer: null,
                // {String} a tree node visible element CSS style name. If not passed, the default style name is used.
                nodeStyle: 'vrow',
                // {Function(Element)} renderer for the 'expand' span element
                expandRenderer: expandRenderer,
                expandStyle: 'fa fa-caret-right',
                collapseStyle: 'fa fa-caret-down',
                freeHeight: 7,
                insertIntoStyle: 'g-drop',
                upSeparatorStyle: 'up-separator',
                downSeparatorStyle: 'down-separator',
                paddingLeft: 50,
                rowHeight: 30,
                canDropCallback: null,
                moveCallback: null
            }, options);

            return this.each(function () {
                var self = this;
                var $this = $(this);
                $this.data('gvtreepanel', {
                        vtree: new VTree(options.container, renderer.bind($(this)), options.nodeStyle,
                            options.expandRenderer.bind($(this)),
                            null, canDrop.bind($(this)), moveHere.bind($(this))),
                        options: options
                    });
            });
        },

        addNodeBefore: function (treeNodeId, refNodeId) {
            var newNode = new TreeNodeNamed(treeNodeId);
            var $this = $(this);
            var vtree = $this.data('gvtreepanel').vtree;
            var refNode = getRefNode(vtree, refNodeId);
            vtree.insertNodeBefore(refNode, newNode);
        },

        prependNode: function (treeNodeId, refNodeId) {
            var newNode = new TreeNodeNamed(treeNodeId);
            var $this = $(this);
            var vtree = $this.data('gvtreepanel').vtree;
            var refNode = getRefNode(vtree, refNodeId);
            vtree.prependNode(refNode, newNode);
        },

        // TODO: add appendNode and addNodeAfter

        removeNode: function (treeNodeId) {
            var vtree = $(this).data('gvtreepanel').vtree;
            var refNode = getRefNode(vtree, treeNodeId);
            vtree.removeNode(refNode);
        },

        beginUpdate: function () {
            $(this).data('gvtreepanel').vtree.beginUpdate();
        },

        endUpdate: function () {
            var $this = $(this);
            $(this).data('gvtreepanel').vtree.endUpdate();
        },

        requestInvalidation: function () {
            $(this).data('gvtreepanel').vtree.requestInvalidation();
        },

        clean: function () {
            $(this).data('gvtreepanel').vtree.clean();
        }
    };

    /**
     * Block to transform divs to swatch panels
     */
    $.fn.gVTreePanel = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.myPlugin');
        }
    }

}(jQuery));