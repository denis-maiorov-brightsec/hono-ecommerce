import { Hono } from "hono";

import {
  PROMOTIONS_MANAGE_ROLE,
  requireAuthenticated,
  requireRoles
} from "../../../common/middleware/auth-stub";
import {
  getValidatedData,
  validateRequest
} from "../../../common/validation/request-validator";
import {
  createPromotionSchema,
  promotionIdParamsSchema,
  type CreatePromotionPayload,
  type PromotionIdParams,
  type UpdatePromotionPayload,
  updatePromotionSchema
} from "../dto/promotions.dto";
import { PromotionsRepository } from "../repository/promotions.repository";
import { PromotionsService } from "../service/promotions.service";

export function createPromotionsRouter(): Hono {
  const promotionsRouter = new Hono();
  const promotionsService = new PromotionsService(new PromotionsRepository());

  promotionsRouter.use(
    "*",
    requireAuthenticated(),
    requireRoles([PROMOTIONS_MANAGE_ROLE])
  );

  promotionsRouter.get("/", async (c) => {
    const promotions = await promotionsService.listPromotions();
    return c.json(promotions, 200);
  });

  promotionsRouter.get(
    "/:id",
    validateRequest("param", promotionIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<PromotionIdParams>(c, "param");
      const promotion = await promotionsService.getPromotionById(id);

      return c.json(promotion, 200);
    }
  );

  promotionsRouter.post(
    "/",
    validateRequest("json", createPromotionSchema),
    async (c) => {
      const payload = getValidatedData<CreatePromotionPayload>(c, "json");
      const promotion = await promotionsService.createPromotion(payload);

      return c.json(promotion, 201);
    }
  );

  promotionsRouter.patch(
    "/:id",
    validateRequest("param", promotionIdParamsSchema),
    validateRequest("json", updatePromotionSchema),
    async (c) => {
      const { id } = getValidatedData<PromotionIdParams>(c, "param");
      const payload = getValidatedData<UpdatePromotionPayload>(c, "json");
      const promotion = await promotionsService.updatePromotion(id, payload);

      return c.json(promotion, 200);
    }
  );

  promotionsRouter.delete(
    "/:id",
    validateRequest("param", promotionIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<PromotionIdParams>(c, "param");
      await promotionsService.deletePromotion(id);

      return c.body(null, 204);
    }
  );

  return promotionsRouter;
}
