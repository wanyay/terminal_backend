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
  /**
   * Logical sort-field aliases presented by the API contract (e.g. AGENTS.md
   * "Timestamp") mapped to real entity column/property names (e.g. "createdAt").
   */
  sortFieldMap?: Record<string, string>;
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
    sortFieldMap = {},
  } = options;

  const page = query.page ?? 1;
  const perPage = query.perPage ?? 20;
  const skip = (page - 1) * perPage;
  let sortField =
    (query.sortBy && sortFieldMap[query.sortBy]) || query.sortBy || defaultSortBy;
  const order: 'ASC' | 'DESC' = query.sortOrder || SortOrder.DESC;

  // Validate the effective sort field against real entity columns so an unknown
  // or client-supplied field does not produce a raw SQL error (or injection).
  const validSortFields = collectValidSortFields(source);
  if (validSortFields.length > 0 && !validSortFields.includes(sortField)) {
    sortField = validSortFields.includes(defaultSortBy)
      ? defaultSortBy
      : (validSortFields[0] ?? 'createdAt');
  }

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

function collectValidSortFields<T extends ObjectLiteral>(
  source: Repository<T> | SelectQueryBuilder<T>,
): string[] {
  let metadata;
  if (source instanceof SelectQueryBuilder) {
    metadata = source.expressionMap.mainAlias?.metadata;
  } else {
    metadata = source.metadata;
  }
  if (!metadata) return [];

  const fields = new Set<string>();
  for (const column of metadata.columns) {
    if (column.propertyName) fields.add(column.propertyName);
    if (column.databaseName) fields.add(column.databaseName);
  }
  return Array.from(fields);
}
