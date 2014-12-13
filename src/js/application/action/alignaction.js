(function (_) {

    /**
     * Action for aligning
     * @class GAlignAction
     * @extends GAction
     * @constructor
     */
    function GAlignAction(type) {
        this._type = type;
        this._title = new GLocale.Key(GAlignAction, 'title.' + type);
    };
    GObject.inherit(GAlignAction, GAction);

    /** @enum */
    GEditor.ArrangeAlignType = {
        AlignLeft: 'align-left',
        AlignCenter: 'align-center',
        AlignRight: 'align-right',
        AlignTop: 'align-top',
        AlignMiddle: 'align-middle',
        AlignBottom: 'align-bottom',
        AlignJustifyHorizontal: 'align-justify-horizontal',
        AlignJustifyVertical: 'align-justify-vertical'
    };

    GAlignAction.ID = 'arrange.align';

    /** @type {GEditor.ArrangeAlignType} */
    GAlignAction.prototype._type = null;

    /** @type {GLocale.Key} */
    GAlignAction.prototype._title = null;

    /**
     * @override
     */
    GAlignAction.prototype.getId = function () {
        return GAlignAction.ID + '.' + this._type;
    };

    /**
     * @override
     */
    GAlignAction.prototype.getTitle = function () {
        return this._title;
    };

    /**
     * @override
     */
    GAlignAction.prototype.getCategory = function () {
        return GApplication.CATEGORY_MODIFY_ALIGN;
    };

    /**
     * @override
     */
    GAlignAction.prototype.getGroup = function () {
        var result = '';

        switch (this._type) {
            case GEditor.ArrangeAlignType.AlignLeft:
            case GEditor.ArrangeAlignType.AlignCenter:
            case GEditor.ArrangeAlignType.AlignRight:
            case GEditor.ArrangeAlignType.AlignJustifyHorizontal:
                result = 'horizontal';
                break;
            case GEditor.ArrangeAlignType.AlignTop:
            case GEditor.ArrangeAlignType.AlignMiddle:
            case GEditor.ArrangeAlignType.AlignBottom:
            case GEditor.ArrangeAlignType.AlignJustifyVertical:
                result = 'vertical';
                break;
        }

        return 'arrange/align-' + result;
    };

    /**
     * @override
     */
    GAlignAction.prototype.getShortcut = function () {
        return null;
    };

    /**
     * @param {Array<GElement>} [elements] optional elements, if not given
     * uses the selection
     * @param {Boolean} [compound] if provided, aligns the whole element's bbox,
     * otherwise if false (default), aligns each element individually
     * @param {Boolean} [geometry] if provided, specifies whether to
     * use geometry box for alignment, otherwise use paint box. Defaults
     * to false.
     * @param {GRect} [referenceBox] a reference box to align to, if not
     * given uses the element's total bbox
     * @override
     */
    GAlignAction.prototype.isEnabled = function (elements, compound, geometry, referenceBox) {
        elements = elements || (gApp.getActiveDocument() ? gApp.getActiveDocument().getEditor().getSelection() : null);
        if (elements) {
            return referenceBox ? elements.length > 0 : elements.length > 1;
        }
        return false;
    };

    /**
     * @param {Array<GElement>} [elements] optional elements, if not given
     * uses the selection
     * @param {Boolean} [compound] if provided, aligns the whole element's bbox,
     * otherwise if false (default), aligns each element individually
     * @param {Boolean} [geometry] if provided, specifies whether to
     * use geometry box for alignment, otherwise use paint box. Defaults
     * to false.
     * @param {GRect} [referenceBox] a reference box to align to, if not
     * given uses the element's total bbox
     * @override
     */
    GAlignAction.prototype.execute = function (elements, compound, geometry, referenceBox) {
        gApp.getActiveDocument().getEditor().arrangeAlign(this._type, elements, compound, geometry, referenceBox);
    };

    /** @override */
    GAlignAction.prototype.toString = function () {
        return "[Object GAlignAction]";
    };

    _.GAlignAction = GAlignAction;
})(this);