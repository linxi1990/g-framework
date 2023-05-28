///<reference path="AbstractBounds.ts"/>
module gs.physics {
    export class PolygonBounds extends AbstractBounds {
        private _vertices: Vector2[];

        get vertices() {
            return this._vertices;
        }

        constructor(position: Vector2, vertices: Vector2[], entity: Entity) {
            super(position, PolygonBounds.getWidth(vertices), PolygonBounds.getHeight(vertices), entity);
            this._vertices = vertices;
        }

        /**
         * 计算多边形的宽度
         * @returns 
         */
        public getWidth(): FixedPoint {
            let minX = Infinity;
            let maxX = -Infinity;

            for (let vertex of this._vertices) {
                let x = vertex.x.toFloat();
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
            }

            return new FixedPoint(maxX - minX);
        }

        /**
         * 计算多边形的高度
         * @returns 
         */
        public getHeight(): FixedPoint {
            let minY = Infinity;
            let maxY = -Infinity;

            for (let vertex of this._vertices) {
                let y = vertex.y.toFloat();
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }

            return new FixedPoint(maxY - minY);
        }

         /**
         * 计算多边形的宽度
         * @returns 
         */
         public static getWidth(vertices: Vector2[]): FixedPoint {
            let minX = Infinity;
            let maxX = -Infinity;

            for (let vertex of vertices) {
                let x = vertex.x.toFloat();
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
            }

            return new FixedPoint(maxX - minX);
        }

        /**
         * 计算多边形的高度
         * @returns 
         */
        public static getHeight(vertices: Vector2[]): FixedPoint {
            let minY = Infinity;
            let maxY = -Infinity;

            for (let vertex of vertices) {
                let y = vertex.y.toFloat();
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }

            return new FixedPoint(maxY - minY);
        }

        /**
         * 提供一个方向，返回多边形在该方向上的最远点
         * @param direction 
         * @returns 
         */
        public getFarthestPointInDirection(direction: Vector2): Vector2 {
            let maxDotProduct = -Infinity;
            let farthestVertex = null;

            for (let vertex of this._vertices) {
                let dotProduct = vertex.dot(direction).toFloat();

                if (dotProduct > maxDotProduct) {
                    maxDotProduct = dotProduct;
                    farthestVertex = vertex;
                }
            }

            return farthestVertex;
        }

        /**
         * 计算多边形在指定方向上的投影
         * @param direction 
         * @returns 
         */
        public project(direction: Vector2): Projection {
            let min = Infinity;
            let max = -Infinity;

            for (let vertex of this._vertices) {
                let dot = vertex.dot(direction).toFloat();
                min = Math.min(min, dot);
                max = Math.max(max, dot);
            }

            return new Projection(min, max);
        }

        containsPoint(point: Vector2): boolean {
            let inside = false;
            let x = point.x.toFloat(), y = point.y.toFloat();

            for (let i = 0, j = this._vertices.length - 1; i < this._vertices.length; j = i++) {
                let xi = this._vertices[i].x.toFloat(), yi = this._vertices[i].y.toFloat();
                let xj = this._vertices[j].x.toFloat(), yj = this._vertices[j].y.toFloat();

                let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) {
                    inside = !inside;
                }
            }

            return inside;
        }

        intersects(other: Bounds): boolean {
            const visitor = new IntersectionVisitor(other);
            this.accept(visitor);
            return visitor.getResult();
        }

        contains(other: Bounds): boolean {
            const visitor = new ContainVisitor(other);
            this.accept(visitor);
            return visitor.getResult();
        }

        accept(visitor: BoundsVisitor): void {
            visitor.visitPolygon(this);
        }
    }
}