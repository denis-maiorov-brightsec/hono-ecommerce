import { Hono } from "hono";

import {
  getValidatedData,
  validateRequest
} from "../../../common/validation/request-validator";
import {
  categoryIdParamsSchema,
  createCategorySchema,
  type CategoryIdParams,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
  updateCategorySchema
} from "../dto/categories.dto";
import { CategoriesRepository } from "../repository/categories.repository";
import { CategoriesService } from "../service/categories.service";

export function createCategoriesRouter(): Hono {
  const categoriesRouter = new Hono();
  const categoriesService = new CategoriesService(new CategoriesRepository());

  categoriesRouter.get("/", async (c) => {
    const categories = await categoriesService.listCategories();
    return c.json(categories, 200);
  });

  categoriesRouter.get(
    "/:id",
    validateRequest("param", categoryIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<CategoryIdParams>(c, "param");
      const category = await categoriesService.getCategoryById(id);

      return c.json(category, 200);
    }
  );

  categoriesRouter.post("/", validateRequest("json", createCategorySchema), async (c) => {
    const payload = getValidatedData<CreateCategoryPayload>(c, "json");
    const category = await categoriesService.createCategory(payload);

    return c.json(category, 201);
  });

  categoriesRouter.patch(
    "/:id",
    validateRequest("param", categoryIdParamsSchema),
    validateRequest("json", updateCategorySchema),
    async (c) => {
      const { id } = getValidatedData<CategoryIdParams>(c, "param");
      const payload = getValidatedData<UpdateCategoryPayload>(c, "json");
      const category = await categoriesService.updateCategory(id, payload);

      return c.json(category, 200);
    }
  );

  categoriesRouter.delete(
    "/:id",
    validateRequest("param", categoryIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<CategoryIdParams>(c, "param");
      await categoriesService.deleteCategory(id);

      return c.body(null, 204);
    }
  );

  return categoriesRouter;
}
