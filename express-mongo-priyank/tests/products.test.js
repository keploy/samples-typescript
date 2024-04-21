const request = require("supertest");
const { app, connectDB } = require("../index");
const Product = require("../models/product.models");

beforeAll(connectDB);

afterEach(() => Product.deleteMany({}));

describe("Product API", () => {
  // get a prpoduct
  it("should get a product by ID", async () => {
    const newProduct = await Product.create({
      name: "Test Product",
      price: 10.99,
    });

    const res = await request(app)
      .get(`/api/products/${newProduct._id}`)
      .expect(200);

    expect(res.body._id).toBe(newProduct._id.toString());
    expect(res.body.name).toBe(newProduct.name);
    expect(res.body.price).toBe(newProduct.price);
  });

  // get all products
  it("should get all products", async () => {
    const testProducts = [
      { name: "Product 1", price: 20.99 },
      { name: "Product 2", price: 30.99 },
    ];

    await Product.create(testProducts);

    const res = await request(app).get("/api/products").expect(200);

    expect(res.body.length).toBe(testProducts.length);
    for (let i = 0; i < testProducts.length; i++) {
      expect(res.body[i].name).toBe(testProducts[i].name);
      expect(res.body[i].price).toBe(testProducts[i].price);
    }
  });
});
