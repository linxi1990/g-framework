module gs {
    /**
     * 组件
     */
    export abstract class Component {
        private _entityId: number | null = null;
        private _version: number = 0;

        setEntityId(entityId: number) {
            this._entityId = entityId;
        }

        getEntityId() {
            return this._entityId;
        }

        get entityId(): number {
            if (this._entityId === null) {
                throw new Error("Entity ID 还未被设置");
            }
            return this._entityId;
        }

        get version(): number {
            return this._version;
        }

        /**
         * 标记组件已更新的方法
         * 通过增加 _version 的值来表示组件已更新
         */
        markUpdated(): void {
            this._version++;
        }

        /**
         * 当组件初始化的时候调用
         * @param args 
         */
        onInitialize(...args: any[]) { }

        /**
         * 当组件被添加到实体上时执行
         */
        onAdded(): void { }

        /**
         * 当组件从实体上被移除时执行
         */
        onRemoved(): void { }

        serialize(): any {
            const data: any = {};
            for (const key of Object.keys(this)) {
                const value = (this as any)[key];
                if (typeof value !== 'function') {
                    data[key] = value;
                }
            }

            return data;
        }

        deserialize(data: any): void {
            for (const key in data) {
                if ((this as any)[key] !== undefined) {
                    (this as any)[key] = data[key];
                }
            }
        }

        /**
         * 判断是否需要序列化的方法
         * @returns 默认返回 true，表示需要序列化
         */
        shouldSerialize(): boolean {
            return true;
        }


        /**
         * 清除数据方法，用于组件池在重用时
         */
        public reset(): void {
            this._entityId = null;
        }
    }
}
