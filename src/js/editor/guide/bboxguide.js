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
     * @param {Array{Array{GPoint}}} [resX] filled with X visual lines if distance guides are applicable
     * @param {Array{Array{GPoint}}} [resY] filled with Y visual lines if distance guides are applicable
     * @param {Number} [snapDistance]
     * @returns {GRect} a mapped rectangle
     */
    GBBoxGuide.prototype.checkDistanceGuidesMapping = function (rect, resX, resY, snapDistance) {
        // 1. Select items, which may be used for X snapping
        // 2. Check that no one of the selected items intersects with the rect, and find the items with minimal X offset
        // 3. If there are more than 1 item found with minimal X offset suitable for snapping, we can check Y snap offset
        // 4. Find X and Y offset between each pair of items with minimal X offset,
        // and select those for which X offset is null or 0
        // 5. Select a pair for which the difference of absolute value of Y offset from rect to one of items
        // with absolute value of pair Y offset is less than snap distance, and is minimal between all other pairs
        // 6. Use the selected pair for distance guides snapping and drawing
        var itemsX = [];
        var itemsY = [];
        var rectTl = rect.getSide(GRect.Side.TOP_LEFT);
        var rectBr = rect.getSide(GRect.Side.BOTTOM_RIGHT);
        var rectCntr = rect.getSide(GRect.Side.CENTER);
        var rectPivots = [rectTl, rectBr, rectCntr];
        var delta;
        var newRect = null;
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
                        delta = Math.abs(rectPivots[j].getX() - pivot.getX());
                        if (delta <= snapDistance) {
                            itemsX.push({
                                rectPivotIdx: j,
                                itbBox: bBox,
                                delta: rectPivots[j].getX() - pivot.getX(),
                                itPivotIdx: i,
                                itPivotVal: pivots[i]});
                        }
                        delta = Math.abs(rectPivots[j].getY() - pivot.getY());
                        if (delta <= snapDistance) {
                            itemsY.push({
                                rectPivotIdx: j,
                                itbBox: bBox,
                                delta: rectPivots[j].getY() - pivot.getY(),
                                itPivotIdx: i,
                                itPivotVal: pivots[i]});
                        }
                    }
                }
            }
        }.bind(this);

        // 1. Select items, which may be used for X snapping
        this._scene.accept(function (node) {
            if (node instanceof GItem && !(node.getParent() instanceof GItem) && !node.hasFlag(GElement.Flag.FullLocked)) {
                _snap(node);
            }
        });

        var intersection = false;
        var item;
        var guides = null;
        if (itemsX.length > 1) {
            var minDeltaXPos = [];
            var minDeltaXNeg = [];
            var minDelta = null;
            // 2. Check that no one of the selected items intersects with the rect, and find the items with minimal X offset
            for (var i = 0; i < itemsX.length && !intersection; ++i) {
                item = itemsX[i];
                var intRect = rect.intersected(item.itbBox);
                intersection = !intRect.isEmpty();
                if (!intersection && (minDelta === null || Math.abs(item.delta) <= Math.abs(minDelta))) {
                    if (minDelta === null ||  Math.abs(item.delta) < Math.abs(minDelta)) {
                        if (item.delta >= 0) {
                            minDeltaXPos = [item];
                            minDeltaXNeg = [];
                        } else {
                            minDeltaXNeg = [item];
                            minDeltaXPos = [];
                        }
                        minDelta = item.delta;
                    } else { // Math.abs(item.delta) == Math.abs(minDelta)
                        if (item.delta >= 0) {
                            minDeltaXPos.push(item);
                        } else {
                            minDeltaXNeg.push(item);
                        }
                    }
                }
            }

            // 3. If there are more than 1 item found with minimal X offset suitable for snapping, we can check Y snap offset
            if (!intersection && (minDeltaXPos.length > 1 || minDeltaXNeg.length > 1)) {
                var minDeltaX = null;
                var xyOffs;
                var yDists = [];
                var overlap = false;
                if (minDeltaXPos.length > 1) {
                    // 4. Find X and Y offset between each pair of items with minimal X offset,
                    // and select those for which X offset is null or 0
                    for (var i = 0; i < minDeltaXPos.length - 1; ++i) {
                        for (var j = i + 1; j < minDeltaXPos.length; ++j) {
                            xyOffs = minDeltaXPos[i].itbBox.getXYOffset(minDeltaXPos[j].itbBox, true, true);
                            if (xyOffs.y && !xyOffs.x) {
                                yDists.push({offsJfromI: xyOffs.y, i: i, j: j});
                            }
                        }
                    }

                    // 5. Select a pair for which the difference of absolute value of Y offset from rect to one of items
                    // with absolute value of pair Y offset is less than snap distance,
                    // and is minimal between all other pairs
                    var offsIFromRect, offsJFromRect;
                    var minYSnapPair = null;
                    for (var it = 0; it < yDists.length; ++it) {
                        offsIFromRect = rect.getXYOffset(minDeltaXPos[yDists[it].i].itbBox, false, true);
                        offsJFromRect = rect.getXYOffset(minDeltaXPos[yDists[it].j].itbBox, false, true);

                        var delta = Math.abs(Math.abs(offsIFromRect.y) - Math.abs(yDists[it].offsJfromI));
                        if (delta <= snapDistance && (!minYSnapPair || delta < minYSnapPair.absDeltaY)) {
                            var deltaY;
                            if (Math.abs(yDists[it].offsJfromI) >= Math.abs(offsIFromRect.y) && offsIFromRect.y > 0 ||
                                Math.abs(yDists[it].offsJfromI) < Math.abs(offsIFromRect.y) && offsIFromRect.y < 0) {

                                deltaY = -delta;
                            } else {
                                deltaY = delta;
                            }
                            minYSnapPair = {
                                absDeltaY: delta,
                                deltaY: deltaY,
                                i: yDists[it].i,
                                j: yDists[it].j
                            };
                        }

                        delta = Math.abs(Math.abs(offsJFromRect.y) - Math.abs(yDists[it].offsJfromI));
                        if (delta <= snapDistance && (!minYSnapPair || delta < minYSnapPair.absDeltaY)) {
                            var deltaY;
                            if (Math.abs(yDists[it].offsJfromI) >= Math.abs(offsJFromRect.y) && offsJFromRect.y > 0 ||
                                Math.abs(yDists[it].offsJfromI) < Math.abs(offsJFromRect.y) && offsJFromRect.y < 0) {

                                deltaY = -delta;
                            } else {
                                deltaY = delta;
                            }
                            minYSnapPair = {
                                absDeltaY: delta,
                                deltaY: deltaY,
                                i: yDists[it].i,
                                j: yDists[it].j
                            }
                        }

                        delta = Math.abs(Math.abs(offsIFromRect.y) - Math.abs(offsJFromRect.y)) / 2;
                        if (delta <= snapDistance && (!minYSnapPair || delta < minYSnapPair.absDeltaY)) {
                            var deltaY;
                            if (Math.abs(offsIFromRect.y) >= Math.abs(offsJFromRect.y) &&
                                offsIFromRect.y < 0 && offsJFromRect.y > 0 ||
                                Math.abs(offsIFromRect.y) <= Math.abs(offsJFromRect.y) &&
                                offsIFromRect.y > 0 && offsJFromRect.y < 0) {

                                deltaY = -delta;
                            } else {
                                deltaY = delta;
                            }
                            minYSnapPair = {
                                absDeltaY: delta,
                                deltaY: deltaY,
                                i: yDists[it].i,
                                j: yDists[it].j
                            }
                        }
                    }

                    // 6. Use the selected pair for distance guides snapping and drawing
                    if (minYSnapPair) {
                        newRect = rect.translated(minDeltaXPos[0].delta, minYSnapPair.deltaY);
                        guides = this.getXDistGuides(
                            minDeltaXPos[minYSnapPair.i].itbBox,
                            minDeltaXPos[minYSnapPair.j].itbBox,
                            newRect);

                        if (guides) {
                            for (var i = 0; i < guides.length; ++i) {
                                resX.push(guides[i]);
                            }
                        }
                    }
                }
            }
        }
        /*
        if (itemsY.length > 1) {
            // TODO: find two nearest items and snap to them only taking into account the distance
            for (var i = 0; i < itemsY.length && !intersection; ++i) {
                intersection = rect.intersected(itemsY.itbBox);
            }
            if (!intersection) {

            }
        } */
        return newRect;
    };

    /**
     *
     * @param {GRect} bbox1
     * @param {GRect} bbox2
     * @param {GRect} bbox3
     * @return {Array{Array{GPoint}}}
     */
    GBBoxGuide.prototype.getXDistGuides = function (bbox1, bbox2, bbox3) {
        // 1. Order bboxes by Y val
        // 2. Between each pair of the two nearest bboxes iterate over bbox1 bottom pivots and bbox2 top pivots
        // and make guide, where X match

        var guides = [];
        var b1y1 = bbox1.getY();
        var b1y2 = b1y1 + bbox1.getHeight();
        var b2y1 = bbox2.getY();
        var b2y2 = b2y1 + bbox2.getHeight();
        var b3y1 = bbox3.getY();
        var b3y2 = b3y1 + bbox3.getHeight();
        var bboxes = [];

        // 1. Order bboxes by Y val
        // Bboxes have some non-zero Y offset from each other, as this was checked earlier, when selecting them
        // So let's take it into account to make ordering easy
        if (b1y2 < b2y1 && b1y2 < b3y1) {
            bboxes.push(bbox1);
            if (b2y2 < b3y1) {
                bboxes.push(bbox2);
                bboxes.push(bbox3);
            } else {
                bboxes.push(bbox3);
                bboxes.push(bbox2);
            }
        } else if (b2y2 < b1y1 && b2y2 < b3y1) {
            bboxes.push(bbox2);
            if (b1y2 < b3y1) {
                bboxes.push(bbox1);
                bboxes.push(bbox3);
            } else {
                bboxes.push(bbox3);
                bboxes.push(bbox1);
            }
        } else {
            bboxes.push(bbox3);
            if (b1y2 < b2y1) {
                bboxes.push(bbox1);
                bboxes.push(bbox2);
            } else {
                bboxes.push(bbox2);
                bboxes.push(bbox1);
            }
        }

        // 2. Between each pair of the two nearest bboxes iterate over bbox1 bottom pivots and bbox2 top pivots
        // and make guide, where X match
        for (var i = 0; i < bboxes.length - 1; ++i) {
            var bb1 = bboxes[i];
            var bb2 = bboxes[i + 1];

            var pivots1 = [];
            pivots1.push(bb1.getSide(GRect.Side.BOTTOM_LEFT));
            pivots1.push(bb1.getSide(GRect.Side.BOTTOM_CENTER));
            pivots1.push(bb1.getSide(GRect.Side.BOTTOM_RIGHT));

            var pivots2 = [];
            pivots2.push(bb2.getSide(GRect.Side.TOP_LEFT));
            pivots2.push(bb2.getSide(GRect.Side.TOP_CENTER));
            pivots2.push(bb2.getSide(GRect.Side.TOP_RIGHT));
            for (var j = 0; j < pivots1.length; ++j) {
                var piv1 = pivots1[j];
                for (var k = 0; k < pivots2.length; ++k) {
                    var piv2 = pivots2[k];
                    if (piv1.getX() === piv2.getX()) {
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

