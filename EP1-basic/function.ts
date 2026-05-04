// 申明+实现
function add(a: number, b: number): number {
    return a + b;
}

function gcd(a: number, b: number): number {
    if (b === 0) {
        return a;
    }
    return gcd(b, a % b);
}

// 箭头函数
const sub = (a: number, b: number): number => {
    return a - b;
}

const mul = (a: number, b: number): number => a * b;

// 可选参数
function multiply(a: number, b: number, c?: number): number {
    if (c) {
        return a * b * c;
    }
    return a * b;
}

// 无返回值
function printMessage(message: string): void {
    console.log(message);
}