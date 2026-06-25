import {
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
  FindOptionsWhere,
} from 'typeorm';
import { PaginationQueryDto, SortOrder } from '../dto/pagination-query.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

interface PaginateOptions<T extends ObjectLiteral> {
  source: Repository<T> | SelectQueryBuilder<T>;
  query: PaginationQueryDto;
  searchableFields?: string[];
  defaultSortBy?: string;
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: string[];
}

export async function paginate<T extends ObjectLiteral>(
  options: PaginateOptions<T>,
): Promise<PaginatedResult<T>> {
  const {
    source,
    query,
    searchableFields = [],
    defaultSortBy = 'createdAt',
    where,
    relations,
  } = options;

  const page = query.page ?? 1;
  const perPage = query.perPage ?? 20;
  const skip = (page - 1) * perPage;
  const sortField = query.sortBy || defaultSortBy;
  const order: 'ASC' | 'DESC' = query.sortOrder || SortOrder.DESC;

  let qb: SelectQueryBuilder<T>;

  if (source instanceof SelectQueryBuilder) {
    qb = source;
  } else {
    qb = source.createQueryBuilder('entity');

    if (relations && relations.length > 0) {
      for (const relation of relations) {
        qb.leftJoinAndSelect(`entity.${relation}`, relation);
      }
    }
  }

  // Apply where conditions
  if (where) {
    qb.andWhere(where);
  }

  // Apply search across multiple fields
  if (query.search && searchableFields.length > 0) {
    const searchConditions = searchableFields.map(
      (field) => `entity.${field} LIKE :search`,
    );
    qb.andWhere(`(${searchConditions.join(' OR ')})`, {
      search: `%${query.search}%`,
    });
  }

  // Apply sorting
  qb.orderBy(`entity.${sortField}`, order);

  // Get total count
  const total = await qb.getCount();

  // Apply pagination
  qb.skip(skip).take(perPage);

  const data = await qb.getMany();

  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}
