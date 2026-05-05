import { User, DeviceType } from "./domain";


export type UserState = 
    | { type: "idle" }
    | { type: "loading" }
    | { type: "success", user: User }
    | { type: "error", error: string };
// 这里等价于声明了若干个interface
// 由于interface的名称其实不重要（后续会switch state的type字段来收窄类型）
// 所以这里用匿名申明方法。



export class UserService{
    state: UserState = { type: "idle" };

    async fetchUser(name: string): Promise<void> {
        this.state = { type: "loading" };
        try {
            const response = await fetch(`/api/users/${name}`);
            const user = await response.json();
            this.state = { type: "success", user };
        } catch (error) {
            this.state = { type: "error", error: error.message };
        }
    }
}