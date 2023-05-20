module gs.physics {
    export class FixedPoint {
        rawValue: number;
        precision: number;

        constructor(value: number = 0, precision: number = 1000) {
            this.rawValue = Math.round(value * precision);
            this.precision = precision;
        }

        add(other: FixedPoint | number) {
            if (other instanceof FixedPoint) {
                this.rawValue += other.rawValue;
            } else {
                this.rawValue += Math.round(other * this.precision);
            }
            return this;
        }

        sub(other: FixedPoint | number) {
            if (other instanceof FixedPoint) {
                this.rawValue -= other.rawValue;
            } else {
                this.rawValue -= Math.round(other * this.precision);
            }
            return this;
        }

        mul(other: FixedPoint | number) {
            if (other instanceof FixedPoint) {
                this.rawValue = Math.round((this.rawValue * other.rawValue) / this.precision);
            } else {
                this.rawValue = Math.round(this.rawValue * other);
            }
            return this;
        }

        div(other: FixedPoint | number) {
            if (other instanceof FixedPoint) {
                this.rawValue = Math.round((this.rawValue / other.rawValue) * this.precision);
            } else {
                this.rawValue = Math.round((this.rawValue / other) * this.precision);
            }
            return this;
        }

        lt(other: FixedPoint | number): boolean {
            if (other instanceof FixedPoint) {
                return this.rawValue < other.rawValue;
            } else {
                return this.rawValue < Math.round(other * this.precision);
            }
        }

        gt(other: FixedPoint | number): boolean {
            if (other instanceof FixedPoint) {
                return this.rawValue > other.rawValue;
            } else {
                return this.rawValue > Math.round(other * this.precision);
            }
        }

        neg(): FixedPoint {
            const result = new FixedPoint();
            result.rawValue = -this.rawValue;
            return result;
        }
        
        toFloat() {
            return this.rawValue / this.precision;
        }

        static add(a: FixedPoint, b: FixedPoint | number): FixedPoint {
            const result = new FixedPoint();
            if (b instanceof FixedPoint) {
                result.rawValue = a.rawValue + b.rawValue;
            } else {
                result.rawValue = a.rawValue + Math.round(b * a.precision);
            }
            return result;
        }

        static subtract(a: FixedPoint, b: FixedPoint | number): FixedPoint {
            const result = new FixedPoint();
            if (b instanceof FixedPoint) {
                result.rawValue = a.rawValue - b.rawValue;
            } else {
                result.rawValue = a.rawValue - Math.round(b * a.precision);
            }
            return result;
        }

        static multiply(a: FixedPoint, b: FixedPoint | number): FixedPoint {
            const result = new FixedPoint();
            if (b instanceof FixedPoint) {
                result.rawValue = Math.round((a.rawValue * b.rawValue) / a.precision);
            } else {
                result.rawValue = Math.round(a.rawValue * b);
            }
            return result;
        }

        static divide(a: FixedPoint, b: FixedPoint | number): FixedPoint {
            const result = new FixedPoint();
            if (b instanceof FixedPoint) {
                result.rawValue = Math.round((a.rawValue / b.rawValue) * a.precision);
            } else {
                result.rawValue = Math.round((a.rawValue / b) * a.precision);
            }
            return result;
        }

        static max(a: FixedPoint, b: FixedPoint): FixedPoint {
            return a.gt(b) ? a : b;
        }

        static min(a: FixedPoint, b: FixedPoint): FixedPoint {
            return a.lt(b) ? a : b;
        }
    }
}