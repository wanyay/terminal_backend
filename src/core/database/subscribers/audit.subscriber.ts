import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { requestContext } from '@/shared/context/request-context';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<BaseEntity> {
  /**
   * Auto-populate created_by before insert
   */
  beforeInsert(event: InsertEvent<BaseEntity>) {
    if (event.entity instanceof BaseEntity) {
      const userId = requestContext.getUserId();
      if (userId) {
        event.entity.createdBy = userId;
        event.entity.updatedBy = userId;
      }
    }
  }

  /**
   * Auto-populate updated_by before update
   */
  beforeUpdate(event: UpdateEvent<BaseEntity>) {
    if (event.entity instanceof BaseEntity) {
      const userId = requestContext.getUserId();
      if (userId) {
        event.entity.updatedBy = userId;
      }
    }
  }

  /**
   * Auto-populate deleted_by before soft remove
   */
  beforeSoftRemove(event: SoftRemoveEvent<BaseEntity>) {
    if (event.entity instanceof BaseEntity) {
      const userId = requestContext.getUserId();
      if (userId) {
        event.entity.deletedBy = userId;
      }
    }
  }
}
