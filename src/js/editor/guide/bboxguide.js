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
        this._priority = GBBoxGuide.PRIORITY.DISTANCE_FIRST;
    }

    GObject.inheritAndMix(GBBoxGuide, GGuide, [GGuide.Map]);

    GBBoxGuide.ID = 'guide.bbox';

    GBBoxGuide.GUIDE_MARGIN = 20;

    GBBoxGuide.PRIORITY = {
        DISTANCE_FIRST: 1,
        BBOX_FIRST: 2
    };

    GBBoxGuide.prototype._priority = null;

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
     * Sets the priority which should be used for snapping, when both distance guides and bbox guides with
     * other shape qualify
     * @param {GBBoxGuide.PRIORITY} [priority]
     */
    GBBoxGuide.prototype.setPriority = function (priority) {
        this._priority = priority;
    };

    /**
     * Returns the priority which is used for snapping, when both distance guides and bbox guides with
     * other shape qualify
     * @return {GBBoxGuide.PRIORITY}
     */
    GBBoxGuide.prototype.getPriority = function () {
        return this._priority;
    };

    /**
     * Checks if distance guides should be drawn, and returns them in resX and resY arrays
     * @param {GRect} [rect] the rectangle to map
     * @param {Number} [snapDistance]
     * @param {Array{Number}} [distDeltas] filled with X and Y snapping delta values if distance guides are applicable
     * @param {Array{Array{GPoint}}} [visDistX] filled with X visual lines if distance guides are applicable
     * @param {Array{Array{GPoint}}} [visDistY] filled with Y visual lines if distance guides are applicable
     * @returns {GRect} a mapped rectangle
     */
    GBBoxGuide.prototype.checkDistanceGuidesMapping = function (rect, snapDistance, distDeltas, visDistX, visDistY) {
        // An algorithm for X trivial snapping and Y distance snapping
        // (an algorithm for Y trivial snapping and X distance snapping is analogous):
        // 1. Select items, which may be used for X snapping
        // 2. Check that no one of the selected items intersects with the rect,
        // and find the items with minimal pivot X offset
        // 3. If there are more than 1 item found with minimal pivot X offset suitable for snapping,
        // we can check Y snap offset
        // 4. Find X and Y offset between each pair of items with minimal pivot X offset,
        // and select those for which X offset inside pair is null or 0
        // 5. Select a pair for which the difference of absolute value of Y offset from rect to one of items
        // with absolute value of pair Y offset is less than snap distance, and is minimal between all other pairs
        // 6. Use the selected pair for X trivial snapping and Y distance snapping and drawing,
        // if it is closer then analogous pair for Y trivial snapping and X distance snapping,
        // or otherwise use the selected pair for Y trivial snapping and X distance snapping
        var itemsX = [];
        var itemsY = [];
        var newRect = null;
        var guides = null;
        var minYSnapPair = null;
        var minXSnapPair = null;

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
                var xItem = null;
                var yItem = null;
                var delta;
                var absDelta;
                for (var i = 0; i < pivots.length; ++i) {
                    var pivot = pivots[i];
                    for (var j = 0; j < rectPivots.length; ++j) {
                        delta = pivot.getX() - rectPivots[j].getX();
                        absDelta = Math.abs(delta);
                        if (absDelta <= snapDistance && (!xItem || absDelta < xItem.absDelta)) {
                            xItem = {
                                bBox: bBox,
                                delta: delta,
                                absDelta: absDelta};
                        }
                        delta = pivot.getY() - rectPivots[j].getY();
                        absDelta = Math.abs(delta);
                        if (absDelta <= snapDistance && (!yItem || absDelta < yItem.absDelta)) {
                            yItem = {
                                bBox: bBox,
                                delta: delta,
                                absDelta: absDelta};
                        }
                    }
                }
                if (xItem) {
                    itemsX.push(xItem);
                }
                if (yItem) {
                    itemsY.push(yItem);
                }
            }
        }.bind(this);

        // 1. Select items, which may be used for X snapping
        this._scene.accept(function (node) {
            if (node instanceof GItem && !(node.getParent() instanceof GItem) && !node.hasFlag(GElement.Flag.FullLocked)) {
                _snap(node);
            }
        });

        var _findMinDeltaItems = function (items) {
            var intersection = false;
            var item;
            var minDeltaPos = [];
            var minDeltaNeg = [];
            var minDelta = null;
            // 2. Check that no one of the selected items intersects with the rect,
            // and find the items with minimal pivot X offset
            for (var i = 0; i < items.length && !intersection; ++i) {
                item = items[i];
                var intRect = rect.intersected(item.bBox);
                intersection = !intRect.isEmpty();
                if (!intersection && (minDelta === null || item.absDelta <= minDelta)) {
                    if (minDelta === null ||  item.absDelta < minDelta) {
                        if (item.delta >= 0) {
                            minDeltaPos = [item];
                            minDeltaNeg = [];
                        } else {
                            minDeltaNeg = [item];
                            minDeltaPos = [];
                        }
                        minDelta = item.absDelta;
                    } else { // item.absDelta == minDelta
                        if (item.delta >= 0) {
                            minDeltaPos.push(item);
                        } else {
                            minDeltaNeg.push(item);
                        }
                    }
                }
            }

            if (intersection) {
                minDeltaPos = [];
                minDeltaNeg = [];
            }

            return {minDeltaPos: minDeltaPos, minDeltaNeg: minDeltaNeg};
        };

        // {Boolean} xAr indicates if array of items for trivial X alignment and distance Y snapping is passed
        // if xAr is false, consider array of items for trivial Y alignment and distance X snapping  is passed
        var _getMinSnapPair = function (minDeltaAr, xAr) {
            // 4. Find X and Y offset between each pair of items with minimal pivot X offset,
            // and select those for which X offset inside pair is null or 0
            var offsAr = [];
            for (var i = 0; i < minDeltaAr.length - 1; ++i) {
                for (var j = i + 1; j < minDeltaAr.length; ++j) {
                    var xyOffs = minDeltaAr[i].bBox.getXYOffset(minDeltaAr[j].bBox, true, true);
                    if (xAr) {
                        if (xyOffs.y && !xyOffs.x) {
                            offsAr.push({offsJfromI: xyOffs.y, i: i, j: j});
                        }
                    } else {
                        if (xyOffs.x && !xyOffs.y) {
                            offsAr.push({offsJfromI: xyOffs.x, i: i, j: j});
                        }
                    }
                }
            }

            // 5. Select a pair for which the difference of absolute value of Y offset from rect to one of items
            // with absolute value of pair Y offset is less than snap distance,
            // and is minimal between all other pairs
            var offs;
            var offsIFromRect, offsJFromRect;
            var minSnapVals = null;
            for (var it = 0; it < offsAr.length; ++it) {
                var bboxI = minDeltaAr[offsAr[it].i].bBox;
                var bboxJ = minDeltaAr[offsAr[it].j].bBox;
                if (xAr) {
                    offs = rect.getXYOffset(bboxI, false, true);
                    offsIFromRect = offs.y;
                    offs = rect.getXYOffset(bboxJ, false, true);
                    offsJFromRect = offs.y;
                } else {
                    offs = rect.getXYOffset(bboxI, true, false);
                    offsIFromRect = offs.x;
                    offs = rect.getXYOffset(bboxJ, true, false);
                    offsJFromRect = offs.x;
                }

                var absDelta = Math.abs(Math.abs(offsIFromRect) - Math.abs(offsAr[it].offsJfromI));
                if (absDelta <= snapDistance && (!minSnapVals || absDelta < minSnapVals.absDelta)) {
                    var delta;
                    if (Math.abs(offsAr[it].offsJfromI) >= Math.abs(offsIFromRect) && offsIFromRect > 0 ||
                        Math.abs(offsAr[it].offsJfromI) < Math.abs(offsIFromRect) && offsIFromRect < 0) {

                        delta = -absDelta;
                    } else {
                        delta = absDelta;
                    }
                    minSnapVals = {
                        absDelta: absDelta,
                        delta: delta,
                        bbox1: bboxI,
                        bbox2: bboxJ
                    };
                }

                absDelta = Math.abs(Math.abs(offsJFromRect) - Math.abs(offsAr[it].offsJfromI));
                if (absDelta <= snapDistance && (!minSnapVals || absDelta < minSnapVals.absDelta)) {
                    var delta;
                    if (Math.abs(offsAr[it].offsJfromI) >= Math.abs(offsJFromRect) && offsJFromRect > 0 ||
                        Math.abs(offsAr[it].offsJfromI) < Math.abs(offsJFromRect) && offsJFromRect < 0) {

                        delta = -absDelta;
                    } else {
                        delta = absDelta;
                    }
                    minSnapVals = {
                        absDelta: absDelta,
                        delta: delta,
                        bbox1: bboxI,
                        bbox2: bboxJ
                    };
                }

                absDelta = Math.abs(Math.abs(offsIFromRect) - Math.abs(offsJFromRect)) / 2;
                if (absDelta <= snapDistance && (!minSnapVals || absDelta < minSnapVals.absDelta)) {
                    var delta;
                    if (Math.abs(offsIFromRect) >= Math.abs(offsJFromRect) &&
                        offsIFromRect < 0 && offsJFromRect > 0 ||
                        Math.abs(offsIFromRect.y) <= Math.abs(offsJFromRect) &&
                            offsIFromRect > 0 && offsJFromRect < 0) {

                        delta = -absDelta;
                    } else {
                        delta = absDelta;
                    }
                    minSnapVals = {
                        absDelta: absDelta,
                        delta: delta,
                        bbox1: bboxI,
                        bbox2: bboxJ
                    };
                }
            }
            var minSnapPair = null;
            if (minSnapVals) {
                if (xAr) {
                    minSnapPair = {
                        absDeltaX: minDeltaAr[0].absDelta,
                        deltaX: minDeltaAr[0].delta,
                        absDeltaY: minSnapVals.absDelta,
                        deltaY: minSnapVals.delta,
                        bbox1: minSnapVals.bbox1,
                        bbox2: minSnapVals.bbox2
                    };
                } else {
                    minSnapPair = {
                        absDeltaX: minSnapVals.absDelta,
                        deltaX: minSnapVals.delta,
                        absDeltaY: minDeltaAr[0].absDelta,
                        deltaY: minDeltaAr[0].delta,
                        bbox1: minSnapVals.bbox1,
                        bbox2: minSnapVals.bbox2
                    };
                }
            }
            return minSnapPair;
        };
        
        if (itemsX.length > 1) {
            var minDeltaItems = _findMinDeltaItems(itemsX);
            var minDeltaXPos = minDeltaItems.minDeltaPos;
            var minDeltaXNeg = minDeltaItems.minDeltaNeg;

            // 3. If there are more than 1 item found with minimal pivot X offset suitable for snapping,
            // we can check Y snap offset
            if (minDeltaXPos.length > 1 || minDeltaXNeg.length > 1) {
                var minYSnapPairPos = null;
                var minYSnapPairNeg = null;
                if (minDeltaXPos.length > 1) {
                    minYSnapPairPos = _getMinSnapPair(minDeltaXPos, true);
                }
                if (minDeltaXNeg.length > 1) {
                    minYSnapPairNeg = _getMinSnapPair(minDeltaXNeg, true);
                }

                if (minYSnapPairPos && (!minYSnapPairNeg || minYSnapPairPos.absDeltaY <= minYSnapPairNeg.absDeltaY)) {
                    minYSnapPair = minYSnapPairPos;
                } else if (minYSnapPairNeg) {
                    minYSnapPair = minYSnapPairNeg;
                }
            }
        }

        if (itemsY.length > 1) {
            var minDeltaItems = _findMinDeltaItems(itemsY);
            var minDeltaYPos = minDeltaItems.minDeltaPos;
            var minDeltaYNeg = minDeltaItems.minDeltaNeg;

            // 3. If there are more than 1 item found with minimal pivot Y offset suitable for snapping,
            // we can check X snap offset
            if (minDeltaYPos.length > 1 || minDeltaYNeg.length > 1) {
                var minXSnapPairPos = null;
                var minXSnapPairNeg = null;
                if (minDeltaYPos.length > 1) {
                    minXSnapPairPos = _getMinSnapPair(minDeltaYPos, false);
                }
                if (minDeltaYNeg.length > 1) {
                    minXSnapPairNeg = _getMinSnapPair(minDeltaYNeg, false);
                }

                if (minXSnapPairPos && (!minXSnapPairNeg || minXSnapPairPos.absDeltaX <= minXSnapPairNeg.absDeltaX)) {
                    minXSnapPair = minXSnapPairPos;
                } else if (minXSnapPairNeg) {
                    minXSnapPair = minXSnapPairNeg;
                }
            }
        }

        // 6. Use the selected pair for X trivial snapping and Y distance snapping and drawing,
        // if it is closer then analogous pair for Y trivial snapping and X distance snapping,
        // or otherwise use the selected pair for Y trivial snapping and X distance snapping
        if (minYSnapPair || minXSnapPair) {
            if (minYSnapPair &&
                (!minXSnapPair ||
                    minYSnapPair.absDeltaX < minXSnapPair.absDeltaY ||
                    minYSnapPair.absDeltaX == minXSnapPair.absDeltaY && minYSnapPair.absDeltaY <= minXSnapPair.absDeltaX)) {

                newRect = rect.translated(minYSnapPair.deltaX, minYSnapPair.deltaY);
                distDeltas[0] = minYSnapPair.deltaX;
                distDeltas[1] = minYSnapPair.deltaY;
                guides = this.getDistGuides(
                    minYSnapPair.bbox1,
                    minYSnapPair.bbox2,
                    newRect,
                    true);

                if (guides) {
                    for (var i = 0; i < guides.length; ++i) {
                        visDistX.push(guides[i]);
                    }
                }
            } else if (minXSnapPair) {
                newRect = rect.translated(minXSnapPair.deltaX, minXSnapPair.deltaY);
                distDeltas[0] = minXSnapPair.deltaX;
                distDeltas[1] = minXSnapPair.deltaY;
                guides = this.getDistGuides(
                    minXSnapPair.bbox1,
                    minXSnapPair.bbox2,
                    newRect,
                    false);

                if (guides) {
                    for (var i = 0; i < guides.length; ++i) {
                        visDistY.push(guides[i]);
                    }
                }
            }
        }

        return newRect;
    };

    /**
     * Finds and returns distance guides coordinates between three X-aligned or
     * Y-aligned (may be aligned just 1 or two pivots) rectangles
     * @param {GRect} bbox1
     * @param {GRect} bbox2
     * @param {GRect} bbox3
     * @param {Boolean} xAligned - indicates if some pivots of the rectangles are aligned by X value,
     * otherwise, consider some pivots of the rectangles are aligned by Y value
     * @return {Array{Array{GPoint}}} array of guide lines
     */
    GBBoxGuide.prototype.getDistGuides = function (bbox1, bbox2, bbox3, xAligned) {
        // An algorithm for X-aligned rectangles
        // 1. Order bboxes by Y val
        // 2. Between each pair of the two nearest bboxes iterate over bbox1 bottom pivots and bbox2 top pivots
        // and make guide, where X match

        var guides = [];
        var b11, b12, b21, b22, b31, b32;
        if (xAligned) {
            b11 = bbox1.getY();
            b12 = b11 + bbox1.getHeight();
            b21 = bbox2.getY();
            b22 = b21 + bbox2.getHeight();
            b31 = bbox3.getY();
            b32 = b31 + bbox3.getHeight();
        } else {
            b11 = bbox1.getX();
            b12 = b11 + bbox1.getWidth();
            b21 = bbox2.getX();
            b22 = b21 + bbox2.getWidth();
            b31 = bbox3.getX();
            b32 = b31 + bbox3.getWidth();
        }

        var bboxes = [];

        // 1. Order bboxes by Y (or X) val
        // Bboxes have some non-zero Y (or X) offset from each other, as this was checked earlier, when selecting them
        // So let's take it into account to make ordering easy
        if (b12 < b21 && b12 < b31) {
            bboxes.push(bbox1);
            if (b22 < b31) {
                bboxes.push(bbox2);
                bboxes.push(bbox3);
            } else {
                bboxes.push(bbox3);
                bboxes.push(bbox2);
            }
        } else if (b22 < b11 && b22 < b31) {
            bboxes.push(bbox2);
            if (b12 < b31) {
                bboxes.push(bbox1);
                bboxes.push(bbox3);
            } else {
                bboxes.push(bbox3);
                bboxes.push(bbox1);
            }
        } else {
            bboxes.push(bbox3);
            if (b12 < b21) {
                bboxes.push(bbox1);
                bboxes.push(bbox2);
            } else {
                bboxes.push(bbox2);
                bboxes.push(bbox1);
            }
        }

        // 2. Between each pair of the two nearest bboxes iterate over bbox1 bottom (or right) pivots
        // and bbox2 top (or left) pivots, and make guide, where X (or Y) match
        for (var i = 0; i < bboxes.length - 1; ++i) {
            var bb1 = bboxes[i];
            var bb2 = bboxes[i + 1];

            var pivots1 = [];
            var pivots2 = [];
            if (xAligned) {
                pivots1.push(bb1.getSide(GRect.Side.BOTTOM_LEFT));
                pivots1.push(bb1.getSide(GRect.Side.BOTTOM_CENTER));
                pivots1.push(bb1.getSide(GRect.Side.BOTTOM_RIGHT));

                pivots2.push(bb2.getSide(GRect.Side.TOP_LEFT));
                pivots2.push(bb2.getSide(GRect.Side.TOP_CENTER));
                pivots2.push(bb2.getSide(GRect.Side.TOP_RIGHT));
            } else { // yAligned
                pivots1.push(bb1.getSide(GRect.Side.TOP_RIGHT));
                pivots1.push(bb1.getSide(GRect.Side.RIGHT_CENTER));
                pivots1.push(bb1.getSide(GRect.Side.BOTTOM_RIGHT));

                pivots2.push(bb2.getSide(GRect.Side.TOP_LEFT));
                pivots2.push(bb2.getSide(GRect.Side.LEFT_CENTER));
                pivots2.push(bb2.getSide(GRect.Side.BOTTOM_LEFT));
            }
            for (var j = 0; j < pivots1.length; ++j) {
                var piv1 = pivots1[j];
                for (var k = 0; k < pivots2.length; ++k) {
                    var piv2 = pivots2[k];
                    if (xAligned && piv1.getX() === piv2.getX() || piv1.getY() === piv2.getY()) {
                        var guide = [];
                        guide.push(piv1);
                        guide.push(piv2);
                        guides.push(guide);
                    }
                }
            }
        }

        return guides.length ? guides : null;
    };

    /** @override */
    GBBoxGuide.prototype.toString = function () {
        return "[Object GBBoxGuide]";
    };

    _.GBBoxGuide = GBBoxGuide;
})(this);

