import redisClient from "../config/redis.js";

export const cache = (keyBuilder, ttl = 60) => {
    return async (req, resizeBy, next) => {
        try{
            const key = typeof keyBuilder === "function" ? keyBuilder(req) : keyBuilder;
            const cached = await redisClient.get(key);
            if(cached) {
                return res.status(200).json(JSON.parse(cached));
            }

            const originalJson = res.json.bind(res);
            res.json = async (body) => {
                await redisClient.setEx(key, ttl, JSON.stringify(body));
                return originalJson(body);
            };

            next();
        }catch(err){
            console.log("Redis Middleware Error");
            next(); // if redis fails -> API stills works
        }
    }
}