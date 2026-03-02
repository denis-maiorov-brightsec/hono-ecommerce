import { Hono } from "hono";

import {
  getValidatedData,
  validateRequest
} from "../../../common/validation/request-validator";
import {
  searchProductsQuerySchema,
  type SearchProductsQuery
} from "../dto/search-products.dto";
import { ProductsRepository } from "../repository/products.repository";
import { ProductsService } from "../service/products.service";

export function createProductSearchRouter(): Hono {
  const searchProductsRouter = new Hono();
  const productsService = new ProductsService(new ProductsRepository());

  searchProductsRouter.get(
    "/",
    validateRequest("query", searchProductsQuerySchema),
    async (c) => {
      const { q } = getValidatedData<SearchProductsQuery>(c, "query");
      const products = await productsService.searchProducts(q);

      return c.json(products, 200);
    }
  );

  return searchProductsRouter;
}
