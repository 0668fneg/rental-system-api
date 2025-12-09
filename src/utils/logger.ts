
import pino from "pino";

// 1.定義環境檢查
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// 2. 處理開發環境的 transport 配置 (惰性創建)
const developmentTransport = {
    target: "pino-pretty",
    options: { 
        colorize: true,          
        translateTime: "SYS:standard", 
        ignore: 'pid,hostname',    
    },
};

// 初始化並導出 logger 實例
export const logger = pino({
    level: process.env.LOG_LEVEL || 'debug', 
    transport: IS_DEVELOPMENT ? developmentTransport : undefined,
});