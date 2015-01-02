(function (_) {
    /**
     * Project settings dialog
     * @class GProjectDialog
     * @param {GProject} project the project this dialog works on
     * @constructor
     */
    function GProjectDialog(project) {
        this._project = project;
    };

    /**
     * @type {GProject}
     * @private
     */
    GProjectDialog.prototype._project = null;

    /**
     * Open this dialog
     * @param {Function(result, assign)} callback called when the dialog got closed with
     * a boolean parameter defining whether it was canceled (false) or not (true).
     * Note that you must call the assign function to ensure the changes get
     * actually assigned to the project.
     */
    GProjectDialog.prototype.open = function (callback) {
        var _createInput = function (property) {
            var self = this;
            if (property === 'unit') {
                return $('<select></select>')
                    .attr('data-property', property)
                    .gUnit();
            } else if (property === 'page-size') {
                return $('<select></select>')
                    .attr('data-property', property)
                    .gPageSize()
                    .on('change', function () {
                        var $this = $(this);
                        var size = $this.gPageSize('value');
                        if (size && size.width) {
                            $this.parents('.g-form').find('[data-property="unit"]').val(size.width.getUnit());
                        }
                    });
            } else {
                throw new Error('Unknown input property: ' + property);
            }
        }.bind(this);

        var form = $('<table></table>')
            .addClass('g-form')
            .css({
                'margin': '5px auto'
            })
            .append($('<tr></tr>')
                .append($('<td></td>')
                    .addClass('label')
                    // TODO : I18N
                    .text('Page Size:'))
                .append($('<td></td>')
                    .attr('colspan', '3')
                    .append(_createInput('page-size'))))
            .append($('<tr></tr>')
                .append($('<td></td>')
                    .addClass('label')
                    // TODO : I18N
                    .text('Unit:'))
                .append($('<td></td>')
                    .attr('colspan', '3')
                    .append(_createInput('unit'))));

        vex.dialog.open({
            input: form,
            message: '',
            callback: function (data) {
                var assign = function () {
                    this._project.setSettings(['unit'], [form.find('[data-property="unit"]').val()]);
                }.bind(this)

                if (callback) {
                    callback(!!data, assign);
                }
            }.bind(this)
        })
    };

    _.GProjectDialog = GProjectDialog;
})(this);
