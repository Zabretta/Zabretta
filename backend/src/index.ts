// backend/src/index.ts
import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

// Проверка обязательных переменных окружения
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Отсутствуют обязательные переменные окружения:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n📝 Создайте файл .env в папке backend на основе .env.example');
  process.exit(1);
}

// Проверка версии Node.js
const nodeVersion = process.version;
const requiredNodeVersion = '18.0.0';

if (parseFloat(nodeVersion.slice(1)) < parseFloat(requiredNodeVersion)) {
  console.error(`❌ Требуется Node.js версии ${requiredNodeVersion} или выше`);
  console.error(`   Текущая версия: ${nodeVersion}`);
  process.exit(1);
}

// Импорт и запуск сервера
import('./server').catch(error => {
  console.error('❌ Ошибка при запуске сервера:', error);
  process.exit(1);
});