(function (_) {

    /**
     * Action creating a new document
     * @class GNewProjectAction
     * @extends GAction
     * @constructor
     */
    function GNewProjectAction() {
    };
    GObject.inherit(GNewProjectAction, GAction);

    GNewProjectAction.ID = 'file.new-project';
    GNewProjectAction.TITLE = new GLocale.Key(GNewProjectAction, "title");

    /**
     * @override
     */
    GNewProjectAction.prototype.getId = function () {
        return GNewProjectAction.ID;
    };

    /**
     * @override
     */
    GNewProjectAction.prototype.getTitle = function () {
        return GNewProjectAction.TITLE;
    };

    /**
     * @override
     */
    GNewProjectAction.prototype.getCategory = function () {
        return GApplication.CATEGORY_FILE;
    };

    /**
     * @override
     */
    GNewProjectAction.prototype.getGroup = function () {
        return "project";
    };

    /**
     * @override
     */
    GNewProjectAction.prototype.getShortcut = function () {
        return [GKey.Constant.META, 'N'];
    };

    /**
     * @override
     */
    GNewProjectAction.prototype.execute = function () {
        gHost.openDirectoryPrompt(function (directory, name) {
            // TODO : Check and query for empty directory
            var project = new GProject(directory, name);

            new GProjectDialog(project).open(function (result, assign) {
                if (result) {
                    assign();

                    var page = new GPage(project);
                    page.setProperties(['name', 'w', 'h'], ['Main Page', 800, 600]);

                    project.save(function () {
                        gApp.addProject(project);
                        gApp.addDocument(new GDocument(page));
                    });
                }
            });
        });
    };

    /** @override */
    GNewProjectAction.prototype.toString = function () {
        return "[Object GNewProjectAction]";
    };

    _.GNewProjectAction = GNewProjectAction;
})(this);