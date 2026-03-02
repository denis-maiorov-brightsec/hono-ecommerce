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
import { OrdersCommandsRepository } from "../commands/orders.commands.repository";
import { OrdersCommandsService } from "../commands/orders.commands.service";
import { OrdersQueriesRepository } from "../queries/orders.queries.repository";
import { OrdersQueriesService } from "../queries/orders.queries.service";

export function createOrdersRouter(): Hono {
  const ordersRouter = new Hono();
  const ordersQueriesService = new OrdersQueriesService(
    new OrdersQueriesRepository()
  );
  const ordersCommandsService = new OrdersCommandsService(
    new OrdersCommandsRepository()
  );

  ordersRouter.get("/", validateRequest("query", listOrdersQuerySchema), async (c) => {
    const query = getValidatedData<ListOrdersQuery>(c, "query");
    const orders = await ordersQueriesService.listOrders(query);

    return c.json(orders, 200);
  });

  ordersRouter.post(
    "/:id/cancel",
    validateRequest("param", orderIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<OrderIdParams>(c, "param");
      const order = await ordersCommandsService.cancelOrderById(id);

      return c.json(order, 200);
    }
  );

  ordersRouter.get(
    "/:id",
    validateRequest("param", orderIdParamsSchema),
    async (c) => {
      const { id } = getValidatedData<OrderIdParams>(c, "param");
      const order = await ordersQueriesService.getOrderById(id);

      return c.json(order, 200);
    }
  );

  return ordersRouter;
}
