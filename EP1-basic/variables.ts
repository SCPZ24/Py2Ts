// Basic Variables
let userName: string = "SCPZ24";
let age: number = 20;
let isStudent: boolean = true;

// Array
let studentIDs: number[] = [1, 2, 3, 4] //写法一

let teacherIDs: Array<number> = [1, 2, 3, 4] //写法二

// 数组的增删与拷贝
studentIDs.push(5);                // push: 在数组末尾添加一个元素
studentIDs.pop();                  // pop: 移除并返回数组最后一个元素
studentIDs.concat([5, 6, 7]);      // concat: 返回一个合并新数组后的新数组（不修改原数组）
studentIDs.slice(0, 2);            // slice: 提取索引0-2之间的元素组成新数组（不修改原数组）
studentIDs.splice(0, 2, 8, 9);     // splice: 从索引0开始，删除2个元素，并插入8和9（会修改原数组）
studentIDs.reverse();              // reverse: 反转数组顺序（会修改原数组）
studentIDs.sort();                 // sort: 按字符串顺序排序（会修改原数组）
studentIDs.sort((a, b) => a - b);  // sort: 按数字从小到大排序（会修改原数组）
// 解释：a - b 若为正，则b在a前（升序）；a - b 为负，则a在b前，所以整体升序排列
studentIDs.sort((a, b) => b - a);  // sort: 按数字从大到小排序（会修改原数组）

let studentIDs2: number[] = [...studentIDs]; //用...来拷贝数组（深拷贝）

// Tuple
let studentInfo: [number, string] = [1, "SCPZ24"];