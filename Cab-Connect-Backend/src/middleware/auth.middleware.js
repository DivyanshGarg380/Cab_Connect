import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {

    try{
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }

        if(!token){
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.userId = decoded.userId;
        req.user = decoded;
        next();

    }catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};

export default authMiddleware;