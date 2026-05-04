// 和Java的interface有区别

// 更像一个结构体
interface User{
    id: string;
    name: string;
    age: number
}
// 其实更多地是用type
type Tool = {
    toolName: string;
    isOld: boolean,
    version: number,
}

// 实例化
const SCPZ24: User = {
    id: "24",
    name: "Z24",
    age: 20
}

const MacBook: Tool = {
    toolName: "MacBookPro",
    isOld: false,
    version: 24,
}

// interface甚至还能继承
interface VIP extends User{
    vipLevel: number;
    permissions: string[];
}

const SorrowPig: VIP = {
    id: "24",
    name: "Z24",
    age: 20,
    vipLevel: 1,
    permissions: ["read", "write", "execute"],
}

// 支持多继承

// 子类型可以收窄父类型
interface Parent{
    status: string;
}

interface Child extends Parent{
    status: "child" | "adult";
}

// interface还能定义输出/返回类型一样，但是实现不一样的函数。
interface binFunc{
    (a: number, b: number): number;
}

const _add: binFunc = (a, b) => a + b;
const _sub: binFunc = (a, b) => a - b;
const _mul: binFunc = (a, b) => a * b;
const _div: binFunc = (a, b) => a / b;

// interface里还可以定义函数，必须由子类实现
interface IUser{
    id: number;
    greet(str: string): void;
}

class UserImpl implements IUser{
    id: number;
    greet(str: string): void {
        console.log(`Hello, ${str}!`);
    }
}

const user = new UserImpl();
user.greet("SCPZ24");