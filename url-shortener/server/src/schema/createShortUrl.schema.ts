import { object, string } from "yup";

export default object({
  body: object({
    url: string()
      .url("Must be a valid URL")
      .required("url is required"),
  }),
});

