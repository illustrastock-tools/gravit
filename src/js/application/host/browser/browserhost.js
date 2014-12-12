(function (_) {
    /**
     * The browser host
     * @class GBrowserHost
     * @extends GHost
     * @constructor
     */
    function GBrowserHost() {
        this._menuBar = new GMenuBar();
        this._clipboardMimeTypes = {};
    };
    GObject.inherit(GBrowserHost, GHost);

    /**
     * @type {GMenuBar}
     * @private
     */
    GBrowserHost.prototype._menuBar = null;

    /**
     * @type {*}
     * @private
     */
    GBrowserHost.prototype._clipboardMimeTypes = null;

    /** @override */
    GBrowserHost.prototype.isDevelopment = function () {
        return document.location.hostname === 'localhost' || document.location.hostname === '127.0.0.1';
    };

    /** @override */
    GBrowserHost.prototype.start = function () {
        // Append our menu bar element as first child of header
        var menuElement = this._menuBar._htmlElement;
        menuElement
            .css('height', '100%')
            .prependTo($('#header'));
    };

    /** @override */
    GBrowserHost.prototype.addMenu = function (parentMenu, title, callback) {
        parentMenu = parentMenu || this._menuBar.getMenu();
        var item = new GMenuItem(GMenuItem.Type.Menu);
        item.setCaption(title);
        parentMenu.addItem(item);

        if (callback) {
            item.getMenu().addEventListener(GMenu.OpenEvent, callback);
        }

        return item.getMenu();
    };

    /** @override */
    GBrowserHost.prototype.addMenuSeparator = function (parentMenu) {
        var item = new GMenuItem(GMenuItem.Type.Divider);
        parentMenu.addItem(item);
        return item;
    };

    /** @override */
    GBrowserHost.prototype.addMenuItem = function (parentMenu, title, checkable, shortcut, callback) {
        var item = new GMenuItem(GMenuItem.Type.Item);
        if (callback) {
            item.addEventListener(GMenuItem.ActivateEvent, callback);
        }

        if (shortcut) {
            gApp.registerShortcut(shortcut, function () {
                callback();
            }.bind(this));

            item.setShortcutHint(shortcut);
        }

        this.updateMenuItem(item, title, true, false);
        parentMenu.addItem(item);
        return item;
    };

    /** @override */
    GBrowserHost.prototype.updateMenuItem = function (item, title, enabled, checked) {
        item.setCaption(title);
        item.setEnabled(enabled);
        item.setChecked(checked);
    };

    /** @override */
    GBrowserHost.prototype.removeMenuItem = function (parentMenu, child) {
        parentMenu.removeItem(parentMenu.indexOf(child));
    };

    /** @override */
    GBrowserHost.prototype.getClipboardMimeTypes = function () {
        return this._clipboardMimeTypes ? Object.keys(this._clipboardMimeTypes) : null;
    };

    /** @override */
    GBrowserHost.prototype.getClipboardContent = function (mimeType) {
        if (this._clipboardMimeTypes && this._clipboardMimeTypes.hasOwnProperty(mimeType)) {
            return this._clipboardMimeTypes[mimeType];
        }
        return null;
    };

    /** @override */
    GBrowserHost.prototype.setClipboardContent = function (mimeType, content) {
        this._clipboardMimeTypes[mimeType] = content;
    };

    var dummyCount = 0;

    /** @override */
    GBrowserHost.prototype.openDirectoryPrompt = function (done) {
        var directory = prompt('Directory Name:');
        if (directory && directory.length) {
            done(directory, directory);
        }
    };

    /** @override */
    GBrowserHost.prototype.openDirectoryFile = function (directory, filename, createIfNotExists, writeable, done) {
        if (directory.substr(directory.length - 1, 1) !== '/') {
            directory += '/';
        }

        var location = directory + filename;
        var item = _.localStorage.getItem(location);
        if ((!item && createIfNotExists) || item) {
            done(location, filename);
        }
    };

    /** @override */
    GBrowserHost.prototype.getFileContents = function (file, binary, done) {
        var item = _.localStorage.getItem(file);
        if (!item) {
            throw new Error('No such item in localStorage: ' + file);
        }

        var buffer = null;
        if (binary) {
            var binaryString = _.atob(item);
            var length = binaryString.length;
            var bytes = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                var ascii = binaryString.charCodeAt(i);
                bytes[i] = ascii;
            }
            buffer = bytes.buffer;
        } else {
            buffer = item;
        }

        done(buffer);
    };

    /** @override */
    GBrowserHost.prototype.putFileContents = function (file, data, binary, done) {
        var item = null;
        if (binary) {
            var binaryString = '';
            var bytes = new Uint8Array(data);
            var length = bytes.byteLength;
            for (var i = 0; i < length; i++) {
                binaryString += String.fromCharCode(bytes[i]);
            }
            item = _.btoa(binaryString);
        } else {
            item = data;
        }

        _.localStorage.setItem(file, item);

        if (done) {
            done();
        }
    };

    _.gHost = new GBrowserHost;
})(this);
