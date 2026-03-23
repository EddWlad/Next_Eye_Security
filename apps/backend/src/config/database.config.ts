import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function databaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', '127.0.0.1'),
    port: configService.get<number>('DB_PORT', 5435),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_DATABASE', 'nexteye_security'),
    autoLoadEntities: true,
    synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
    logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
  };
}
