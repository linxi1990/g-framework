"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var CollisionDetector = /** @class */ (function () {
            function CollisionDetector(shape1, shape2) {
                this.shape1 = shape1;
                this.shape2 = shape2;
            }
            CollisionDetector.prototype.epa = function () {
                var e_1, _a;
                var edges = [];
                while (true) {
                    // 1. 找到到原点最近的边
                    var closestEdge = edges[0];
                    try {
                        for (var edges_1 = __values(edges), edges_1_1 = edges_1.next(); !edges_1_1.done; edges_1_1 = edges_1.next()) {
                            var edge = edges_1_1.value;
                            if (edge.distance.lt(closestEdge.distance)) {
                                closestEdge = edge;
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (edges_1_1 && !edges_1_1.done && (_a = edges_1.return)) _a.call(edges_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    // 2. 计算该边的法线方向，并求解support点
                    var normal = closestEdge.pointB.sub(closestEdge.pointA).perp();
                    var newPoint = this.support(normal);
                    // 3. 检查新的support点是否带来了明显的改进
                    var improvement = newPoint.sub(closestEdge.pointA).dot(normal);
                    if (improvement.lte(0) || newPoint.distanceTo(physics.Vector2.zero()).sub(closestEdge.distance).lte(0)) {
                        // 新的support点没有带来明显的改进，所以我们可以停止了
                        return normal.mul(closestEdge.distance);
                    }
                    else {
                        // 将新的support点添加到多边形中
                        this.addPointToPolytope(edges, newPoint);
                    }
                }
            };
            CollisionDetector.prototype.gjk = function () {
                var direction = new physics.Vector2(1, 0); // 可以从任意非零向量开始
                var simplex = new physics.Simplex();
                simplex.add(this.support(direction));
                physics.Vector2.negate(direction); // 反向
                while (true) {
                    simplex.add(this.support(direction));
                    if (simplex.vertices[0].dot(direction).toFloat() <= 0) {
                        return false; // 没有碰撞
                    }
                    else {
                        // 更新方向
                        if (this.updateSimplexAndDirection(simplex, direction)) {
                            return true; // 发现碰撞
                        }
                    }
                }
            };
            CollisionDetector.prototype.updateSimplexAndDirection = function (simplex, direction) {
                if (simplex.vertices.length === 2) {
                    // Simplex是一条线段
                    var B = simplex.vertices[1];
                    var A = simplex.vertices[0];
                    var AO = A.negate();
                    var AB = B.sub(A);
                    // 更新方向
                    if (AB.cross(AO).gt(0)) {
                        // 右手侧
                        direction.setR(AB.perp().negate());
                    }
                    else {
                        // 左手侧或者前方
                        direction.setR(AB.perp());
                    }
                }
                else if (simplex.vertices.length === 3) {
                    // Simplex是一个三角形
                    var C = simplex.vertices[2];
                    var B = simplex.vertices[1];
                    var A = simplex.vertices[0];
                    var AO = A.negate();
                    var AB = B.sub(A);
                    var AC = C.sub(A);
                    var ABC = AB.cross(AC);
                    // 更新方向
                    if (AB.cross(AO).gt(0)) {
                        // 在AB边的外侧
                        simplex.vertices.splice(2, 1); // 删除C
                        direction.setR(AB.perp().negate()); // 沿着AB边，指向原点O
                    }
                    else if (AC.cross(AO).gt(0)) {
                        // 在AC边的外侧
                        simplex.vertices.splice(1, 1); // 删除B
                        direction.setR(AC.perp()); // 沿着AC边，指向原点O
                    }
                    else {
                        // A点在三角形ABC中
                        return true;
                    }
                }
                return false;
            };
            CollisionDetector.prototype.addPointToPolytope = function (edges, newPoint) {
                var e_2, _a, e_3, _b;
                var edgesToRemove = [];
                for (var i = 0; i < edges.length; i++) {
                    var edge = edges[i];
                    var A = edge.pointA;
                    var B = edge.pointB;
                    var AB = B.sub(A);
                    var AP = newPoint.sub(A);
                    // 计算叉积
                    var crossProduct = AB.cross(AP);
                    // 如果叉积大于0，新点在边AB的逆时针方向
                    if (crossProduct.gt(0)) {
                        edgesToRemove.push(edge);
                    }
                }
                try {
                    // 移除所有新点在逆时针方向上的边
                    for (var edgesToRemove_1 = __values(edgesToRemove), edgesToRemove_1_1 = edgesToRemove_1.next(); !edgesToRemove_1_1.done; edgesToRemove_1_1 = edgesToRemove_1.next()) {
                        var edge = edgesToRemove_1_1.value;
                        var index = edges.indexOf(edge);
                        if (index !== -1) {
                            edges.splice(index, 1);
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (edgesToRemove_1_1 && !edgesToRemove_1_1.done && (_a = edgesToRemove_1.return)) _a.call(edgesToRemove_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                try {
                    // 对于每条被移除的边，从其顶点到新点创建两条新边
                    for (var edgesToRemove_2 = __values(edgesToRemove), edgesToRemove_2_1 = edgesToRemove_2.next(); !edgesToRemove_2_1.done; edgesToRemove_2_1 = edgesToRemove_2.next()) {
                        var edge = edgesToRemove_2_1.value;
                        edges.push(new physics.Edge(edge.point1, newPoint));
                        edges.push(new physics.Edge(newPoint, edge.point2));
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (edgesToRemove_2_1 && !edgesToRemove_2_1.done && (_b = edgesToRemove_2.return)) _b.call(edgesToRemove_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            };
            CollisionDetector.prototype.support = function (direction) {
                var pointOnShape1 = this.shape1.getFarthestPointInDirection(direction);
                var pointOnShape2 = this.shape2.getFarthestPointInDirection(direction.negate());
                return pointOnShape1.sub(pointOnShape2);
            };
            return CollisionDetector;
        }());
        physics.CollisionDetector = CollisionDetector;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var CollisionEvent = /** @class */ (function (_super) {
            __extends(CollisionEvent, _super);
            function CollisionEvent(type, entity1, entity2, velocities) {
                var _this = _super.call(this, type) || this;
                _this.entity1 = entity1;
                _this.entity2 = entity2;
                _this.velocities = velocities;
                return _this;
            }
            CollisionEvent.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.entity1 = null;
                this.entity2 = null;
                this.velocities = { v1: new physics.Vector2(0, 0), v2: new physics.Vector2(0, 0) };
            };
            CollisionEvent.prototype.getEntity1 = function () {
                return this.entity1;
            };
            CollisionEvent.prototype.getEntity2 = function () {
                return this.entity2;
            };
            CollisionEvent.prototype.getVelocities = function () {
                return this.velocities;
            };
            return CollisionEvent;
        }(gs.Event));
        physics.CollisionEvent = CollisionEvent;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var CollisionHandlerSystem = /** @class */ (function () {
            function CollisionHandlerSystem() {
                gs.GlobalEventEmitter.on('collision', this.handleCollision.bind(this));
            }
            CollisionHandlerSystem.prototype.handleCollision = function (event) {
                var _a = event.data, entity1 = _a.entity1, entity2 = _a.entity2, velocities = _a.velocities;
                entity1.getComponent(physics.RigidBody).velocity = velocities.v1;
                entity2.getComponent(physics.RigidBody).velocity = velocities.v2;
            };
            return CollisionHandlerSystem;
        }());
        physics.CollisionHandlerSystem = CollisionHandlerSystem;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var CollisionResponseSystem = /** @class */ (function (_super) {
            __extends(CollisionResponseSystem, _super);
            function CollisionResponseSystem(entityManager, updateInterval) {
                var _this = _super.call(this, entityManager, 0, gs.Matcher.empty().all(physics.RigidBody, physics.Collider)) || this;
                _this.processed = new Map();
                _this.collisionPairs = [];
                _this.dynamicTree = new physics.DynamicTree();
                _this.updateInterval = updateInterval;
                return _this;
            }
            CollisionResponseSystem.prototype.update = function (entities) {
                var e_4, _a, e_5, _b, e_6, _c, e_7, _d;
                var _e = this, dynamicTree = _e.dynamicTree, processed = _e.processed, collisionPairs = _e.collisionPairs;
                dynamicTree.clear();
                processed.clear();
                collisionPairs.length = 0;
                var nodeEntityMap = new Map();
                var boundsArray = [];
                try {
                    for (var entities_1 = __values(entities), entities_1_1 = entities_1.next(); !entities_1_1.done; entities_1_1 = entities_1.next()) {
                        var entity = entities_1_1.value;
                        var collider = entity.getComponent(physics.Collider);
                        if (!collider)
                            continue;
                        var node = {
                            children: [],
                            height: 0,
                            leaf: true,
                            bounds: collider.getBounds()
                        };
                        boundsArray.push(node);
                        nodeEntityMap.set(node, entity);
                        collider.isColliding = false;
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (entities_1_1 && !entities_1_1.done && (_a = entities_1.return)) _a.call(entities_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                dynamicTree.load(boundsArray);
                try {
                    for (var boundsArray_1 = __values(boundsArray), boundsArray_1_1 = boundsArray_1.next(); !boundsArray_1_1.done; boundsArray_1_1 = boundsArray_1.next()) {
                        var node = boundsArray_1_1.value;
                        var entity = nodeEntityMap.get(node);
                        var entityId = entity.getId();
                        var processedPairs = processed.get(entityId);
                        if (!processedPairs) {
                            processedPairs = new Set();
                            processed.set(entityId, processedPairs);
                        }
                        var candidates = dynamicTree.search(node.bounds);
                        try {
                            for (var candidates_1 = __values(candidates), candidates_1_1 = candidates_1.next(); !candidates_1_1.done; candidates_1_1 = candidates_1.next()) {
                                var candidate = candidates_1_1.value;
                                var candidateEntity = nodeEntityMap.get(candidate);
                                var candidateId = candidateEntity.getId();
                                if (entityId === candidateId || processedPairs.has(candidateId)) {
                                    continue;
                                }
                                collisionPairs.push([entity, candidateEntity]);
                                processedPairs.add(candidateId);
                            }
                        }
                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                        finally {
                            try {
                                if (candidates_1_1 && !candidates_1_1.done && (_c = candidates_1.return)) _c.call(candidates_1);
                            }
                            finally { if (e_6) throw e_6.error; }
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (boundsArray_1_1 && !boundsArray_1_1.done && (_b = boundsArray_1.return)) _b.call(boundsArray_1);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
                try {
                    for (var collisionPairs_1 = __values(collisionPairs), collisionPairs_1_1 = collisionPairs_1.next(); !collisionPairs_1_1.done; collisionPairs_1_1 = collisionPairs_1.next()) {
                        var _f = __read(collisionPairs_1_1.value, 2), entity = _f[0], candidate = _f[1];
                        var collider = entity.getComponent(physics.Collider);
                        var collider2 = candidate.getComponent(physics.Collider);
                        var rigidBody = entity.getComponent(physics.RigidBody);
                        var rigidBody2 = candidate.getComponent(physics.RigidBody);
                        collider.isColliding = true;
                        collider2.isColliding = true;
                        // 如果两个刚体都是动态的，那么将他们拆开并反转他们的速度
                        if (rigidBody && !rigidBody.isKinematic && rigidBody2 && !rigidBody2.isKinematic) {
                            // 反转速度
                            rigidBody.velocity = rigidBody.velocity.mul(new physics.FixedPoint(-1));
                            rigidBody2.velocity = rigidBody2.velocity.mul(new physics.FixedPoint(-1));
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (collisionPairs_1_1 && !collisionPairs_1_1.done && (_d = collisionPairs_1.return)) _d.call(collisionPairs_1);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            };
            return CollisionResponseSystem;
        }(gs.System));
        physics.CollisionResponseSystem = CollisionResponseSystem;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        function findItem(item, items, equalsFn) {
            if (!equalsFn) {
                return items.indexOf(item);
            }
            for (var i = 0; i < items.length; i++) {
                if (equalsFn(item, items[i])) {
                    return i;
                }
            }
            return -1;
        }
        physics.findItem = findItem;
        function calcBounds(node, toBounds) {
            distBounds(node, 0, node.children.length, toBounds, node);
        }
        physics.calcBounds = calcBounds;
        function distBounds(node, k, p, toBounds, destNode) {
            if (!destNode) {
                destNode = createNode(null);
            }
            destNode.bounds = new physics.BoxBounds(physics.Vector2.zero(), new physics.FixedPoint(), new physics.FixedPoint(), null);
            var minX = Infinity;
            var minY = Infinity;
            var maxX = -Infinity;
            var maxY = -Infinity;
            for (var i = k; i < p; i++) {
                var child = node.children[i];
                var bounds = toBounds(child);
                minX = Math.min(minX, bounds.position.x.toFloat());
                minY = Math.min(minY, bounds.position.y.toFloat());
                maxX = Math.max(maxX, bounds.position.x.toFloat() + bounds.width.toFloat());
                maxY = Math.max(maxY, bounds.position.y.toFloat() + bounds.height.toFloat());
            }
            // 创建一个新的Bounds对象
            var newBounds = new physics.BoxBounds(new physics.Vector2(minX, minY), new physics.FixedPoint(maxX - minX), new physics.FixedPoint(maxY - minY), destNode.bounds.entity);
            // 设置destNode的Collider的Bounds
            destNode.bounds = newBounds;
            return destNode;
        }
        physics.distBounds = distBounds;
        function extend(a, b) {
            var minX = Math.min(a.position.x.toFloat(), b.position.x.toFloat());
            var minY = Math.min(a.position.y.toFloat(), b.position.y.toFloat());
            var maxX = Math.max(a.position.x.toFloat() + a.width.toFloat(), b.position.x.toFloat() + b.width.toFloat());
            var maxY = Math.max(a.position.y.toFloat() + a.height.toFloat(), b.position.y.toFloat() + b.height.toFloat());
            a.position.x = new physics.FixedPoint(minX);
            a.position.y = new physics.FixedPoint(minY);
            a.width = new physics.FixedPoint(maxX - minX);
            a.height = new physics.FixedPoint(maxY - minY);
            return a;
        }
        physics.extend = extend;
        function compareNodeMinX(a, b) {
            return a.bounds.position.x.toFloat() - b.bounds.position.x.toFloat();
        }
        physics.compareNodeMinX = compareNodeMinX;
        function compareNodeMinY(a, b) {
            return a.bounds.position.y.toFloat() - b.bounds.position.y.toFloat();
        }
        physics.compareNodeMinY = compareNodeMinY;
        function boundsArea(a) {
            var bounds = a.bounds;
            return bounds.width.toFloat() * bounds.height.toFloat();
        }
        physics.boundsArea = boundsArea;
        function boundsMargin(a) {
            var bounds = a.bounds;
            return bounds.width.toFloat() + bounds.height.toFloat();
        }
        physics.boundsMargin = boundsMargin;
        function enlargedArea(a, b) {
            return (Math.max(b.position.x.toFloat() + b.width.toFloat(), a.position.x.toFloat() + a.width.toFloat()) - Math.min(b.position.x.toFloat(), a.position.x.toFloat())) *
                (Math.max(b.position.y.toFloat() + b.height.toFloat(), a.position.y.toFloat() + a.height.toFloat()) - Math.min(b.position.y.toFloat(), a.position.y.toFloat()));
        }
        physics.enlargedArea = enlargedArea;
        function intersectionArea(a, b) {
            var minX = Math.max(a.position.x.toFloat(), b.position.x.toFloat());
            var minY = Math.max(a.position.y.toFloat(), b.position.y.toFloat());
            var maxX = Math.min(a.position.x.toFloat() + a.width.toFloat(), b.position.x.toFloat() + b.width.toFloat());
            var maxY = Math.min(a.position.y.toFloat() + a.height.toFloat(), b.position.y.toFloat() + b.height.toFloat());
            return Math.max(0, maxX - minX) *
                Math.max(0, maxY - minY);
        }
        physics.intersectionArea = intersectionArea;
        function createNode(children) {
            return {
                children: children,
                height: 1,
                leaf: true,
                bounds: new physics.BoxBounds(physics.Vector2.zero(), new physics.FixedPoint(), new physics.FixedPoint(), null)
            };
        }
        physics.createNode = createNode;
        function multiSelect(arr, left, right, n, compare) {
            var stack = [left, right];
            while (stack.length) {
                right = stack.pop();
                left = stack.pop();
                if (right - left <= n) {
                    continue;
                }
                var mid = left + Math.ceil((right - left) / n / 2) * n;
                quickselect(arr, mid, left, right, compare);
                stack.push(left, mid, mid, right);
            }
        }
        physics.multiSelect = multiSelect;
        function quickselect(arr, k, left, right, compare) {
            while (right > left) {
                if (right - left > 600) {
                    var n = right - left + 1;
                    var m = k - left + 1;
                    var z = Math.log(n);
                    var s = 0.5 * Math.exp(2 * z / 3);
                    var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * Math.sign(m - n / 2);
                    var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
                    var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
                    quickselect(arr, k, newLeft, newRight, compare);
                }
                var t = arr[k];
                var i = left;
                var j = right;
                swap(arr, left, k);
                if (compare(arr[right], t) > 0) {
                    swap(arr, left, right);
                }
                while (i < j) {
                    swap(arr, i, j);
                    i++;
                    j--;
                    while (compare(arr[i], t) < 0) {
                        i++;
                    }
                    while (compare(arr[j], t) > 0) {
                        j--;
                    }
                }
                if (compare(arr[left], t) === 0) {
                    swap(arr, left, j);
                }
                else {
                    j++;
                    swap(arr, j, right);
                }
                if (j <= k) {
                    left = j + 1;
                }
                if (k <= j) {
                    right = j - 1;
                }
            }
        }
        physics.quickselect = quickselect;
        function swap(arr, i, j) {
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        physics.swap = swap;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var DynamicTree = /** @class */ (function () {
            function DynamicTree(maxEntries) {
                if (maxEntries === void 0) { maxEntries = 9; }
                // 默认情况下，节点中的最大条目数为9；最佳性能时，最小节点填充为40%
                this._maxEntries = Math.max(4, maxEntries);
                this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
                this.clear();
            }
            DynamicTree.prototype.compareMinX = function (a, b) {
                return a.bounds.position.x.toFloat() - b.bounds.position.x.toFloat();
            };
            DynamicTree.prototype.compareMinY = function (a, b) {
                return a.bounds.position.y.toFloat() - b.bounds.position.y.toFloat();
            };
            DynamicTree.prototype.all = function () {
                return this._all(this.data, []);
            };
            DynamicTree.prototype.search = function (bounds) {
                var node = this.data;
                var result = [];
                if (!bounds.intersects(node.bounds))
                    return result;
                var nodesToSearch = [];
                while (node) {
                    for (var i = 0; i < node.children.length; i++) {
                        var child = node.children[i];
                        if (bounds.intersects(child.bounds)) {
                            if (node.leaf)
                                result.push(child);
                            else if (bounds.contains(child.bounds))
                                this._all(child, result);
                            else
                                nodesToSearch.push(child);
                        }
                    }
                    node = nodesToSearch.pop();
                }
                return result;
            };
            DynamicTree.prototype.collides = function (bounds) {
                var node = this.data;
                if (!bounds.intersects(node.bounds))
                    return false;
                var nodesToSearch = [];
                while (node) {
                    for (var i = 0; i < node.children.length; i++) {
                        var child = node.children[i];
                        if (bounds.intersects(child.bounds)) {
                            if (node.leaf || bounds.contains(child.bounds))
                                return true;
                            nodesToSearch.push(child);
                        }
                    }
                    node = nodesToSearch.pop();
                }
                return false;
            };
            DynamicTree.prototype.load = function (data) {
                if (!(data && data.length))
                    return this;
                if (data.length < this._minEntries) {
                    for (var i = 0; i < data.length; i++) {
                        this.insert(data[i]);
                    }
                    return this;
                }
                // 使用OMT算法从头开始递归构建树结构
                var node = this._build(data.slice(), 0, data.length - 1, 0);
                if (!this.data.children.length) {
                    // 如果树为空，则保存
                    this.data = node;
                }
                else if (this.data.height === node.height) {
                    // 如果树的高度相同，则分割根节点
                    this._splitRoot(this.data, node);
                }
                else {
                    if (this.data.height < node.height) {
                        // 如果插入的树较大，则交换树
                        var tmpNode = this.data;
                        this.data = node;
                        node = tmpNode;
                    }
                    // 在合适的层级将小树插入大树中
                    this._insert(node, this.data.height - node.height - 1, true);
                }
                return this;
            };
            DynamicTree.prototype.insert = function (item) {
                if (item)
                    this._insert(item, this.data.height - 1);
                return this;
            };
            DynamicTree.prototype.clear = function () {
                this.data = physics.createNode([]);
                return this;
            };
            DynamicTree.prototype.remove = function (item, equalsFn) {
                if (!item)
                    return this;
                var node = this.data;
                var bbox = item.bounds;
                var path = [];
                var indexes = [];
                var i, parent, goingUp;
                // 深度优先的迭代树遍历
                while (node || path.length) {
                    if (!node) {
                        node = path.pop();
                        parent = path[path.length - 1];
                        i = indexes.pop();
                        goingUp = true;
                    }
                    if (node.leaf) {
                        // 检查当前节点
                        var index = physics.findItem(item, node.children, equalsFn);
                        if (index !== -1) {
                            // 找到项目，删除项目并向上调整树
                            node.children.splice(index, 1);
                            path.push(node);
                            this._condense(path);
                            return this;
                        }
                    }
                    if (!goingUp && !node.leaf && item.bounds.contains(node.bounds)) {
                        path.push(node);
                        indexes.push(i);
                        i = 0;
                        parent = node;
                        node = node.children[0];
                    }
                    else if (parent) {
                        i++;
                        node = parent.children[i];
                        goingUp = false;
                    }
                    else
                        node = null;
                }
                return this;
            };
            DynamicTree.prototype.toBounds = function (item) {
                return item.bounds;
            };
            DynamicTree.prototype.toJSON = function () {
                return this.data;
            };
            DynamicTree.prototype.fromJSON = function (data) {
                this.data = data;
                return this;
            };
            DynamicTree.prototype._all = function (node, result) {
                var nodesToSearch = [];
                while (node) {
                    if (node.leaf)
                        result.push.apply(result, __spread(node.children));
                    else
                        nodesToSearch.push.apply(nodesToSearch, __spread(node.children));
                    node = nodesToSearch.pop();
                }
                return result;
            };
            DynamicTree.prototype._build = function (items, left, right, height) {
                var N = right - left + 1;
                var M = this._maxEntries;
                var node;
                if (N <= M) {
                    // 达到叶级别；返回叶节点
                    node = physics.createNode(items.slice(left, right + 1));
                    physics.calcBounds(node, this.toBounds);
                    return node;
                }
                if (!height) {
                    // 目标高度为批量加载的树
                    height = Math.ceil(Math.log(N) / Math.log(M));
                    // 目标根节点条目数量以最大化存储利用率
                    M = Math.ceil(N / Math.pow(M, height - 1));
                }
                node = physics.createNode([]);
                node.leaf = false;
                node.height = height;
                // 将条目拆分为M个方形的瓦片
                var N2 = Math.ceil(N / M);
                var N1 = N2 * Math.ceil(Math.sqrt(M));
                physics.multiSelect(items, left, right, N1, this.compareMinX);
                for (var i = left; i <= right; i += N1) {
                    var right2 = Math.min(i + N1 - 1, right);
                    physics.multiSelect(items, i, right2, N2, this.compareMinY);
                    for (var j = i; j <= right2; j += N2) {
                        var right3 = Math.min(j + N2 - 1, right2);
                        node.children.push(this._build(items, j, right3, height - 1));
                    }
                }
                physics.calcBounds(node, this.toBounds);
                return node;
            };
            DynamicTree.prototype._chooseSubtree = function (bounds, node, level, path) {
                while (true) {
                    path.push(node);
                    if (node.leaf || path.length - 1 === level)
                        break;
                    var minArea = Infinity;
                    var minEnlargement = Infinity;
                    var targetNode = void 0;
                    for (var i = 0; i < node.children.length; i++) {
                        var child = node.children[i];
                        var area = physics.boundsArea(child);
                        var enlargement = physics.enlargedArea(bounds, child.bounds) - area;
                        // 选择面积扩展最小的条目
                        if (enlargement < minEnlargement) {
                            minEnlargement = enlargement;
                            minArea = area < minArea ? area : minArea;
                            targetNode = child;
                        }
                        else if (enlargement === minEnlargement) {
                            // 否则选择面积最小的条目
                            if (area < minArea) {
                                minArea = area;
                                targetNode = child;
                            }
                        }
                    }
                    node = targetNode || node.children[0];
                }
                return node;
            };
            DynamicTree.prototype._insert = function (item, level, isNode) {
                var bounds = isNode ? item.bounds : item.bounds;
                var insertPath = [];
                // 找到最适合容纳条目的节点，并保存沿途的所有节点
                var node = this._chooseSubtree(item.bounds, this.data, level, insertPath);
                // 将条目放入节点中
                node.children.push(item);
                physics.extend(node.bounds, bounds);
                // 分割节点溢出；如有必要，向上传播
                while (level >= 0) {
                    if (insertPath[level].children.length > this._maxEntries) {
                        this._split(insertPath, level);
                        level--;
                    }
                    else
                        break;
                }
                // 调整沿插入路径的Bounds
                this._adjustParentBounds(bounds, insertPath, level);
            };
            // 将溢出的节点分割为两个节点
            DynamicTree.prototype._split = function (insertPath, level) {
                var node = insertPath[level];
                var M = node.children.length;
                var m = this._minEntries;
                this._chooseSplitAxis(node, m, M);
                var splitIndex = this._chooseSplitIndex(node, m, M);
                var newNode = physics.createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
                newNode.height = node.height;
                newNode.leaf = node.leaf;
                physics.calcBounds(node, this.toBounds);
                physics.calcBounds(newNode, this.toBounds);
                if (level)
                    insertPath[level - 1].children.push(newNode);
                else
                    this._splitRoot(node, newNode);
            };
            DynamicTree.prototype._splitRoot = function (node, newNode) {
                this.data = physics.createNode([node, newNode]);
                this.data.height = node.height + 1;
                this.data.leaf = false;
                physics.calcBounds(this.data, this.toBounds);
            };
            DynamicTree.prototype._chooseSplitIndex = function (node, m, M) {
                var index;
                var minOverlap = Infinity;
                var minArea = Infinity;
                for (var i = m; i <= M - m; i++) {
                    var bbox1 = physics.distBounds(node, 0, i, this.toBounds);
                    var bbox2 = physics.distBounds(node, i, M, this.toBounds);
                    var overlap = physics.intersectionArea(bbox1.bounds, bbox2.bounds);
                    var area = physics.boundsArea(bbox1) + physics.boundsArea(bbox2);
                    // 选择重叠最小的分布
                    if (overlap < minOverlap) {
                        minOverlap = overlap;
                        index = i;
                        minArea = area < minArea ? area : minArea;
                    }
                    else if (overlap === minOverlap) {
                        // 否则选择面积最小的分布
                        if (area < minArea) {
                            minArea = area;
                            index = i;
                        }
                    }
                }
                return index || M - m;
            };
            // 根据最佳分割轴对节点的子项进行排序
            DynamicTree.prototype._chooseSplitAxis = function (node, m, M) {
                var compareMinX = node.leaf ? this.compareMinX : physics.compareNodeMinX;
                var compareMinY = node.leaf ? this.compareMinY : physics.compareNodeMinY;
                var xMargin = this._allDistMargin(node, m, M, compareMinX);
                var yMargin = this._allDistMargin(node, m, M, compareMinY);
                // 如果总分布边距值对于x最小，则按minX排序，
                // 否则已经按minY排序
                if (xMargin < yMargin)
                    node.children.sort(compareMinX);
            };
            // 所有可能的分布中，每个节点至少为m时的总边距
            DynamicTree.prototype._allDistMargin = function (node, m, M, compare) {
                node.children.sort(compare);
                var toBounds = this.toBounds;
                var leftBounds = physics.distBounds(node, 0, m, toBounds);
                var rightBounds = physics.distBounds(node, M - m, M, toBounds);
                var margin = physics.boundsMargin(leftBounds) + physics.boundsMargin(rightBounds);
                for (var i = m; i < M - m; i++) {
                    var child = node.children[i];
                    physics.extend(leftBounds.bounds, node.leaf ? toBounds(child) : child.bounds);
                    margin += physics.boundsMargin(leftBounds);
                }
                for (var i = M - m - 1; i >= m; i--) {
                    var child = node.children[i];
                    physics.extend(rightBounds.bounds, node.leaf ? toBounds(child) : child.bounds);
                    margin += physics.boundsMargin(rightBounds);
                }
                return margin;
            };
            DynamicTree.prototype._adjustParentBounds = function (bounds, path, level) {
                // 调整给定树路径上的Bounds
                for (var i = level; i >= 0; i--) {
                    physics.extend(path[i].bounds, bounds);
                }
            };
            DynamicTree.prototype._condense = function (path) {
                // 遍历路径，删除空节点并更新bbox
                for (var i = path.length - 1, siblings = void 0; i >= 0; i--) {
                    if (path[i].children.length === 0) {
                        if (i > 0) {
                            siblings = path[i - 1].children;
                            siblings.splice(siblings.indexOf(path[i]), 1);
                        }
                        else
                            this.clear();
                    }
                    else
                        physics.calcBounds(path[i], this.toBounds);
                }
            };
            return DynamicTree;
        }());
        physics.DynamicTree = DynamicTree;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var Edge = /** @class */ (function () {
            function Edge(a, b) {
                this.pointA = a;
                this.pointB = b;
                var AB = b.sub(a);
                var AO = a.negate();
                this.distance = AB.cross(AO).div(AB.length()); // 到原点O的垂直距离
            }
            return Edge;
        }());
        physics.Edge = Edge;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var FixedPoint = /** @class */ (function () {
            function FixedPoint(value, precision) {
                if (value === void 0) { value = 0; }
                if (precision === void 0) { precision = 1000; }
                this.rawValue = Math.round(value * precision);
                this.precision = precision;
            }
            FixedPoint.prototype.add = function (other) {
                var result = new FixedPoint(0, this.precision);
                if (other instanceof FixedPoint) {
                    result.rawValue = this.rawValue + other.rawValue;
                }
                else {
                    result.rawValue = this.rawValue + Math.round(other * this.precision);
                }
                return result;
            };
            FixedPoint.prototype.sub = function (other) {
                var result = new FixedPoint(0, this.precision);
                if (other instanceof FixedPoint) {
                    result.rawValue = this.rawValue - other.rawValue;
                }
                else {
                    result.rawValue = this.rawValue - Math.round(other * this.precision);
                }
                return result;
            };
            FixedPoint.prototype.mul = function (other) {
                var result = new FixedPoint(0, this.precision);
                if (other instanceof FixedPoint) {
                    result.rawValue = Math.round((this.rawValue * other.rawValue) / other.precision);
                }
                else {
                    result.rawValue = Math.round(this.rawValue * other);
                }
                return result;
            };
            FixedPoint.prototype.div = function (other) {
                var result = new FixedPoint(0, this.precision);
                if (other instanceof FixedPoint) {
                    result.rawValue = Math.round((this.rawValue / other.rawValue) * this.precision);
                }
                else {
                    result.rawValue = Math.round(this.rawValue / other);
                }
                return result;
            };
            FixedPoint.prototype.abs = function () {
                var result = new FixedPoint(0, this.precision);
                result.rawValue = Math.abs(this.rawValue);
                return result;
            };
            FixedPoint.prototype.pow = function (exponent) {
                var floatResult = Math.pow(this.toFloat(), exponent);
                return FixedPoint.from(floatResult);
            };
            FixedPoint.prototype.lt = function (other) {
                if (other instanceof FixedPoint) {
                    return this.rawValue < other.rawValue;
                }
                else {
                    return this.rawValue < Math.round(other * this.precision);
                }
            };
            FixedPoint.prototype.gt = function (other) {
                if (other instanceof FixedPoint) {
                    return this.rawValue > other.rawValue;
                }
                else {
                    return this.rawValue > Math.round(other * this.precision);
                }
            };
            FixedPoint.prototype.gte = function (other) {
                if (other instanceof FixedPoint) {
                    return this.rawValue >= other.rawValue;
                }
                else {
                    return this.rawValue >= Math.round(other * this.precision);
                }
            };
            FixedPoint.prototype.lte = function (other) {
                if (other instanceof FixedPoint) {
                    return this.rawValue <= other.rawValue;
                }
                else {
                    return this.rawValue <= Math.round(other * this.precision);
                }
            };
            FixedPoint.prototype.neg = function () {
                var result = new FixedPoint();
                result.rawValue = -this.rawValue;
                return result;
            };
            FixedPoint.prototype.toFloat = function () {
                return this.rawValue / this.precision;
            };
            FixedPoint.add = function (a, b) {
                var result = new FixedPoint();
                if (b instanceof FixedPoint) {
                    result.rawValue = a.rawValue + b.rawValue;
                }
                else {
                    result.rawValue = a.rawValue + Math.round(b * a.precision);
                }
                return result;
            };
            FixedPoint.sub = function (a, b) {
                var result = new FixedPoint();
                if (b instanceof FixedPoint) {
                    result.rawValue = a.rawValue - b.rawValue;
                }
                else {
                    result.rawValue = a.rawValue - Math.round(b * a.precision);
                }
                return result;
            };
            FixedPoint.mul = function (a, b) {
                var result = new FixedPoint();
                if (b instanceof FixedPoint) {
                    result.rawValue = Math.round((a.rawValue * b.rawValue) / b.precision);
                }
                else {
                    result.rawValue = Math.round(a.rawValue * b);
                }
                return result;
            };
            FixedPoint.div = function (a, b) {
                var result = new FixedPoint();
                if (b instanceof FixedPoint) {
                    result.rawValue = Math.round((a.rawValue / b.rawValue) * a.precision);
                }
                else {
                    result.rawValue = Math.round(a.rawValue / b);
                }
                return result;
            };
            FixedPoint.max = function (a, b) {
                return a.gt(b) ? a : b;
            };
            FixedPoint.min = function (a, b) {
                return a.lt(b) ? a : b;
            };
            FixedPoint.from = function (value) {
                var parsedValue = typeof value === 'number' ? value : parseFloat(value);
                return new FixedPoint(parsedValue);
            };
            return FixedPoint;
        }());
        physics.FixedPoint = FixedPoint;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var Projection = /** @class */ (function () {
            function Projection(min, max) {
                this.min = min;
                this.max = max;
            }
            Projection.prototype.overlaps = function (other) {
                return this.max >= other.min && this.min <= other.max;
            };
            return Projection;
        }());
        physics.Projection = Projection;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var RigidBody = /** @class */ (function (_super) {
            __extends(RigidBody, _super);
            function RigidBody() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.dependencies = [
                    physics.Transform
                ];
                return _this;
            }
            RigidBody.prototype.onInitialize = function (mass, isKinematic) {
                if (mass === void 0) { mass = new physics.FixedPoint(1); }
                if (isKinematic === void 0) { isKinematic = false; }
                this.mass = mass;
                this.velocity = new physics.Vector2(new physics.FixedPoint(0), new physics.FixedPoint(0));
                this.acceleration = new physics.Vector2(new physics.FixedPoint(0), new physics.FixedPoint(0));
                this.isKinematic = isKinematic;
            };
            RigidBody.prototype.applyForce = function (force) {
                // 使用 F = m * a，或者 a = F / m
                var forceAccel = new physics.Vector2(force.x.div(this.mass), force.y.div(this.mass));
                this.acceleration = this.acceleration.add(forceAccel);
            };
            RigidBody.prototype.update = function (deltaTime) {
                // 更新速度和位置
                this.velocity = this.velocity.add(new physics.Vector2(this.acceleration.x.mul(deltaTime), this.acceleration.y.mul(deltaTime)));
                var position = this.entity.getComponent(physics.Transform).position;
                this.entity.getComponent(physics.Transform).position = position.add(new physics.Vector2(this.velocity.x.mul(deltaTime), this.velocity.y.mul(deltaTime)));
                // 重置加速度
                this.acceleration.set(new physics.FixedPoint(0), new physics.FixedPoint(0));
            };
            return RigidBody;
        }(gs.Component));
        physics.RigidBody = RigidBody;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var Simplex = /** @class */ (function () {
            function Simplex() {
                this.vertices = [];
            }
            Simplex.prototype.add = function (v) {
                this.vertices.unshift(v); // 添加新的点到数组前面
            };
            return Simplex;
        }());
        physics.Simplex = Simplex;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var Size = /** @class */ (function () {
            function Size(width, height) {
                if (width === void 0) { width = 0; }
                if (height === void 0) { height = 0; }
                this.width = new physics.FixedPoint(width);
                this.height = new physics.FixedPoint(height);
            }
            Size.prototype.add = function (other) {
                return new Size(this.width.toFloat() + other.width.toFloat(), this.height.toFloat() + other.height.toFloat());
            };
            Size.prototype.subtract = function (other) {
                return new Size(this.width.toFloat() - other.width.toFloat(), this.height.toFloat() - other.height.toFloat());
            };
            Size.prototype.multiply = function (scalar) {
                return new Size(this.width.toFloat() * scalar, this.height.toFloat() * scalar);
            };
            Size.prototype.divide = function (scalar) {
                return new Size(this.width.toFloat() / scalar, this.height.toFloat() / scalar);
            };
            return Size;
        }());
        physics.Size = Size;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var SpatialHash = /** @class */ (function () {
            function SpatialHash(cellSize) {
                this.setPool = [];
                this.cellSize = cellSize;
                this.hashTable = new Map();
                this.objectTable = new Map();
            }
            SpatialHash.prototype.hash = function (x, y) {
                var prime1 = 73856093, prime2 = 19349663;
                return x * prime1 ^ y * prime2;
            };
            SpatialHash.prototype.getSetFromPool = function () {
                if (this.setPool.length > 0) {
                    return this.setPool.pop();
                }
                else {
                    return new Set();
                }
            };
            SpatialHash.prototype.returnSetToPool = function (set) {
                set.clear();
                this.setPool.push(set);
            };
            SpatialHash.prototype.insert = function (obj) {
                var minX = Math.floor(obj.position.x.toFloat() / this.cellSize);
                var minY = Math.floor(obj.position.y.toFloat() / this.cellSize);
                var maxX = Math.floor((obj.position.x.toFloat() + obj.width.toFloat()) / this.cellSize);
                var maxY = Math.floor((obj.position.y.toFloat() + obj.height.toFloat()) / this.cellSize);
                var keys = [];
                for (var x = minX; x <= maxX; x++) {
                    for (var y = minY; y <= maxY; y++) {
                        var key = this.hash(x, y);
                        keys.push(key);
                        var bucket = this.hashTable.get(key);
                        if (!bucket) {
                            bucket = this.getSetFromPool();
                            this.hashTable.set(key, bucket);
                        }
                        bucket.add(obj);
                    }
                }
                this.objectTable.set(obj, keys);
            };
            SpatialHash.prototype.retrieve = function (obj, callback) {
                var e_8, _a, e_9, _b;
                var keys = this.objectTable.get(obj);
                if (keys) {
                    try {
                        for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                            var key = keys_1_1.value;
                            var bucket = this.hashTable.get(key);
                            if (bucket) {
                                try {
                                    for (var bucket_1 = __values(bucket), bucket_1_1 = bucket_1.next(); !bucket_1_1.done; bucket_1_1 = bucket_1.next()) {
                                        var obj_1 = bucket_1_1.value;
                                        callback(obj_1);
                                    }
                                }
                                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                                finally {
                                    try {
                                        if (bucket_1_1 && !bucket_1_1.done && (_b = bucket_1.return)) _b.call(bucket_1);
                                    }
                                    finally { if (e_9) throw e_9.error; }
                                }
                            }
                        }
                    }
                    catch (e_8_1) { e_8 = { error: e_8_1 }; }
                    finally {
                        try {
                            if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
                        }
                        finally { if (e_8) throw e_8.error; }
                    }
                }
            };
            SpatialHash.prototype.retrieveAll = function () {
                var e_10, _a;
                var result = [];
                try {
                    for (var _b = __values(this.hashTable.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var bucket = _c.value;
                        result.push.apply(result, __spread(bucket));
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
                return result;
            };
            SpatialHash.prototype.remove = function (obj) {
                var e_11, _a;
                var keys = this.objectTable.get(obj);
                if (keys) {
                    try {
                        for (var keys_2 = __values(keys), keys_2_1 = keys_2.next(); !keys_2_1.done; keys_2_1 = keys_2.next()) {
                            var key = keys_2_1.value;
                            var bucket = this.hashTable.get(key);
                            if (bucket) {
                                bucket.delete(obj);
                                if (bucket.size === 0) {
                                    this.returnSetToPool(bucket);
                                    this.hashTable.delete(key);
                                }
                            }
                        }
                    }
                    catch (e_11_1) { e_11 = { error: e_11_1 }; }
                    finally {
                        try {
                            if (keys_2_1 && !keys_2_1.done && (_a = keys_2.return)) _a.call(keys_2);
                        }
                        finally { if (e_11) throw e_11.error; }
                    }
                    this.objectTable.delete(obj);
                }
            };
            SpatialHash.prototype.clear = function () {
                var e_12, _a;
                try {
                    for (var _b = __values(this.setPool), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var set = _c.value;
                        set.clear();
                    }
                }
                catch (e_12_1) { e_12 = { error: e_12_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_12) throw e_12.error; }
                }
                this.hashTable.clear();
                this.objectTable.clear();
            };
            return SpatialHash;
        }());
        physics.SpatialHash = SpatialHash;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var Transform = /** @class */ (function (_super) {
            __extends(Transform, _super);
            function Transform() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Transform.prototype.onInitialize = function (x, y) {
                if (x === void 0) { x = 0; }
                if (y === void 0) { y = 0; }
                this.position = new physics.Vector2(x, y);
            };
            return Transform;
        }(gs.Component));
        physics.Transform = Transform;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var Vector2 = /** @class */ (function () {
            function Vector2(x, y) {
                if (x === void 0) { x = 0; }
                if (y === void 0) { y = 0; }
                this.x = x instanceof physics.FixedPoint ? x : new physics.FixedPoint(x);
                this.y = y instanceof physics.FixedPoint ? y : new physics.FixedPoint(y);
            }
            Vector2.zero = function () {
                return new Vector2();
            };
            Vector2.prototype.add = function (other) {
                return new Vector2(physics.FixedPoint.add(this.x, other.x), physics.FixedPoint.add(this.y, other.y));
            };
            Vector2.prototype.sub = function (other) {
                return new Vector2(physics.FixedPoint.sub(this.x, other.x), physics.FixedPoint.sub(this.y, other.y));
            };
            Vector2.prototype.mul = function (scalar) {
                return new Vector2(physics.FixedPoint.mul(this.x, scalar), physics.FixedPoint.mul(this.y, scalar));
            };
            Vector2.prototype.div = function (scalar) {
                return new Vector2(physics.FixedPoint.div(this.x, scalar), physics.FixedPoint.div(this.y, scalar));
            };
            Vector2.prototype.set = function (x, y) {
                this.x = x;
                this.y = y;
                return this;
            };
            Vector2.prototype.setR = function (value) {
                this.x = value.x;
                this.y = value.y;
                return this;
            };
            /** 计算向量的长度 */
            Vector2.prototype.length = function () {
                var lengthSquared = physics.FixedPoint.add(physics.FixedPoint.mul(this.x, this.x), physics.FixedPoint.mul(this.y, this.y));
                return physics.FixedPoint.from(Math.sqrt(lengthSquared.toFloat()));
            };
            /** 计算向量的平方长度 */
            Vector2.prototype.lengthSquared = function () {
                return physics.FixedPoint.add(physics.FixedPoint.mul(this.x, this.x), physics.FixedPoint.mul(this.y, this.y));
            };
            /** 归一化向量 */
            Vector2.prototype.normalize = function () {
                var len = this.length();
                return new Vector2(physics.FixedPoint.div(this.x, len), physics.FixedPoint.div(this.y, len));
            };
            /** 计算两个向量的点积 */
            Vector2.prototype.dot = function (other) {
                return physics.FixedPoint.add(physics.FixedPoint.mul(this.x, other.x), physics.FixedPoint.mul(this.y, other.y));
            };
            /** 计算两个向量的叉积 */
            Vector2.prototype.cross = function (other) {
                return physics.FixedPoint.sub(physics.FixedPoint.mul(this.x, other.y), physics.FixedPoint.mul(this.y, other.x));
            };
            /** 计算两个向量的叉积 */
            Vector2.prototype.crossR = function (other) {
                return physics.FixedPoint.sub(this.x.mul(other), this.y.mul(other));
            };
            /** 计算到另一个向量的距离 */
            Vector2.prototype.distanceTo = function (other) {
                var dx = physics.FixedPoint.sub(this.x, other.x);
                var dy = physics.FixedPoint.sub(this.y, other.y);
                var distanceSquared = physics.FixedPoint.add(physics.FixedPoint.mul(dx, dx), physics.FixedPoint.mul(dy, dy));
                return physics.FixedPoint.from(Math.sqrt(distanceSquared.toFloat()));
            };
            /** 获取当前向量逆时针旋转90度的垂直向量 */
            Vector2.prototype.perp = function () {
                return new Vector2(this.y.neg(), this.x);
            };
            /** 获取当前向量顺时针旋转90度的垂直向量 */
            Vector2.prototype.perpR = function () {
                return new Vector2(this.y, this.x.neg());
            };
            Vector2.prototype.lengthSq = function () {
                return this.x.mul(this.x).add(this.y.mul(this.y));
            };
            /**
            * 创建一个包含指定向量反转的新Vector2
            * @returns 矢量反演的结果
            */
            Vector2.prototype.negate = function () {
                return new Vector2(this.x.neg(), this.y.neg());
            };
            /**
            * 创建一个包含指定向量反转的新Vector2
            * @param value
            * @returns 矢量反演的结果
            */
            Vector2.negate = function (value) {
                value.x = value.x.neg();
                value.y = value.y.neg();
                return value;
            };
            return Vector2;
        }());
        physics.Vector2 = Vector2;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var World = /** @class */ (function () {
            function World(gravity, timeStep) {
                if (gravity === void 0) { gravity = new physics.FixedPoint(0, -9.81); }
                if (timeStep === void 0) { timeStep = new physics.FixedPoint(1 / 60); }
                this.name = "PhysicsPlugin";
                this.gravity = gravity;
                this.timeStep = timeStep;
            }
            World.prototype.onInit = function (core) {
                core.systemManager.registerSystem(new physics.CollisionResponseSystem(core.entityManager, this.timeStep.toFloat() * 1000));
            };
            World.prototype.onUpdate = function (deltaTime) { };
            return World;
        }());
        physics.World = World;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var Collider = /** @class */ (function (_super) {
            __extends(Collider, _super);
            function Collider() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.dependencies = [
                    physics.Transform
                ];
                return _this;
            }
            Object.defineProperty(Collider.prototype, "transform", {
                get: function () {
                    if (this._transform == null) {
                        this._transform = this.entity.getComponent(physics.Transform);
                    }
                    return this._transform;
                },
                enumerable: true,
                configurable: true
            });
            Collider.prototype.getBounds = function () {
                this._bounds.position = this.transform.position;
                return this._bounds;
            };
            Collider.prototype.setBounds = function (bounds) {
                this._bounds = bounds;
            };
            Collider.prototype.intersects = function (other) {
                return this.getBounds().intersects(other.getBounds());
            };
            Collider.prototype.contains = function (other) {
                return this.getBounds().contains(other.getBounds());
            };
            return Collider;
        }(gs.Component));
        physics.Collider = Collider;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
///<reference path="Collider.ts" />
var gs;
///<reference path="Collider.ts" />
(function (gs) {
    var physics;
    (function (physics) {
        var BoxCollider = /** @class */ (function (_super) {
            __extends(BoxCollider, _super);
            function BoxCollider() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BoxCollider.prototype.onInitialize = function (size) {
                this.size = size;
                var bounds = new physics.BoxBounds(this.transform.position, this.size.width, this.size.height, this.entity);
                this.setBounds(bounds);
            };
            return BoxCollider;
        }(physics.Collider));
        physics.BoxCollider = BoxCollider;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var CircleCollider = /** @class */ (function (_super) {
            __extends(CircleCollider, _super);
            function CircleCollider() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CircleCollider.prototype.onInitialize = function (radius) {
                this.radius = radius;
                var bounds = new physics.CircleBounds(this.transform.position, this.radius, this.entity);
                this.setBounds(bounds);
            };
            return CircleCollider;
        }(physics.Collider));
        physics.CircleCollider = CircleCollider;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var PolygonCollider = /** @class */ (function (_super) {
            __extends(PolygonCollider, _super);
            function PolygonCollider() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return PolygonCollider;
        }(physics.Collider));
        physics.PolygonCollider = PolygonCollider;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var BoxBounds = /** @class */ (function () {
            function BoxBounds(position, width, height, entity) {
                this.position = position;
                this.width = width;
                this.height = height;
                this.entity = entity;
            }
            /**
             * 计算方形在指定方向上的投影
             * @param direction
             * @returns
             */
            BoxBounds.prototype.project = function (direction) {
                var e_13, _a;
                // 方形的四个顶点
                var vertices = [
                    this.position,
                    this.position.add(new physics.Vector2(this.width.toFloat(), 0)),
                    this.position.add(new physics.Vector2(this.width.toFloat(), this.height.toFloat())),
                    this.position.add(new physics.Vector2(0, this.height.toFloat())),
                ];
                var min = Infinity;
                var max = -Infinity;
                try {
                    for (var vertices_1 = __values(vertices), vertices_1_1 = vertices_1.next(); !vertices_1_1.done; vertices_1_1 = vertices_1.next()) {
                        var vertex = vertices_1_1.value;
                        var dot = vertex.dot(direction).toFloat();
                        min = Math.min(min, dot);
                        max = Math.max(max, dot);
                    }
                }
                catch (e_13_1) { e_13 = { error: e_13_1 }; }
                finally {
                    try {
                        if (vertices_1_1 && !vertices_1_1.done && (_a = vertices_1.return)) _a.call(vertices_1);
                    }
                    finally { if (e_13) throw e_13.error; }
                }
                return new physics.Projection(min, max);
            };
            BoxBounds.prototype.intersects = function (other) {
                var visitor = new physics.IntersectionVisitor(other);
                this.accept(visitor);
                return visitor.getResult();
            };
            BoxBounds.prototype.contains = function (other) {
                var visitor = new physics.ContainVisitor(other);
                this.accept(visitor);
                return visitor.getResult();
            };
            BoxBounds.prototype.accept = function (visitor) {
                visitor.visitBox(this);
            };
            return BoxBounds;
        }());
        physics.BoxBounds = BoxBounds;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var CircleBounds = /** @class */ (function () {
            function CircleBounds(position, radius, entity) {
                this.position = position;
                this.radius = radius;
                this.entity = entity;
                this.width = radius.mul(2);
                this.height = radius.mul(2);
            }
            CircleBounds.prototype.intersects = function (other) {
                var visitor = new physics.IntersectionVisitor(other);
                this.accept(visitor);
                return visitor.getResult();
            };
            CircleBounds.prototype.contains = function (other) {
                var visitor = new physics.ContainVisitor(other);
                this.accept(visitor);
                return visitor.getResult();
            };
            CircleBounds.prototype.accept = function (visitor) {
                visitor.visitCircle(this);
            };
            return CircleBounds;
        }());
        physics.CircleBounds = CircleBounds;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var ContainVisitor = /** @class */ (function () {
            function ContainVisitor(other) {
                this.other = other;
                this.result = false;
            }
            ContainVisitor.prototype.visitBox = function (box) {
                if (this.other instanceof physics.BoxBounds) {
                    var otherBox = this.other;
                    this.result = (box.position.x.toFloat() <= otherBox.position.x.toFloat() &&
                        box.position.y.toFloat() <= otherBox.position.y.toFloat() &&
                        box.position.x.toFloat() + box.width.toFloat() >= otherBox.position.x.toFloat() + otherBox.width.toFloat() &&
                        box.position.y.toFloat() + box.height.toFloat() >= otherBox.position.y.toFloat() + otherBox.height.toFloat());
                }
                else if (this.other instanceof physics.CircleBounds) {
                    var otherCircle = this.other;
                    var circleBoundingBox = new physics.BoxBounds(otherCircle.position, otherCircle.radius.mul(2), otherCircle.radius.mul(2), otherCircle.entity);
                    this.result = (box.position.x.toFloat() <= circleBoundingBox.position.x.toFloat() &&
                        box.position.y.toFloat() <= circleBoundingBox.position.y.toFloat() &&
                        box.position.x.toFloat() + box.width.toFloat() >= circleBoundingBox.position.x.toFloat() + circleBoundingBox.width.toFloat() &&
                        box.position.y.toFloat() + box.height.toFloat() >= circleBoundingBox.position.y.toFloat() + circleBoundingBox.height.toFloat());
                }
            };
            ContainVisitor.prototype.visitCircle = function (circle) {
                if (this.other instanceof physics.CircleBounds) {
                    var otherCircle = this.other;
                    var dx = circle.position.x.toFloat() - otherCircle.position.x.toFloat();
                    var dy = circle.position.y.toFloat() - otherCircle.position.y.toFloat();
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    this.result = (distance + otherCircle.radius.toFloat() <= circle.radius.toFloat());
                }
                else if (this.other instanceof physics.BoxBounds) {
                    var otherBox = this.other;
                    var boxBoundingCircleRadius = Math.sqrt(Math.pow(otherBox.width.toFloat() / 2, 2) + Math.pow(otherBox.height.toFloat() / 2, 2));
                    var boxBoundingCircle = new physics.CircleBounds(otherBox.position.add(new physics.Vector2(otherBox.width.div(2), otherBox.height.div(2))), new physics.FixedPoint(boxBoundingCircleRadius), otherBox.entity);
                    var dx = circle.position.x.toFloat() - boxBoundingCircle.position.x.toFloat();
                    var dy = circle.position.y.toFloat() - boxBoundingCircle.position.y.toFloat();
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    this.result = (distance + boxBoundingCircle.radius.toFloat() <= circle.radius.toFloat());
                }
            };
            ContainVisitor.prototype.visitPolygon = function (polygon) {
                if (this.other instanceof physics.PolygonBounds) {
                    var otherPolygon = this.other;
                    this.result = otherPolygon.vertices.every(function (point) {
                        return polygon.containsPoint(point);
                    });
                }
            };
            ContainVisitor.prototype.getResult = function () {
                return this.result;
            };
            return ContainVisitor;
        }());
        physics.ContainVisitor = ContainVisitor;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var IntersectionVisitor = /** @class */ (function () {
            function IntersectionVisitor(other) {
                this.other = other;
                this.result = false;
            }
            IntersectionVisitor.prototype.visitBox = function (box) {
                if (this.other instanceof physics.BoxBounds) {
                    var otherBox = this.other;
                    this.result = !(box.position.x.add(box.width).lt(otherBox.position.x) ||
                        otherBox.position.x.add(otherBox.width).lt(box.position.x) ||
                        box.position.y.add(box.height).lt(otherBox.position.y) ||
                        otherBox.position.y.add(otherBox.height).lt(box.position.y));
                }
                else if (this.other instanceof physics.CircleBounds) {
                    this.result = this.intersectsBoxCircle(box, this.other);
                }
                else if (this.other instanceof physics.PolygonBounds) {
                    this.result = this.intersectsPolygonBox(this.other, box);
                }
            };
            IntersectionVisitor.prototype.visitCircle = function (circle) {
                if (this.other instanceof physics.CircleBounds) {
                    var otherCircle = this.other;
                    var dx = circle.position.x.toFloat() - otherCircle.position.x.toFloat();
                    var dy = circle.position.y.toFloat() - otherCircle.position.y.toFloat();
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    this.result = distance < circle.radius.toFloat() + otherCircle.radius.toFloat();
                }
                else if (this.other instanceof physics.BoxBounds) {
                    this.result = this.intersectsBoxCircle(this.other, circle);
                }
                else if (this.other instanceof physics.PolygonBounds) {
                    this.result = this.intersectsPolygonCircle(this.other, circle);
                }
            };
            IntersectionVisitor.prototype.visitPolygon = function (polygon) {
                if (this.other instanceof physics.PolygonBounds) {
                    var otherPolygon = this.other;
                    var detector = new physics.CollisionDetector(polygon, otherPolygon);
                    this.result = detector.gjk();
                }
                else if (this.other instanceof physics.CircleBounds) {
                    // 处理多边形与圆形的相交
                    this.result = this.intersectsPolygonCircle(polygon, this.other);
                }
                else if (this.other instanceof physics.BoxBounds) {
                    // 处理多边形与方形的相交
                    this.result = this.intersectsPolygonBox(polygon, this.other);
                }
            };
            IntersectionVisitor.prototype.intersectsBoxCircle = function (box, circle) {
                var circleDistanceX = circle.position.x.sub(box.position.x.add(box.width.div(2))).abs();
                var circleDistanceY = circle.position.y.sub(box.position.y.add(box.height.div(2))).abs();
                if (circleDistanceX.gt(box.width.div(2).add(circle.radius))) {
                    return false;
                }
                if (circleDistanceY.gt(box.height.div(2).add(circle.radius))) {
                    return false;
                }
                if (circleDistanceX.lte(box.width.div(2))) {
                    return true;
                }
                if (circleDistanceY.lte(box.height.div(2))) {
                    return true;
                }
                var cornerDistanceSq = circleDistanceX.sub(box.width.div(2)).pow(2).add(circleDistanceY.sub(box.height.div(2)).pow(2));
                return cornerDistanceSq.lte(circle.radius.pow(2));
            };
            IntersectionVisitor.prototype.intersectsPolygonCircle = function (polygon, circle) {
                var e_14, _a;
                // 找到最近的顶点
                var minDistanceSq = Infinity;
                var nearestVertex = null;
                try {
                    for (var _b = __values(polygon.vertices), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var vertex = _c.value;
                        var distanceSq = vertex.sub(circle.position).lengthSq().toFloat();
                        if (distanceSq < minDistanceSq) {
                            minDistanceSq = distanceSq;
                            nearestVertex = vertex;
                        }
                    }
                }
                catch (e_14_1) { e_14 = { error: e_14_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_14) throw e_14.error; }
                }
                // 判断该顶点到圆心的距离是否小于等于圆的半径
                if (nearestVertex) {
                    return nearestVertex.sub(circle.position).lengthSq().toFloat() <= Math.pow(circle.radius.toFloat(), 2);
                }
                else {
                    return false;
                }
            };
            IntersectionVisitor.prototype.intersectsPolygonBox = function (polygon, box) {
                var e_15, _a;
                // 四个方向向量，表示方形的四个边
                var directions = [
                    new physics.Vector2(1, 0),
                    new physics.Vector2(0, 1),
                    new physics.Vector2(-1, 0),
                    new physics.Vector2(0, -1) // 下
                ];
                // 添加多边形的每条边的方向向量
                for (var i = 0; i < polygon.vertices.length; i++) {
                    var vertex1 = polygon.vertices[i];
                    var vertex2 = polygon.vertices[(i + 1) % polygon.vertices.length]; // 下一个顶点，考虑到最后一个顶点和第一个顶点的边
                    var edge = vertex2.sub(vertex1);
                    directions.push(edge.normalize().perp()); // 取这条边的单位法线向量
                }
                try {
                    // 对每个方向进行投影检查
                    for (var directions_1 = __values(directions), directions_1_1 = directions_1.next(); !directions_1_1.done; directions_1_1 = directions_1.next()) {
                        var direction = directions_1_1.value;
                        var polygonProjection = polygon.project(direction);
                        var boxProjection = box.project(direction);
                        if (!polygonProjection.overlaps(boxProjection)) { // 如果在某个方向上的投影没有重叠，那么多边形和方形不相交
                            return false;
                        }
                    }
                }
                catch (e_15_1) { e_15 = { error: e_15_1 }; }
                finally {
                    try {
                        if (directions_1_1 && !directions_1_1.done && (_a = directions_1.return)) _a.call(directions_1);
                    }
                    finally { if (e_15) throw e_15.error; }
                }
                // 所有方向上的投影都有重叠，所以多边形和方形相交
                return true;
            };
            IntersectionVisitor.prototype.getResult = function () {
                return this.result;
            };
            return IntersectionVisitor;
        }());
        physics.IntersectionVisitor = IntersectionVisitor;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
var gs;
(function (gs) {
    var physics;
    (function (physics) {
        var PolygonBounds = /** @class */ (function () {
            function PolygonBounds() {
            }
            Object.defineProperty(PolygonBounds.prototype, "vertices", {
                get: function () {
                    return this._vertices;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * 提供一个方向，返回多边形在该方向上的最远点
             * @param direction
             * @returns
             */
            PolygonBounds.prototype.getFarthestPointInDirection = function (direction) {
                var e_16, _a;
                var maxDotProduct = -Infinity;
                var farthestVertex = null;
                try {
                    for (var _b = __values(this._vertices), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var vertex = _c.value;
                        var dotProduct = vertex.dot(direction).toFloat();
                        if (dotProduct > maxDotProduct) {
                            maxDotProduct = dotProduct;
                            farthestVertex = vertex;
                        }
                    }
                }
                catch (e_16_1) { e_16 = { error: e_16_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_16) throw e_16.error; }
                }
                return farthestVertex;
            };
            /**
             * 计算多边形在指定方向上的投影
             * @param direction
             * @returns
             */
            PolygonBounds.prototype.project = function (direction) {
                var e_17, _a;
                var min = Infinity;
                var max = -Infinity;
                try {
                    for (var _b = __values(this._vertices), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var vertex = _c.value;
                        var dot = vertex.dot(direction).toFloat();
                        min = Math.min(min, dot);
                        max = Math.max(max, dot);
                    }
                }
                catch (e_17_1) { e_17 = { error: e_17_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_17) throw e_17.error; }
                }
                return new physics.Projection(min, max);
            };
            PolygonBounds.prototype.containsPoint = function (point) {
                var inside = false;
                var x = point.x.toFloat(), y = point.y.toFloat();
                for (var i = 0, j = this._vertices.length - 1; i < this._vertices.length; j = i++) {
                    var xi = this._vertices[i].x.toFloat(), yi = this._vertices[i].y.toFloat();
                    var xj = this._vertices[j].x.toFloat(), yj = this._vertices[j].y.toFloat();
                    var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) {
                        inside = !inside;
                    }
                }
                return inside;
            };
            PolygonBounds.prototype.intersects = function (other) {
                var visitor = new physics.IntersectionVisitor(other);
                this.accept(visitor);
                return visitor.getResult();
            };
            PolygonBounds.prototype.contains = function (other) {
                var visitor = new physics.ContainVisitor(other);
                this.accept(visitor);
                return visitor.getResult();
            };
            PolygonBounds.prototype.accept = function (visitor) {
                visitor.visitPolygon(this);
            };
            return PolygonBounds;
        }());
        physics.PolygonBounds = PolygonBounds;
    })(physics = gs.physics || (gs.physics = {}));
})(gs || (gs = {}));
