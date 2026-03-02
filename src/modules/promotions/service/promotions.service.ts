import {
  ApiError,
  CONFLICT_ERROR_CODE,
  NOT_FOUND_ERROR_CODE,
  ValidationError
} from "../../../common/errors";

import {
  PromotionsRepository,
  type CreatePromotionRecord,
  type PromotionRecord,
  type UpdatePromotionRecord
} from "../repository/promotions.repository";

const PROMOTION_NOT_FOUND_MESSAGE = "Promotion not found";
const PROMOTION_CODE_CONFLICT_MESSAGE = "Promotion code already exists";
const INVALID_DATE_WINDOW_MESSAGE = "startsAt must be less than or equal to endsAt";
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

function ensureValidDateWindow(startsAt: Date | null, endsAt: Date | null): void {
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new ValidationError([
      {
        field: "startsAt",
        constraints: [INVALID_DATE_WINDOW_MESSAGE]
      }
    ]);
  }
}

export class PromotionsService {
  constructor(private readonly promotionsRepository: PromotionsRepository) {}

  async listPromotions(): Promise<PromotionRecord[]> {
    return this.promotionsRepository.findAll();
  }

  async getPromotionById(id: number): Promise<PromotionRecord> {
    const promotion = await this.promotionsRepository.findById(id);

    if (!promotion) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, PROMOTION_NOT_FOUND_MESSAGE);
    }

    return promotion;
  }

  async createPromotion(payload: CreatePromotionRecord): Promise<PromotionRecord> {
    try {
      return await this.promotionsRepository.create(payload);
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ApiError(409, CONFLICT_ERROR_CODE, PROMOTION_CODE_CONFLICT_MESSAGE);
      }

      throw error;
    }
  }

  async updatePromotion(
    id: number,
    payload: UpdatePromotionRecord
  ): Promise<PromotionRecord> {
    const existingPromotion = await this.promotionsRepository.findById(id);

    if (!existingPromotion) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, PROMOTION_NOT_FOUND_MESSAGE);
    }

    const nextStartsAt =
      payload.startsAt === undefined ? existingPromotion.startsAt : payload.startsAt;
    const nextEndsAt =
      payload.endsAt === undefined ? existingPromotion.endsAt : payload.endsAt;
    ensureValidDateWindow(nextStartsAt, nextEndsAt);

    try {
      const updatedPromotion = await this.promotionsRepository.updateById(id, payload);

      if (!updatedPromotion) {
        throw new ApiError(404, NOT_FOUND_ERROR_CODE, PROMOTION_NOT_FOUND_MESSAGE);
      }

      return updatedPromotion;
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ApiError(409, CONFLICT_ERROR_CODE, PROMOTION_CODE_CONFLICT_MESSAGE);
      }

      throw error;
    }
  }

  async deletePromotion(id: number): Promise<void> {
    const deleted = await this.promotionsRepository.deleteById(id);

    if (!deleted) {
      throw new ApiError(404, NOT_FOUND_ERROR_CODE, PROMOTION_NOT_FOUND_MESSAGE);
    }
  }
}
