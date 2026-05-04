// 类非常相似于其他OOP语言

class Person{
    public userName: string;
    private age: number;

    constructor(userName: string, age: number) {
        this.userName = userName;
        this.age = age;
    }

    greet(): void {
        console.log(`Hello, ${this.userName}!`);
    }

    getAge(): number {
        return this.age;
    }
}

const person = new Person("SCPZ24", 20);
person.greet();
console.log(person.getAge());


// 也可以继承

class Student extends Person{
    private studentID: number;
    constructor(userName: string, age: number, studentID: number) {
        super(userName, age);
        this.studentID = studentID;
    }

    getStudentID(): number {
        return this.studentID;
    }
}