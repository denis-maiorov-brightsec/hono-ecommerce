import { ApiError, NOT_FOUND_ERROR_CODE } from "../../../common/errors";
import {
  buildPaginatedResponse,
  type PaginatedResponse
} from "../../../common/pagination";

import type { ListOrdersQuery } from "../dto/orders.dto";
import {
  OrdersQueriesRepository,
  type OrderRecord
} from "./orders.queries.repository";

const ORDER_NOT_FOUND_MESSAGE = "Order not found";

export class OrdersQueriesService {
  constructor(private readonly ordersQueriesRepository: OrdersQueriesRepository) {}

  async listOrders(
    query: ListOrdersQuery
  ): Promise<PaginatedResponse<OrderRecord>> {
    const filters = {
      status: query.status,
      from: query.from,
      to: query.to
    };

    const [items, total] = await Promise.all([
      this.ordersQueriesRepository.findPage(query.offset, query.limit, filters),
      this.ordersQueriesRepository.countAll(filters)
    ]);

    return buildPaginatedResponse(items, {
      page: query.page,
      limit: query.limit,
      total
    });
  }

  async getOrderById(id: number): Promise<OrderRecord> {
    const order = await this.ordersQueriesRepository.findById(id);

    if (!order) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, ORDER_NOT_FOUND_MESSAGE);
    }

    return order;
  }
}
