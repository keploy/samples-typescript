import { Injectable, NotFoundException } from '@nestjs/common';
import { Todo } from './models/todo.model';
import { TodoInput } from './dto/todo.input';

@Injectable()
export class TodoService {
  private todos: Todo[] = [];

  async create(todoInput: TodoInput): Promise<Todo> {
    const todo: Todo = {
      id: Date.now().toString(),
      title: todoInput.title,
      description: todoInput.description,
      completed: todoInput.completed || false,
      createdAt: new Date(),
    };
    this.todos.push(todo);
    return todo;
  }

  async findAll(): Promise<Todo[]> {
    return this.todos;
  }

  async findOne(id: string): Promise<Todo> {
    const todo = this.todos.find(todo => todo.id === id);
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }
    return todo;
  }

  async update(id: string, todoInput: TodoInput): Promise<Todo> {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    this.todos[todoIndex] = {
      ...this.todos[todoIndex],
      ...todoInput,
    };
    return this.todos[todoIndex];
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.todos.length;
    this.todos = this.todos.filter(todo => todo.id !== id);
    return initialLength !== this.todos.length;
  }

  async toggleComplete(id: string): Promise<Todo> {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    this.todos[todoIndex].completed = !this.todos[todoIndex].completed;
    return this.todos[todoIndex];
  }
}