import {
  ApiError,
  CONFLICT_ERROR_CODE,
  NOT_FOUND_ERROR_CODE
} from "../../../common/errors";

import {
  OrdersCommandsRepository,
  type OrderRecord
} from "./orders.commands.repository";

const ORDER_NOT_FOUND_MESSAGE = "Order not found";
const ORDER_CANCEL_CONFLICT_MESSAGE = "Only pending orders can be cancelled";

export class OrdersCommandsService {
  constructor(private readonly ordersCommandsRepository: OrdersCommandsRepository) {}

  async cancelOrderById(id: number): Promise<OrderRecord> {
    const order = await this.ordersCommandsRepository.findById(id);

    if (!order) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, ORDER_NOT_FOUND_MESSAGE);
    }

    if (order.status !== "pending") {
      throw new ApiError(409, CONFLICT_ERROR_CODE, ORDER_CANCEL_CONFLICT_MESSAGE);
    }

    const cancelledOrder = await this.ordersCommandsRepository.cancelPendingById(id);

    if (!cancelledOrder) {
      throw new ApiError(409, CONFLICT_ERROR_CODE, ORDER_CANCEL_CONFLICT_MESSAGE);
    }

    return cancelledOrder;
  }
}
