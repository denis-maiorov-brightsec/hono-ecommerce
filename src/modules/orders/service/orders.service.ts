import {
  ApiError,
  CONFLICT_ERROR_CODE,
  NOT_FOUND_ERROR_CODE
} from "../../../common/errors";
import {
  buildPaginatedResponse,
  type PaginatedResponse
} from "../../../common/pagination";

import type { ListOrdersQuery } from "../dto/orders.dto";
import {
  OrdersRepository,
  type OrderRecord
} from "../repository/orders.repository";

const ORDER_NOT_FOUND_MESSAGE = "Order not found";
const ORDER_CANCEL_CONFLICT_MESSAGE = "Only pending orders can be cancelled";

export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async listOrders(
    query: ListOrdersQuery
  ): Promise<PaginatedResponse<OrderRecord>> {
    const filters = {
      status: query.status,
      from: query.from,
      to: query.to
    };

    const [items, total] = await Promise.all([
      this.ordersRepository.findPage(query.offset, query.limit, filters),
      this.ordersRepository.countAll(filters)
    ]);

    return buildPaginatedResponse(items, {
      page: query.page,
      limit: query.limit,
      total
    });
  }

  async getOrderById(id: number): Promise<OrderRecord> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, ORDER_NOT_FOUND_MESSAGE);
    }

    return order;
  }

  async cancelOrderById(id: number): Promise<OrderRecord> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, ORDER_NOT_FOUND_MESSAGE);
    }

    if (order.status !== "pending") {
      throw new ApiError(409, CONFLICT_ERROR_CODE, ORDER_CANCEL_CONFLICT_MESSAGE);
    }

    const cancelledOrder = await this.ordersRepository.cancelPendingById(id);

    if (!cancelledOrder) {
      throw new ApiError(409, CONFLICT_ERROR_CODE, ORDER_CANCEL_CONFLICT_MESSAGE);
    }

    return cancelledOrder;
  }
}
