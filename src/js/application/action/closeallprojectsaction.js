(function (_) {

    /**
     * Action closing all projects
     * @class GCloseAllProjectsAction
     * @extends GAction
     * @constructor
     */
    function GCloseAllProjectsAction() {
    };
    GObject.inherit(GCloseAllProjectsAction, GAction);

    GCloseAllProjectsAction.ID = "file.close-all-projects";
    GCloseAllProjectsAction.TITLE = new GLocale.Key(GCloseAllProjectsAction, "title");

    /**
     * @override
     */
    GCloseAllProjectsAction.prototype.getId = function () {
        return GCloseAllProjectsAction.ID;
    };

    /**
     * @override
     */
    GCloseAllProjectsAction.prototype.getTitle = function () {
        return GCloseAllProjectsAction.TITLE;
    };

    /**
     * @override
     */
    GCloseAllProjectsAction.prototype.getCategory = function () {
        return GApplication.CATEGORY_FILE;
    };

    /**
     * @override
     */
    GCloseAllProjectsAction.prototype.getGroup = function () {
        return "project";
    };

    /**
     * @override
     */
    GCloseAllProjectsAction.prototype.isEnabled = function () {
        return !!gApp.getActiveProject();
    };

    /**
     * @override
     */
    GCloseAllProjectsAction.prototype.execute = function () {
        while (gApp.getActiveProject()) {
            gApp.removeProject(gApp.getActiveProject());
        }
    };

    /** @override */
    GCloseAllProjectsAction.prototype.toString = function () {
        return "[Object GCloseAllProjectsAction]";
    };

    _.GCloseAllProjectsAction = GCloseAllProjectsAction;
})(this);