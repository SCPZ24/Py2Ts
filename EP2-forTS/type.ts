// 可以当结构体来用
type UserType = {
    id: number;
    name: string;
    age: number;
}

const xuan: UserType = {
    id: 24,
    name: "Z24",
    age: 20,
}

// 也可以用作联合类型，非常像枚举类型
type DeviceType = "MacBook" | "iPhone" | "iPad";


// 基于interface的联合类型
interface IdleState{
    type: "idle";
}
interface LoadingState{
    type: "loading";
}
interface SuccessState{
    type: "success";
    data: DeviceType;
}
interface ErrorState{
    type: "error";
    error: string;
}

type DeviceState = IdleState | LoadingState | SuccessState | ErrorState;


// 用这个来实现类型收窄
function handleDeviceState(state: DeviceState){
    switch(state.type){
        case "idle":
            console.log("Idle");
            break;
        case "loading":
            console.log("Loading");
            break;
        case "success":
            console.log("Success");
            console.log(state.data);
            break;
        case "error":
            console.log("Error", state.error);
            break;
        default:
            const _exhaustiveCheck: never = state; // 这里用never类型会直接报错给你，让你知道有新类型没处理
            return _exhaustiveCheck;
    }
}
// 最后的default：
//  如果后续我们给DeviceState添加了新的类型
//  当state是这个新类型，就会走default
//  default里用never类型会直接报错给你，让你知道有新类型没处理