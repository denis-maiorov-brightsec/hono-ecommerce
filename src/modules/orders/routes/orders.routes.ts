import { Hono } from "hono";

import {
  getValidatedData,
  validateRequest
} from "../../../common/validation/request-validator";
import {
  listOrdersQuerySchema,
  orderIdParamsSchema,
  type ListOrdersQuery,
  type OrderIdParams
} from "../dto/orders.dto";
import { OrdersRepository } from "../repository/orders.repository";
import { OrdersService } from "../service/orders.service";

export function createOrdersRouter(): Hono {
  const ordersRouter = new Hono();
  const ordersService = new OrdersService(new OrdersRepository());

  ordersRouter.get("/", validateRequest("query", listOrdersQuerySchema), async (c) => {
    const query = getValidatedData<ListOrdersQuery>(c, "query");
    const orders = await ordersService.listOrders(query);

    return c.json(orders, 200);
  });

  ordersRouter.get(
    "/:id",
    validateRequest("param", orderIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<OrderIdParams>(c, "param");
      const order = await ordersService.getOrderById(id);

      return c.json(order, 200);
    }
  );

  return ordersRouter;
}
