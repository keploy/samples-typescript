import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Todo } from './models/todo.model';
import { TodoService } from './todo.service';
import { TodoInput } from './dto/todo.input';

@Resolver(() => Todo)
export class TodoResolver {
  constructor(private readonly todoService: TodoService) {}

  @Query(() => [Todo])
  async todos(): Promise<Todo[]> {
    return this.todoService.findAll();
  }

  @Query(() => Todo)
  async todo(@Args('id') id: string): Promise<Todo> {
    return this.todoService.findOne(id);
  }

  @Mutation(() => Todo)
  async createTodo(@Args('input') input: TodoInput): Promise<Todo> {
    return this.todoService.create(input);
  }

  @Mutation(() => Todo)
  async updateTodo(
    @Args('id') id: string,
    @Args('input') input: TodoInput,
  ): Promise<Todo> {
    return this.todoService.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteTodo(@Args('id') id: string): Promise<boolean> {
    return this.todoService.delete(id);
  }

  @Mutation(() => Todo)
  async toggleTodoComplete(@Args('id') id: string): Promise<Todo> {
    return this.todoService.toggleComplete(id);
  }
}