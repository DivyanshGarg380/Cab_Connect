import User from "../model/User.js";

const banMiddleware = async (req, res, next) => {
    const user = await User.findById(req.userId);

    if(!user){
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const now = new Date();

    // temporary ban active
    if(user.banUntil && user.banUntil > now){
        return res.status(403).json({
            message: 'You are temporarily banned',
        });
    }
    
    // permanent ban
    if(user.isPermanentyBanned){
        return res.status(403).json({
            message: 'You are permanently banned from this action',
        })
    };
    next();
}

export default banMiddleware;