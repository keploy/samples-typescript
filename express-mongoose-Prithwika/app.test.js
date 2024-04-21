const {
  createToken,
  checkUser,
  showNotes,
  signIn,
  logIn,
  logout,
} = require("./authentication");
const jwt = require("jsonwebtoken");
const User = require("./models/users");

describe("createToken", () => {
  it("should create a token with correct payload and expiry time", () => {
    const userId = "someUserId";
    const token = createToken(userId);
    const decoded = jwt.verify(token, "MONKE");
    expect(decoded.id).toBe(userId);
    // You might want to test expiry time as well
  });
});

// Write similar test cases for other functions
describe("checkUser", () => {
  it("should set res.locals.user to null when there's no token", () => {
    const req = { cookies: {} }; // Mock request object with no token
    const res = {
      locals: {},
      redirect: (url) => {
        console.log(url);
      },
    }; // Mock response object

    const next = jest.fn(); // Mock next function

    checkUser(req, res, next);

    expect(res.locals.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should set res.locals.user to the user object when the token is valid", async () => {
    // Mock user and token data
    const userId = "someUserId";
    const user = { _id: userId, username: "testuser" };
    const token = jwt.sign({ id: userId }, "MONKE", { expiresIn: 3600 }); // 1 hour expiry

    // Mock request object with token
    const req = { cookies: { jwt: token } };
    const res = { locals: {} }; // Mock response object

    const next = jest.fn(); // Mock next function

    // Mock User.findById function
    User.findById = jest.fn().mockResolvedValue(user);

    // Call the middleware function
    await checkUser(req, res, next);

    // Check if res.locals.user is set to the user object
    expect(res.locals.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
