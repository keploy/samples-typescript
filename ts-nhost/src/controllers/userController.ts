import { Request, Response } from "express";
import dotenv from "dotenv";
import axios, { AxiosResponse } from "axios";

dotenv.config();

const url = process.env.GRAPHQL_ENDPOINT;
if (!url) {
  throw new Error("GRAPHQL_ENDPOINT is not defined in .env");
}

const headers = {
  "content-type": "application/json",
  "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET || "",
};

interface User {
  displayName: string;
  email: string;
  password: string;
  locale: string;
}

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

export const createUser = async (req: Request, res: Response) => {
  const { displayName, email, password, locale }: User = req.body;

  const user = {
    email,
    passwordHash: password,
    locale,
    displayName,
  };

  const query = `
    mutation insertUser($object: users_insert_input!) {
      insertUser(object: $object) {
        id
        displayName
        email
      }
    }
  `;

  const variables = {
    object: user,
  };

  try {
    const response: AxiosResponse<GraphQLResponse<{ insertUser: User }>> =
      await axios.post(url, { query, variables }, { headers });

    if (response.data.errors) {
      return res.status(400).json({ errors: response.data.errors });
    }

    res.status(200).json({
      message: "Successfully created a user",
      user: response.data.data.insertUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while inserting the user.",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const query = `
    query {
      users {
        id
        email
        createdAt
      }
    }
  `;
  try {
    const response: AxiosResponse<GraphQLResponse<{ users: User[] }>> =
      await axios.post(url, { query }, { headers });
    if (response.data.errors) {
      return res.status(400).json({ errors: response.data.errors });
    }
    res.status(200).json(response.data.data.users);
  } catch (error) {
    console.error("Error performing GraphQL query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const mutation = `
    mutation {
      deleteUser(id: "${id}") {
        id
      }
    }
  `;
  try {
    const response: AxiosResponse<
      GraphQLResponse<{ deleteUser: { id: string } }>
    > = await axios.post(url, { query: mutation }, { headers });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    res.status(200).json({
      message: "Successfully deleted a user",
      id: response.data.data.deleteUser.id,
    });
  } catch (error) {
    console.error("Error performing GraphQL mutation:", error);
    res.status(400).json({
      error: "An error occurred while deleting the user.",
    });
  }
};
