import Dexie, { type Table } from 'dexie';
import { Transaction, Category, Account } from '../types';

export interface SyncQueueItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'TRANSACTION' | 'CATEGORY';
  payload: any;
  timestamp: number;
}

export class ZenithLocalDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  accounts!: Table<Account, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('ZenithFinanceOfflineDB');
    this.version(1).stores({
      transactions: 'id, type, date, categoryId, accountId, synced',
      categories: 'id, name, type',
      accounts: 'id, name, type',
      syncQueue: '++id, action, entity, timestamp',
    });
  }
}

export const localDb = new ZenithLocalDatabase();
