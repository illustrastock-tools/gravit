(function (_) {
    /**
     * The bbox guide
     * @param {GGuides} guides
     * @class GBBoxGuide
     * @extends GGuide
     * @mixes GGuide.Visual
     * @mixes GGuide.Map
     * @constructor
     */
    function GBBoxGuide(guides) {
        GGuide.call(this, guides);
    }

    GObject.inheritAndMix(GBBoxGuide, GGuide, [GGuide.Map]);

    GBBoxGuide.ID = 'guide.bbox';

    GBBoxGuide.GUIDE_MARGIN = 20;

    /** @override */
    GBBoxGuide.prototype.getId = function () {
        return GBBoxGuide.ID;
    };

    /** @override */
    GBBoxGuide.prototype.map = function (x, y, useMargin, snapDistance) {
        var resX = null;
        var resY = null;
        var guideX = null;
        var guideY = null;
        var deltaX = null;
        var deltaY = null;
        var result = null;
        var delta;
        var margin = useMargin ? GBBoxGuide.GUIDE_MARGIN : 0;

        var _snap = function (item) {
            if (this._exclusions && this._exclusions.length) {
                for (var i = 0; i < this._exclusions.length; ++i) {
                    if (this._exclusions[i] == item) {
                        return;
                    }
                }
            }

            var bBox = item.getGeometryBBox();
            if (bBox && !bBox.isEmpty()) {
                var tl = bBox.getSide(GRect.Side.TOP_LEFT);
                var br = bBox.getSide(GRect.Side.BOTTOM_RIGHT);
                var cntr = bBox.getSide(GRect.Side.CENTER);
                var pivots = [tl, br, cntr];
                for (var i = 0; i < pivots.length; ++i) {
                    var pivot = pivots[i];
                    delta = Math.abs(x - pivot.getX());
                    if (resX === null && delta <= snapDistance ||
                        resX !== null && delta < Math.abs(x - resX)) {

                        resX = pivot.getX();
                        deltaX = delta;
                        if (y <= tl.getY()) {
                            guideX = [new GPoint(resX, y - margin),
                                new GPoint(resX, br.getY() + margin)];
                        } else if (tl.getY() < y && y < br.getY()) {
                            guideX = [new GPoint(resX, tl.getY() - margin),
                                new GPoint(resX, br.getY() + margin)];
                        } else {
                            guideX = [new GPoint(resX, tl.getY() - margin),
                                new GPoint(resX, y + margin)];
                        }
                    } else if (resX !== null && delta === Math.abs(x - resX)) {
                        resX = pivot.getX();
                        deltaX = delta;
                        if (y <= tl.getY()) {
                            if (guideX[1].getY() < br.getY() + margin) {
                                guideX[1] = new GPoint(resX, br.getY() + margin);
                            }
                        } else if (tl.getY() < y && y < br.getY()) {
                            if (guideX[1].getY() < br.getY() + margin) {
                                guideX[1] = new GPoint(resX, br.getY() + margin);
                            }
                            if (guideX[0].getY() > tl.getY() - margin) {
                                guideX[0] = new GPoint(resX, tl.getY() - margin);
                            }
                        } else { // y >= br.getY()
                            if (guideX[0].getY() > tl.getY() - margin) {
                                guideX[0] = new GPoint(resX, tl.getY() - margin);
                            }
                        }
                    }

                    delta = Math.abs(y - pivot.getY());
                    if (resY === null && delta <= snapDistance ||
                        resY !== null && delta < Math.abs(y - resY)) {

                        resY = pivot.getY();
                        deltaY = delta;
                        if (x <= tl.getX()) {
                            guideY = [new GPoint(x - margin, resY),
                                new GPoint(br.getX() + margin, resY)];
                        } else if (tl.getX() < x && x < br.getX()) {
                            guideY = [new GPoint(tl.getX() - margin, resY),
                                new GPoint(br.getX() + margin, resY)];
                        } else {
                            guideY = [new GPoint(tl.getX() - margin, resY),
                                new GPoint(x + margin, resY)];
                        }
                    } else if (resY !== null && delta === Math.abs(y - resY)) {
                        resY = pivot.getY();
                        deltaY = delta;
                        if (y <= tl.getX()) {
                            if (guideY[1].getX() < br.getX() + margin) {
                                guideY[1] = new GPoint(br.getX() + margin, resY);
                            }
                        } else if (tl.getX() < y && y < br.getX()) {
                            if (guideY[1].getX() < br.getX() + margin) {
                                guideY[1] = new GPoint(br.getX() + margin, resY);
                            }
                            if (guideY[0].getX() > tl.getX() - margin) {
                                guideY[0] = new GPoint(tl.getX() - margin, resY);
                            }
                        } else { // y >= br.getX()
                            if (guideY[0].getX() > tl.getX() - margin) {
                                guideY[0] = new GPoint(tl.getX() - margin, resY);
                            }
                        }
                    }
                }
            }
        }.bind(this);

        this._scene.accept(function (node) {
            if (node instanceof GItem && !(node.getParent() instanceof GItem) && !node.hasFlag(GElement.Flag.FullLocked)) {
                _snap(node);
            }
        });

        if (resX !== null || resY !== null) {
            result = {
                x: resX !== null ? {value: resX, guide: guideX, delta: deltaX} : null,
                y: resY !== null ? {value: resY, guide: guideY, delta: deltaY} : null
            };
        }

        return result;
    };

    /** @override */
    GBBoxGuide.prototype.useExclusions = function (exclusions) {
        var node;
        this._exclusions = [];
        for (var i = 0; i < exclusions.length; ++i) {
            node = exclusions[i];
            if (node instanceof GItem) {
                this._exclusions.push(node);
            }
        }
    };

    /**
     * Checks if distance guides should be drawn, and returns them in resX and resY arrays
     * @param {GRect} [rect] the rectangle to map
     * @param {Array{*}} [resX] filled with X visual lines if distance guides are applicable
     * @param {Array{*}} [resY] filled with Y visual lines if distance guides are applicable
     */
    GBBoxGuide.prototype.checkDistanceGuides = function (rect, resX, resY) {
        var itemsX = [];
        var itemsY = [];
        var rectTl = rect.getSide(GRect.Side.TOP_LEFT);
        var rectBr = rect.getSide(GRect.Side.BOTTOM_RIGHT);
        var rectCntr = rect.getSide(GRect.Side.CENTER);
        var rectPivots = [rectTl, rectBr, rectCntr];
        var _snap = function (item) {
            if (this._exclusions && this._exclusions.length) {
                for (var i = 0; i < this._exclusions.length; ++i) {
                    if (this._exclusions[i] == item) {
                        return;
                    }
                }
            }

            var bBox = item.getGeometryBBox();
            if (bBox && !bBox.isEmpty()) {
                var tl = bBox.getSide(GRect.Side.TOP_LEFT);
                var br = bBox.getSide(GRect.Side.BOTTOM_RIGHT);
                var cntr = bBox.getSide(GRect.Side.CENTER);
                var pivots = [tl, br, cntr];
                for (var i = 0; i < pivots.length; ++i) {
                    var pivot = pivots[i];
                    for (var j = 0; j < rectPivots.length; ++j) {
                        if (Math.abs(rectPivots[j].getX() - pivot.getX()) === 0) {
                            itemsX.push({rectPivotIdx: j, itbBox: bBox, itPivotIdx: i, itPivotVal: pivots[pivotIdx]});
                        }
                        if (Math.abs(rectPivots[j].getY() - pivot.getY()) === 0) {
                            itemsY.push({rectPivotIdx: j, itbBox: bBox, itPivotIdx: i, itPivotVal: pivots[pivotIdx]});
                        }
                    }
                }
            }
        }.bind(this);

        this._scene.accept(function (node) {
            if (node instanceof GItem && !(node.getParent() instanceof GItem) && !node.hasFlag(GElement.Flag.FullLocked)) {
                _snap(node);
            }
        });

        if (itemsX.length > 1) {
           // TODO: find two nearest items and snap to them only taking into account the distance
        }
        if (itemsY.length > 1) {
            // TODO: find two nearest items and snap to them only taking into account the distance
        }
    };

    /** @override */
    GBBoxGuide.prototype.toString = function () {
        return "[Object GBBoxGuide]";
    };

    _.GBBoxGuide = GBBoxGuide;
})(this);

