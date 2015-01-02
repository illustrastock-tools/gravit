(function ($) {

    var PAGE_SIZES = [
        {
            // TODO : I18N
            name: 'Paper',
            sizes: [
                {
                    name: 'A0',
                    width: '841mm',
                    height: '1189mm',
                    rasterScale: 1
                },
                {
                    name: 'A1',
                    width: '594mm',
                    height: '841mm',
                    rasterScale: 1
                },
                {
                    name: 'A2',
                    width: '420mm',
                    height: '594mm',
                    rasterScale: 1
                },
                {
                    name: 'A3',
                    width: '297mm',
                    height: '420mm',
                    rasterScale: 1
                },
                {
                    name: 'A4',
                    width: '210mm',
                    height: '297mm',
                    rasterScale: 1
                },
                {
                    name: 'A5',
                    width: '148,5mm',
                    height: '210mm',
                    rasterScale: 1
                }
            ]
        },
        {
            // TODO : I18N
            name: 'Website',
            sizes: [
                {
                    name: 'Regular',
                    width: '1024px',
                    height: '768px',
                    rasterScale: 1
                },
                {
                    name: 'Regular Retina',
                    width: '1024px',
                    height: '768px',
                    rasterScale: 2
                }
            ]
        },
        {
            // TODO : I18N
            name: 'Phone',
            sizes: [
                {
                    name: 'Apple iPhone 3, 3G',
                    width: '320px',
                    height: '480px',
                    rasterScale: 1
                },
                {
                    name: 'Apple iPhone 4, 4S',
                    width: '320px',
                    height: '480px',
                    rasterScale: 2
                },
                {
                    name: 'Apple iPhone 5, 5S',
                    width: '320px',
                    height: '568px',
                    rasterScale: 2
                },
                {
                    name: 'Apple iPhone 6',
                    width: '375px',
                    height: '667px',
                    rasterScale: 3
                },
                {
                    name: 'Apple iPhone 6 Plus',
                    width: '414px',
                    height: '736px',
                    rasterScale: 3
                }
            ]
        },
        {
            // TODO : I18N
            name: 'Tablet',
            sizes: [
                {
                    name: 'Apple iPad 1, 2, Mini',
                    width: '1024px',
                    height: '768px',
                    rasterScale: 1
                },
                {
                    name: 'Apple iPad mini Retina',
                    width: '2048px',
                    height: '1536px',
                    rasterScale: 1
                },
                {
                    name: 'Apple iPad 3, Retina, Air',
                    width: '2048px',
                    height: '1536px',
                    rasterScale: 2
                }
            ]
        }
    ];

    var methods = {
        init: function (options) {
            options = $.extend({}, options);

            return this.each(function () {
                var $this = $(this);
                if ($this.is("select")) {
                    for (var i = 0; i < PAGE_SIZES.length; ++i) {
                        var group = PAGE_SIZES[i];
                        var groupEl = $('<optgroup></optgroup>')
                            .attr('label', group.name);

                        $this.append(groupEl);

                        for (var k = 0; k < group.sizes.length; ++k) {
                            var size = group.sizes[k];

                            var name = size.name + ' (' + size.width + ' x ' + size.height;
                            if (size.rasterScale != 1) {
                                name += ' @' + size.rasterScale + 'x';
                            }
                            name += ')';

                            $('<option></option>')
                                .attr('value', i.toString() + ',' + k.toString())
                                .text(name)
                                .appendTo(groupEl);
                        }
                    }
                }
            });
        },

        /**
         * Returns the selected value or null for none
         * @return {{width: GLength, height: GLength, rasterScale: Number}}
         */
        value: function () {
            var val = $(this).val();
            if (val.indexOf(',') >= 0) {
                var val2 = val.split(',');
                var sz = PAGE_SIZES[parseInt(val2[0])].sizes[parseInt(val2[1])];
                return {
                    width: GLength.parseLength(sz.width),
                    height: GLength.parseLength(sz.height),
                    rasterScale: sz.rasterScale
                };
            } else {
                return null;
            }
        }
    };

    /**
     * Adds a translated list of page-sizes resulting in a length value
     */
    $.fn.gPageSize = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.myPlugin');
        }
    }

}(jQuery));