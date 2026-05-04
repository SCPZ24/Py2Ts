// branch

// if-else
let score: number = 80;

if(score > 90){
    console.log("优秀");
}else if(score > 80){
    console.log("良好");
}else if(score > 70){
    console.log("中等");
}else if(score > 60){
    console.log("及格");
}else{
    console.log("不及格");
}

// 三目运算
let outcome: string = score > 60 ? "及格" : "不及格";
console.log(outcome);

// switch
let grade: string = "A";
switch(grade){
    case "A":
        console.log("优秀");
        break;
    case "B":
        console.log("良好");
        break;
    default:
        throw new Error("Invalid grade");
}


// 循环
for(let i = 0; i < 5; ++i){
    console.log(i);
}

let j = 0;
while(j < 3){
    console.log(j);
    ++j;
}

let i = 0;
do{
    console.log(i);
    ++i;
}while(i < 3);

// for-of 遍历数组
let arr:number[] = [1, 2, 3, 4, 5];

for(const item of arr){
    console.log(item);
}

// for-in 遍历对象
let obj: {name: string, age: number} = {name: "SCPZ24", age: 20};

for(const key in obj){
    console.log(key, obj[key]);
}


// 跳转
// continue; break;
// try-catch-finally


// 直接用逻辑运算符来控制

// &&
let isLogin = true;
isLogin && console.log("登录成功");

// || 会把数值0/空字符串当作“false”
let adminName: string = "SCPZ24";
let displayName: string = adminName || "匿名用户";
console.log(displayName);

// ?? 不会把数值0/空字符串当作“false”
let adminName2: string = "SCPZ24";
let displayName2: string = adminName ?? "匿名用户";
console.log(displayName2);