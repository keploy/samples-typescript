type Task = {
    id?: number;
    author: string;
    title: string;
    description: string;
    dueDate: string;
    status: "Pending" | "In-Progress" | "Completed";
    priority?: 1 | 2 | 3 | 4 | 5,
    createdAt?: Date,
    updatedAt?: Date
}

export default Task