(function (_) {
    /**
     * An instance of an opened project
     * @class GProject
     * @extends GWorkspace
     * @constructor
     */
    function GProject(directory, name) {
        GWorkspace.call(this);
        this._directory = directory;
        this._name = name;
        this._id = GUtil.uuid();
        this._documents = [];
        this._activeDocument = null;

    };
    GObject.inherit(GProject, GWorkspace);

    /**
     * The underlying directory
     * @type {*}
     * @private
     */
    GProject.prototype._directory = null;

    /**
     * The name of the project
     * @type {String}
     * @private
     */
    GProject.prototype._name = null;

    /**
     * The id of the project
     * @type {String}
     * @private
     */
    GProject.prototype._id = null;

    /**
     * The documents attached to the project
     * @type {Array<GDocument>}
     * @private
     */
    GProject.prototype._documents = null;

    /**
     * The currently active document of this project
     * @type {GDocument}
     * @private
     */
    GProject.prototype._activeDocument = null;

    /**
     * Returns the directory of the project
     * @returns {*}
     */
    GProject.prototype.getDirectory = function () {
        return this._directory;
    };

    /**
     * Returns the name for the project
     * @return {String}
     */
    GProject.prototype.getName = function () {
        return this._name;
    };

    /**
     * Returns the id for the project
     * @return {String}
     */
    GProject.prototype.getId = function () {
        return this._id;
    };

    /**
     * Returns a list of all documents attached to this project
     * @return {Array<GDocument>}
     */
    GProject.prototype.getDocuments = function () {
        return this._documents;
    };

    /**
     * Returns the currently active document of this project
     * @return {GDocument}
     */
    GProject.prototype.getActiveDocument = function () {
        return this._activeDocument;
    };

    /**
     * Returns a list of all windows within all documents of this project
     * @return {Array<GWindow>}
     */
    GProject.prototype.getWindows = function () {
        var result = [];
        for (var i = 0; i < this._documents.length; ++i) {
            var docWins = this._documents[i].getWindows();
            if (docWins && docWins.length > 0) {
                result = result.concat(docWins);
            }
        }
        return result;
    };

    var projectFile = 'project.grvp';
    var swatchesFile = 'swatches.grvx';
    var stylesFiles = 'styles.grvs';

    /**
     * Opens the project
     */
    GProject.prototype.open = function (done) {
        gHost.openDirectoryFile(this._directory, projectFile, false, false, function (file) {
            this.syncSwatches(function () {
                this.syncStyles(done);
            }.bind(this));
        }.bind(this));
    };

    GProject.prototype.syncSwatches = function (done) {
        gHost.openDirectoryFile(this._directory, swatchesFile, false, false, function (file) {
            gHost.getFileContents(file, false, function (buffer) {
                var blob = JSON.parse(buffer);
                if (blob) {
                    GNode.restoreInstance(blob, this._swatches);

                    this._swatches.addEventListener(GNode.AfterInsertEvent, this._saveSwatches, this);
                    if (done) {
                        done();
                    }
                }
            }.bind(this));
        }.bind(this));
    };

    GProject.prototype.syncStyles = function (done) {
        gHost.openDirectoryFile(this._directory, stylesFiles, false, false, function (file) {
            gHost.getFileContents(file, false, function (buffer) {
                var blob = JSON.parse(buffer);
                if (blob) {
                    GNode.restoreInstance(blob, this._styles);

                    this._styles.addEventListener(GNode.AfterInsertEvent, this._saveStyles, this);
                    if (done) {
                        done();
                    }
                }
            }.bind(this));
        }.bind(this));
    };

    /**
     * Saves the project
     */
    GProject.prototype.save = function (done) {
        gHost.openDirectoryFile(this._directory, projectFile, true, true, function (file) {
            gHost.putFileContents(file, JSON.stringify({
                test: 'bla',
                moreStuff: 123
            }), false, function () {
                this._saveSwatches(null, function () {
                    this._saveStyles(null, done);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    };

    GProject.prototype._saveSwatches = function (evt, done) {
        console.log('SAVE_SWATCHES');
        gHost.openDirectoryFile(this._directory, swatchesFile, true, true, function (file) {
            /*
             var input = GNode.serialize(this._scene);
             var output = pako.gzip(input, {level: 9});
             this._storage.save(this._url, output.buffer, true, function (name) {
             this._title = name;
             }.bind(this));
             */
            gHost.putFileContents(file, GNode.serialize(this._swatches), false, function () {
                if (done) {
                    done();
                }
            });
        }.bind(this));
    };

    GProject.prototype._saveStyles = function (evt, done) {
        console.log('SAVE_STYLES');
        gHost.openDirectoryFile(this._directory, stylesFiles, true, true, function (file) {
            /*
             var input = GNode.serialize(this._scene);
             var output = pako.gzip(input, {level: 9});
             this._storage.save(this._url, output.buffer, true, function (name) {
             this._title = name;
             }.bind(this));
             */
            gHost.putFileContents(file, GNode.serialize(this._styles), false, function () {
                if (done) {
                    done();
                }
            });
        }.bind(this));
    };

    /**
     * Called before this project gets activated
     */
    GProject.prototype.activate = function () {
        // NO-OP
    };

    /**
     * Called before this project gets deactivated
     */
    GProject.prototype.deactivate = function () {
        // NO-OP
    };

    /**
     * Called when this project gets released
     */
    GProject.prototype.release = function () {
        // NO-OP
    };

    _.GProject = GProject;
})(this);
