import { Request, Response } from "express";
import dotenv from "dotenv";
import axios, { AxiosResponse } from "axios";

dotenv.config();

const url = process.env.GRAPHQL_ENDPOINT;
if (!url) {
  throw new Error("GRAPHQL_ENDPOINT is not defined in .env");
}
const queryURL = url.replace("/graphql", "/query");

const headers = {
  "content-type": "application/json",
  "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET || "",
};

interface CreateTableResponse {
  result: string[][];
}

interface TrackTableResponse {
  message: string;
}

interface TodosResponse {
  data: {
    todos: { id: number; name: string; is_completed: boolean }[];
  };
  errors?: { message: string }[];
}

interface InsertTodoResponse {
  data: {
    insert_todos_one: { id: number };
  };
  errors?: { message: string }[];
}

interface UpdateTodoResponse {
  data: {
    update_todos_by_pk: { id: number };
  };
  errors?: { message: string }[];
}

interface DeleteTodoResponse {
  data: {
    delete_todos_by_pk: { id: number };
  };
  errors?: { message: string }[];
}

export const createTable = async (req: Request, res: Response) => {
  const createTableQuery = {
    type: "run_sql",
    args: {
      source: "default",
      sql: `
        CREATE TABLE public.todos (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          is_completed BOOL NOT NULL
        );
      `,
    },
  };

  const trackTableQuery = {
    type: "track_table",
    args: {
      schema: "public",
      name: "todos",
    },
  };

  try {
    const responseTable: AxiosResponse<CreateTableResponse> = await axios.post(
      queryURL,
      createTableQuery,
      {
        headers,
      }
    );
    console.log("Table created successfully:", responseTable.data);
    const responseTrack: AxiosResponse<TrackTableResponse> = await axios.post(
      queryURL,
      trackTableQuery,
      {
        headers,
      }
    );
    console.log("Table tracked successfully:", responseTrack.data);
    res.status(200).json({
      message: "Table created and tracked successfully",
      data: responseTable.data,
    });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTodos = async (req: Request, res: Response) => {
  const query = `
    query {
      todos {
        id
        name
        is_completed
      }
    }
  `;
  try {
    const response: AxiosResponse<TodosResponse> = await axios.post(
      url,
      { query },
      { headers }
    );
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    res.status(200).json(response.data.data.todos);
  } catch (error) {
    console.error("Error performing GraphQL query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const insertTodo = async (req: Request, res: Response) => {
  const { name, isCompleted } = req.body;

  const mutation = `
    mutation {
      insert_todos_one(object: { name: "${name}", is_completed: ${isCompleted} }) {
        id
      }
    }
  `;
  try {
    const response: AxiosResponse<InsertTodoResponse> = await axios.post(
      url,
      { query: mutation },
      { headers }
    );
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    res.status(201).json({
      message: "Successfully inserted",
      id: response.data.data.insert_todos_one.id,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateTodo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, isCompleted } = req.body;
  const mutation = `
    mutation {
      update_todos_by_pk(pk_columns: {id: ${id}}, _set: { name: "${name}", is_completed: ${isCompleted} }) {
        id
      }
    }
  `;
  try {
    const response: AxiosResponse<UpdateTodoResponse> = await axios.post(
      url,
      { query: mutation },
      { headers }
    );
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    res.json({
      message: "Successfully updated",
      id: response.data.data.update_todos_by_pk.id,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteTodo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const mutation = `
    mutation {
      delete_todos_by_pk(id: ${id}) {
        id
      }
    }
  `;
  try {
    const response: AxiosResponse<DeleteTodoResponse> = await axios.post(
      url,
      { query: mutation },
      { headers }
    );
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    res.json({
      message: "Successfully deleted",
      id: response.data.data.delete_todos_by_pk.id,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
