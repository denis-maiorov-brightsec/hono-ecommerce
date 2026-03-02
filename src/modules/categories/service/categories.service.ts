import { ApiError, CONFLICT_ERROR_CODE, NOT_FOUND_ERROR_CODE } from "../../../common/errors";

import {
  CategoriesRepository,
  type CategoryRecord,
  type CreateCategoryRecord,
  type UpdateCategoryRecord
} from "../repository/categories.repository";

const CATEGORY_NOT_FOUND_MESSAGE = "Category not found";
const CATEGORY_SLUG_CONFLICT_MESSAGE = "Category slug already exists";
const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if ("code" in error && typeof (error as { code?: string }).code === "string") {
    return (error as { code: string }).code;
  }

  if ("cause" in error) {
    return readErrorCode((error as { cause?: unknown }).cause);
  }

  return undefined;
}

function isPostgresUniqueViolation(error: unknown): boolean {
  return readErrorCode(error) === POSTGRES_UNIQUE_VIOLATION_CODE;
}

export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async listCategories(): Promise<CategoryRecord[]> {
    return this.categoriesRepository.findAll();
  }

  async getCategoryById(id: number): Promise<CategoryRecord> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, CATEGORY_NOT_FOUND_MESSAGE);
    }

    return category;
  }

  async createCategory(payload: CreateCategoryRecord): Promise<CategoryRecord> {
    try {
      return await this.categoriesRepository.create(payload);
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ApiError(409, CONFLICT_ERROR_CODE, CATEGORY_SLUG_CONFLICT_MESSAGE);
      }

      throw error;
    }
  }

  async updateCategory(
    id: number,
    payload: UpdateCategoryRecord
  ): Promise<CategoryRecord> {
    try {
      const category = await this.categoriesRepository.updateById(id, payload);

      if (!category) {
        throw new ApiError(404, NOT_FOUND_ERROR_CODE, CATEGORY_NOT_FOUND_MESSAGE);
      }

      return category;
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ApiError(409, CONFLICT_ERROR_CODE, CATEGORY_SLUG_CONFLICT_MESSAGE);
      }

      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    const deleted = await this.categoriesRepository.deleteById(id);

    if (!deleted) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, CATEGORY_NOT_FOUND_MESSAGE);
    }
  }
}
