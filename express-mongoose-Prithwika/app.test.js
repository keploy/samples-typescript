const {
  createToken,
  signIn,
  logIn,
  logout,
  checkUser,
} = require("./authentication");
const jwt = require("jsonwebtoken");
const User = require("./models/users");

jest.mock("./models/users");

describe("createToken", () => {
  it("should create a token with correct payload and expiry time", () => {
    const userId = "someUserId";
    const token = createToken(userId);
    const decoded = jwt.verify(token, "MONKE");
    expect(decoded.id).toBe(userId);
  });
});

describe("signIn", () => {
  it("should redirect to '/' after successful sign-in", async () => {
    const req = { body: { username: "testUser", password: "testPassword" } };
    const res = { cookie: jest.fn(), redirect: jest.fn() };

    User.create.mockResolvedValueOnce({ _id: "someUserId" });

    await signIn(req, res);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/");
  });

  it("should redirect to '/signup' on error", async () => {
    const req = { body: { username: "testUser", password: "testPassword" } };
    const res = { redirect: jest.fn() };

    User.create.mockRejectedValueOnce(new Error("Test error"));

    await signIn(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/signup");
  });
});

describe("logIn", () => {
  it("should redirect to '/' after successful login", async () => {
    const req = { body: { username: "testUser", password: "testPassword" } };
    const res = { cookie: jest.fn(), redirect: jest.fn() };

    User.login.mockResolvedValueOnce({ _id: "someUserId" });

    await logIn(req, res);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/");
  });

  it("should respond with status 500 on error", async () => {
    const req = { body: { username: "testUser", password: "testPassword" } };
    const res = { sendStatus: jest.fn() };

    User.login.mockRejectedValueOnce(new Error("Test error"));

    await logIn(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(500);
  });
});

describe("logout", () => {
  it("should clear the JWT cookie and redirect to '/login'", () => {
    const req = {};
    const res = { clearCookie: jest.fn(), redirect: jest.fn() };

    logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith("jwt");
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});

describe("checkUser", () => {
  it("should set res.locals.user to null when there's no token", () => {
    const req = { cookies: {} };
    const res = { locals: {}, redirect: jest.fn() };
    const next = jest.fn();

    checkUser(req, res, next);

    expect(res.locals.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should set res.locals.user to the user object when the token is valid", async () => {
    const userId = "someUserId";
    const user = { _id: userId, username: "testuser" };
    const token = jwt.sign({ id: userId }, "MONKE", { expiresIn: 3600 });

    const req = { cookies: { jwt: token } };
    const res = { locals: {} };
    const next = jest.fn();

    User.findById.mockResolvedValueOnce(user);

    await checkUser(req, res, next);

    expect(res.locals.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
