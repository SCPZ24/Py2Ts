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
type ToolType = "MacBook" | "iPhone" | "iPad";