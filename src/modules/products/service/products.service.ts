import { ApiError, NOT_FOUND_ERROR_CODE } from "../../../common/errors";

import {
  ProductsRepository,
  type CreateProductRecord,
  type ProductRecord,
  type UpdateProductRecord
} from "../repository/products.repository";

const PRODUCT_NOT_FOUND_MESSAGE = "Product not found";

export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async listProducts(): Promise<ProductRecord[]> {
    return this.productsRepository.findAll();
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
