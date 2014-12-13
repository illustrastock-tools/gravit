(function (_) {
    /**
     * The grid guide
     * @param {GGuides} guides
     * @class GPageGuide
     * @extends GGuide
     * @mixes GGuide.Visual
     * @mixes GGuide.Map
     * @constructor
     */
    function GPageGuide(guides) {
        GGuide.call(this, guides);
    }

    GObject.inheritAndMix(GPageGuide, GGuide, [GGuide.Map]);

    GPageGuide.ID = 'guide.page';

    /** @override */
    GPageGuide.prototype.getId = function () {
        return GPageGuide.ID;
    };

    /** @override */
    GPageGuide.prototype.map = function (x, y, useMargin, snapDistance) {
        var resX = null;
        var resY = null;
        var guideX = null;
        var guideY = null;
        var deltaX = null;
        var deltaY = null;
        var delta;
        var result = null;

        if (this._scene instanceof GPage) {
            var pageBBoxes = [this._scene.getPageMarginBBox(), this._scene.getGeometryBBox()];
            for (var p = 0; p < pageBBoxes.length; ++p) {
                var pageBBox = pageBBoxes[p];
                if (pageBBox && !pageBBox.isEmpty()) {
                    var tl = pageBBox.getSide(GRect.Side.TOP_LEFT);
                    var br = pageBBox.getSide(GRect.Side.BOTTOM_RIGHT);
                    var cntr = pageBBox.getSide(GRect.Side.CENTER);
                    var pivots = [tl, br, cntr];
                    var sides = [GRect.Side.TOP_LEFT, GRect.Side.BOTTOM_RIGHT, GRect.Side.CENTER];
                    for (var i = 0; i < sides.length; ++i) {
                        var pivot = pivots[i];
                        delta = Math.abs(x - pivot.getX());
                        if (resX === null && delta <= snapDistance) {
                            resX = pivot.getX();
                            deltaX = delta;
                            if (sides[i] == GRect.Side.CENTER) {
                                guideX = [new GPoint(resX, tl.getY()), new GPoint(resX, br.getY())];
                            }
                        }
                        delta = Math.abs(y - pivot.getY());
                        if (resY === null && delta <= snapDistance) {
                            resY = pivot.getY();
                            deltaY = delta;
                            if (sides[i] == GRect.Side.CENTER) {
                                guideY = [new GPoint(tl.getX(), resY), new GPoint(br.getX(), resY)];
                            }
                        }
                    }
                }
            }
        }

        if (resX !== null || resY !== null) {
            result = {
                x: resX !== null ? {value: resX, guide: guideX, delta: deltaX} : null,
                y: resY !== null ? {value: resY, guide: guideY, delta: deltaY} : null
            };
        }

        return result;
    };

    /** @override */
    GPageGuide.prototype.toString = function () {
        return "[Object GPageGuide]";
    };

    _.GPageGuide = GPageGuide;
})(this);
