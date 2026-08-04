import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_DB_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateV1(db);
  }
}

async function migrateV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`

    CREATE TABLE IF NOT EXISTS users (
      id              VARCHAR(36) PRIMARY KEY,
      name            VARCHAR(100) NOT NULL,
      username        VARCHAR(50) NOT NULL UNIQUE,
      password        VARCHAR(255) NOT NULL,
      role            VARCHAR(20) NOT NULL,
      last_login      DATETIME,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by      VARCHAR(36),
      updated_at      DATETIME,
      updated_by      VARCHAR(36),
      deleted_at      DATETIME,
      is_deleted      BOOLEAN DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS categories (
      id                  VARCHAR(36) PRIMARY KEY,
      code                VARCHAR(20) UNIQUE,
      name                VARCHAR(100) NOT NULL,
      transaction_type    VARCHAR(10) NOT NULL,
      icon                VARCHAR(100),
      color               VARCHAR(20),
      is_active           BOOLEAN DEFAULT 1,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by          VARCHAR(36),
      updated_at          DATETIME,
      updated_by          VARCHAR(36),
      deleted_at          DATETIME,
      is_deleted          BOOLEAN DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code);
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(transaction_type);

    CREATE TABLE IF NOT EXISTS items (
      id              VARCHAR(36) PRIMARY KEY,
      code            VARCHAR(20) UNIQUE,
      barcode         VARCHAR(50),
      name            VARCHAR(100) NOT NULL,
      category        VARCHAR(100),
      purchase_price  DECIMAL(15,2) DEFAULT 0,
      selling_price   DECIMAL(15,2) DEFAULT 0,
      stock           INTEGER DEFAULT 0,
      minimum_stock   INTEGER DEFAULT 0,
      unit            VARCHAR(20) DEFAULT 'pcs',
      photo           VARCHAR(255),
      description     TEXT,
      is_active       BOOLEAN DEFAULT 1,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by      VARCHAR(36),
      updated_at      DATETIME,
      updated_by      VARCHAR(36),
      deleted_at      DATETIME,
      is_deleted      BOOLEAN DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);
    CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

    CREATE TABLE IF NOT EXISTS cash (
      id                  VARCHAR(36) PRIMARY KEY,
      cash_name           VARCHAR(100),
      opening_balance     DECIMAL(15,2) DEFAULT 0,
      current_balance     DECIMAL(15,2) DEFAULT 0,
      total_income        DECIMAL(15,2) DEFAULT 0,
      total_expense       DECIMAL(15,2) DEFAULT 0,
      last_transaction    DATETIME,
      updated_at          DATETIME
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id                  VARCHAR(36) PRIMARY KEY,
      transaction_no      VARCHAR(30) UNIQUE,
      transaction_date    DATETIME NOT NULL,
      transaction_type    VARCHAR(10) NOT NULL,
      category_id         VARCHAR(36) NOT NULL,
      cash_id             VARCHAR(36) NOT NULL,
      item_id             VARCHAR(36),
      quantity            INTEGER DEFAULT 0,
      unit_price          DECIMAL(15,2) DEFAULT 0,
      nominal             DECIMAL(15,2) NOT NULL,
      payment_method      VARCHAR(20) DEFAULT 'Cash',
      reference_number    VARCHAR(50),
      attachment          VARCHAR(255),
      description         TEXT,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by          VARCHAR(36),
      updated_at          DATETIME,
      updated_by          VARCHAR(36),
      deleted_at          DATETIME,
      is_deleted          BOOLEAN DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (cash_id) REFERENCES cash(id),
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_item ON transactions(item_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_no ON transactions(transaction_no);

    CREATE TABLE IF NOT EXISTS stock_movements (
      id              VARCHAR(36) PRIMARY KEY,
      item_id         VARCHAR(36) NOT NULL,
      transaction_id  VARCHAR(36),
      movement_type   VARCHAR(10) NOT NULL,
      quantity        INTEGER NOT NULL,
      stock_before    INTEGER NOT NULL,
      stock_after     INTEGER NOT NULL,
      description     TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_transaction ON stock_movements(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

  `);

  await seedDefaultData(db);

  await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION}`);
}

async function seedDefaultData(db: SQLiteDatabase): Promise<void> {
  const hashedPassword = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    'admin123'
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO users (id, name, username, password, role, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['USR-admin', 'Administrator', 'admin', hashedPassword, 'admin', 'system']
  );

  const categories = [
    ['CAT-penjualan',  'CAT-IN-001',  'Penjualan',      'IN',  'cart',         '#22C55E'],
    ['CAT-donasi',     'CAT-IN-002',  'Donasi',          'IN',  'heart',        '#EC4899'],
    ['CAT-modal',      'CAT-IN-003',  'Modal',           'IN',  'wallet',       '#3B82F6'],
    ['CAT-belanja',    'CAT-OUT-001', 'Belanja Barang',  'OUT', 'shopping-bag', '#F97316'],
    ['CAT-listrik',    'CAT-OUT-002', 'Listrik',         'OUT', 'zap',          '#EAB308'],
    ['CAT-air',        'CAT-OUT-003', 'Air',             'OUT', 'droplet',      '#06B6D4'],
    ['CAT-peralatan',  'CAT-OUT-004', 'Peralatan',       'OUT', 'tool',         '#8B5CF6'],
  ];

  for (const cat of categories) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, code, name, transaction_type, icon, color, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [...cat, 'system']
    );
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO cash (id, cash_name, opening_balance, current_balance, total_income, total_expense)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['CSH-utama', 'Kas Utama', 0, 0, 0, 0]
  );
}
