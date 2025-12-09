
import type { MiddlewareHandler } from "hono";
import { logger } from "../utils/logger"; 
import { randomUUID } from 'crypto';

export const requestLogger: MiddlewareHandler = async (c, next) => {
    const start = Date.now();
    
    // 1. 生成 Request ID (用於追蹤單個請求)
    const requestId = randomUUID();
    c.set('requestId', requestId); // 將 ID 存入 Hono Context

    try {
        await next(); // 執行後續的控制器和業務邏輯
        
        const duration = Date.now() - start;
        const status = c.res.status;

        // 2. 錯誤日誌 (Status >= 400)
        if (status >= 400) {
            // 嘗試獲取錯誤響應體
            const responseBody = c.res.ok ? undefined : await c.res.clone().json().catch(() => ({}));

            logger.error({ // 記錄 ERROR 級別
                id: requestId,
                method: c.req.method,
                path: c.req.path,
                status: status,
                responseBody: responseBody,
                duration: `${duration}ms`,
            });
        } 
        
        // 3. 成功日誌 (Status < 400)
        else {
            logger.debug({ // 記錄 DEBUG 級別
                id: requestId,
                method: c.req.method,
                path: c.req.path,
                status: status,
                duration: `${duration}ms`,
            });
        }

    } catch (error) {
        // 捕獲未處理的異常 (例如 500 Internal Server Error)
        const duration = Date.now() - start;
        logger.fatal({ // 記錄為 FATAL 級別 (最高級別錯誤)
            id: requestId,
            method: c.req.method,
            path: c.req.path,
            duration: `${duration}ms`,
            errorMessage: error instanceof Error ? error.message : "Unknown server error",
        });
        throw error; // 重新拋出讓 Hono 處理標準 500 響應
    }
};