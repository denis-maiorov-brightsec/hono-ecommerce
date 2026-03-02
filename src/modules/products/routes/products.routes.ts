import { Hono } from "hono";

import {
  getValidatedData,
  validateRequest
} from "../../../common/validation/request-validator";
import {
  createProductSchema,
  productIdParamsSchema,
  type CreateProductPayload,
  type ProductIdParams,
  type UpdateProductPayload,
  updateProductSchema
} from "../dto/products.dto";
import { ProductsRepository } from "../repository/products.repository";
import { ProductsService } from "../service/products.service";

export function createProductsRouter(): Hono {
  const productsRouter = new Hono();
  const productsService = new ProductsService(new ProductsRepository());

  productsRouter.get("/", async (c) => {
    const products = await productsService.listProducts();
    return c.json(products, 200);
  });

  productsRouter.get(
    "/:id",
    validateRequest("param", productIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<ProductIdParams>(c, "param");
      const product = await productsService.getProductById(id);

      return c.json(product, 200);
    }
  );

  productsRouter.post("/", validateRequest("json", createProductSchema), async (c) => {
    const payload = getValidatedData<CreateProductPayload>(c, "json");
    const product = await productsService.createProduct(payload);

    return c.json(product, 201);
  });

  productsRouter.patch(
    "/:id",
    validateRequest("param", productIdParamsSchema),
    validateRequest("json", updateProductSchema),
    async (c) => {
      const { id } = getValidatedData<ProductIdParams>(c, "param");
      const payload = getValidatedData<UpdateProductPayload>(c, "json");
      const product = await productsService.updateProduct(id, payload);

      return c.json(product, 200);
    }
  );

  productsRouter.delete(
    "/:id",
    validateRequest("param", productIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<ProductIdParams>(c, "param");
      await productsService.deleteProduct(id);

      return c.body(null, 204);
    }
  );

  return productsRouter;
}
