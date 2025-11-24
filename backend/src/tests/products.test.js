// backend/src/tests/products.test.js
const request = require("supertest");
const expressApp = require("../server");
const db = require("../db");

let createdProductId;

describe("Products API", () => {
  beforeAll((done) => {
    db.serialize(() => {
      db.run("DELETE FROM products", () => done());
    });
  });

  afterAll((done) => {
    db.close(done);
  });

  test("GET /api/products should return list", async () => {
    const res = await request(expressApp)
      .get("/api/products")
      .expect(200);

    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/products should create a new product", async () => {
    const res = await request(expressApp)
      .post("/api/products")
      .field("name", "Test Product")
      .field("unit", "pcs")
      .field("category", "Test Category")
      .field("brand", "Test Brand")
      .field("stock", 10)
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Test Product");

    createdProductId = res.body.id;
    expect(createdProductId).toBeDefined();
  });

  test("PUT /api/products/:id should update the product", async () => {
    const res = await request(expressApp)
      .put(`/api/products/${createdProductId}`)
      .field("name", "Updated Product")
      .field("unit", "box")
      .field("category", "Updated Category")
      .field("brand", "Updated Brand")
      .field("stock", 20)
      .expect(200);

    expect(res.body).toHaveProperty("id", createdProductId);
    expect(res.body.name).toBe("Updated Product");
    expect(res.body.stock).toBe(20);
  });

  test("GET /api/products/summary should return summary data", async () => {
    const res = await request(expressApp)
      .get("/api/products/summary")
      .expect(200);

    expect(res.body).toHaveProperty("totalProducts");
    expect(res.body).toHaveProperty("outOfStockCount");
    expect(res.body).toHaveProperty("lowStockCount");
    expect(res.body).toHaveProperty("categoryCount");
  });

  test("DELETE /api/products/:id should delete product", async () => {
    const res = await request(expressApp)
      .delete(`/api/products/${createdProductId}`)
      .expect(200);

    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/deleted/i);
  });
});




