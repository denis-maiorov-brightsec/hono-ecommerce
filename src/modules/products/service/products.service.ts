import { ApiError, NOT_FOUND_ERROR_CODE } from "../../../common/errors";
import {
  buildPaginatedResponse,
  type PaginatedResponse
} from "../../../common/pagination";

import type { ListProductsQuery } from "../dto/list-products.dto";
import {
  ProductsRepository,
  type CreateProductRecord,
  type ProductRecord,
  type UpdateProductRecord
} from "../repository/products.repository";

const PRODUCT_NOT_FOUND_MESSAGE = "Product not found";

export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async listProducts(
    pagination: ListProductsQuery
  ): Promise<PaginatedResponse<ProductRecord>> {
    const [items, total] = await Promise.all([
      this.productsRepository.findPage(pagination.offset, pagination.limit),
      this.productsRepository.countAll()
    ]);

    return buildPaginatedResponse(items, {
      page: pagination.page,
      limit: pagination.limit,
      total
    });
  }

  async getProductById(id: number): Promise<ProductRecord> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, PRODUCT_NOT_FOUND_MESSAGE);
    }

    return product;
  }

  async createProduct(payload: CreateProductRecord): Promise<ProductRecord> {
    return this.productsRepository.create(payload);
  }

  async searchProducts(query: string): Promise<ProductRecord[]> {
    return this.productsRepository.searchByQuery(query);
  }

  async updateProduct(
    id: number,
    payload: UpdateProductRecord
  ): Promise<ProductRecord> {
    const product = await this.productsRepository.updateById(id, payload);

    if (!product) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, PRODUCT_NOT_FOUND_MESSAGE);
    }

    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    const deleted = await this.productsRepository.deleteById(id);

    if (!deleted) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, PRODUCT_NOT_FOUND_MESSAGE);
    }
  }
}
