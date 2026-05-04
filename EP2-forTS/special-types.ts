// any
// Make a variable goes like python-styte
// No need to specify the type, but run-time check & bind.
let x: any = 1;
x = "hello";




// unknown
// 安全版的any
// 鼓励先判断类型再使用
let u: unknown = 1;

if(typeof u === "number"){
    console.log(u + 1);
}else{
    console.log("u is not a number");
}




// never
// 表示永远不会返回的类型

// 用于返回值，表示到这里报错了
function error(): never {
    throw new Error("崩溃了");
}
