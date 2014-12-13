(function (_) {

    /**
     * Action for ordering
     * @class GArrangeAction
     * @extends GAction
     * @constructor
     */
    function GArrangeAction(type) {
        this._type = type;
        this._title = new GLocale.Key(GArrangeAction, 'title.' + type);
    };
    GObject.inherit(GArrangeAction, GAction);

    GArrangeAction.ID = 'arrange.order';

    /** @type {GEditor.ArrangeOrderType} */
    GArrangeAction.prototype._type = null;

    /** @type {GLocale.Key} */
    GArrangeAction.prototype._title = null;

    /**
     * @override
     */
    GArrangeAction.prototype.getId = function () {
        return GArrangeAction.ID + '.' + this._type;
    };

    /**
     * @override
     */
    GArrangeAction.prototype.getTitle = function () {
        return this._title;
    };

    /**
     * @override
     */
    GArrangeAction.prototype.getCategory = function () {
        return GApplication.CATEGORY_MODIFY_ARRANGE;
    };

    /**
     * @override
     */
    GArrangeAction.prototype.getGroup = function () {
        return "arrange/arrange";
    };

    /**
     * @override
     */
    GArrangeAction.prototype.getShortcut = function () {
        switch (this._type) {
            case GEditor.ArrangeOrderType.SendToFront:
                return [GKey.Constant.SHIFT, GKey.Constant.META, GKey.Constant.UP];
            case GEditor.ArrangeOrderType.BringForward:
                return [GKey.Constant.META, GKey.Constant.UP];
            case GEditor.ArrangeOrderType.SendBackward:
                return [GKey.Constant.META, GKey.Constant.DOWN];
            case GEditor.ArrangeOrderType.SendToBack:
                return [GKey.Constant.SHIFT, GKey.Constant.META, GKey.Constant.DOWN];
        }
        return null;
    };

    /**
     * @param {Array<GElement>} [elements] optional elements, if not given
     * uses the selection
     * @override
     */
    GArrangeAction.prototype.isEnabled = function (elements) {
        elements = elements || (gApp.getActiveDocument() ? gApp.getActiveDocument().getEditor().getSelection() : null);
        return elements && elements.length > 0;
    };

    /**
     * @param {Array<GElement>} [elements] optional elements, if not given
     * uses the selection
     * @override
     */
    GArrangeAction.prototype.execute = function (elements) {
        gApp.getActiveDocument().getEditor().arrangeOrder(this._type, elements, false);
    };

    /** @override */
    GArrangeAction.prototype.toString = function () {
        return "[Object GArrangeAction]";
    };

    _.GArrangeAction = GArrangeAction;
})(this);