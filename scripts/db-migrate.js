#!/usr/bin/env node

/**
 * 数据库迁移脚本（NextChat 本地版本）
 * 使用方式：yarn db:migrate
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 从环境变量读取数据库配置
const DB_CONFIG = {
  host: process.env.SUPABASE_DB_HOST || '47.101.205.3',
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'zc5rcwsLfaG7CxMX',
  database: process.env.SUPABASE_DB_NAME || 'lumichat',
};

async function ensureDatabaseExists() {
  const adminConfig = { ...DB_CONFIG, database: 'postgres' };
  const adminClient = new Client(adminConfig);
  try {
    await adminClient.connect();
    const dbName = DB_CONFIG.database;
    const res = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (res.rowCount === 0) {
      console.log(`📦 数据库 ${dbName} 不存在，正在创建...`);
      await adminClient.query(`CREATE DATABASE ${dbName};`);
      console.log(`✅ 数据库 ${dbName} 创建成功`);
    }
  } catch (error) {
    console.error('创建数据库失败：', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}

async function runMigration() {
  // 确保数据库存在
  await ensureDatabaseExists();

  const client = new Client(DB_CONFIG);

  try {
    console.log('🔌 连接到数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 读取迁移文件（相对 NextChat/scripts 路径）
    const migrationFile = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    console.log(`📄 读取迁移文件: ${migrationFile}`);

    if (!fs.existsSync(migrationFile)) {
      throw new Error('迁移文件不存在');
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('🚀 开始执行迁移...\n');

    // 执行 SQL
    await client.query(sql);

    console.log('✅ 迁移执行成功！\n');

    // 验证表创建
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 已创建的表：');
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n🎉 数据库初始化完成！');

  } catch (error) {
    console.error('❌ 迁移失败：', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 运行迁移
runMigration();