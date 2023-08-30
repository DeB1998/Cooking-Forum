export class ObjectCopy {

    public static copyObject<T extends object>(object: T): T {
        if (Array.isArray(object)) {
            return Array.from(object) as T;
        }
        return Object.assign({}, object);
    }
}
