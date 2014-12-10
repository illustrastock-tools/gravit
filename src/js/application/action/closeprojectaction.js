(function (_) {

    /**
     * Action closing the active project
     * @class GCloseProjectAction
     * @extends GAction
     * @constructor
     */
    function GCloseProjectAction() {
    };
    GObject.inherit(GCloseProjectAction, GAction);

    GCloseProjectAction.ID = "file.close-project";
    GCloseProjectAction.TITLE = new GLocale.Key(GCloseProjectAction, "title");

    /**
     * @override
     */
    GCloseProjectAction.prototype.getId = function () {
        return GCloseProjectAction.ID;
    };

    /**
     * @override
     */
    GCloseProjectAction.prototype.getTitle = function () {
        return GCloseProjectAction.TITLE;
    };

    /**
     * @override
     */
    GCloseProjectAction.prototype.getCategory = function () {
        return GApplication.CATEGORY_FILE;
    };

    /**
     * @override
     */
    GCloseProjectAction.prototype.getGroup = function () {
        return "project";
    };

    /**
     * @override
     */
    GCloseProjectAction.prototype.isEnabled = function () {
        return !!gApp.getActiveProject();
    };

    /**
     * @override
     */
    GCloseProjectAction.prototype.execute = function () {
        gApp.removeProject(gApp.getActiveProject());
    };

    /** @override */
    GCloseProjectAction.prototype.toString = function () {
        return "[Object GCloseProjectAction]";
    };

    _.GCloseProjectAction = GCloseProjectAction;
})(this);