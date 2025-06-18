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

// Input validation functions
const validateUserInput = (displayName: string, email: string, password: string, locale: string): boolean => {
  return typeof displayName === 'string' && 
         displayName.trim().length > 0 && 
         displayName.trim().length <= 255 &&
         typeof email === 'string' && 
         email.includes('@') &&
         typeof password === 'string' && 
         password.length >= 6 &&
         typeof locale === 'string' && 
         locale.length === 2;
};

const validateId = (id: string): boolean => {
  const numId = parseInt(id);
  return !isNaN(numId) && numId > 0;
};

export const createUser = async (req: Request, res: Response) => {
  const { displayName, email, password, locale }: User = req.body;

  // Input validation
  if (!validateUserInput(displayName, email, password, locale)) {
    return res.status(400).json({ 
      error: "Invalid input. All fields are required. Email must be valid, password must be at least 6 characters, and locale must be 2 characters." 
    });
  }

  const user = {
    email: email.trim().toLowerCase(),
    passwordHash: password,
    locale: locale.trim().toLowerCase(),
    displayName: displayName.trim(),
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

  // Input validation
  if (!validateId(id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  const mutation = `
    mutation DeleteUser($id: Int!) {
      deleteUser(id: $id) {
        id
      }
    }
  `;

  const variables = {
    id: parseInt(id)
  };

  try {
    const response: AxiosResponse<
      GraphQLResponse<{ deleteUser: { id: string } }>
    > = await axios.post(url, { query: mutation, variables }, { headers });

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
