// RLS middleware to set Postgres session variables for Row-Level Security
const rlsMiddleware = (req, res, next) => {
  // After auth middleware has set req.user, we need to make this available
  // to database connections. For now, we'll just attach it to the request.
  // In a production setup, you would set Postgres session variables like:
  // SET app.current_user_id = 123;
  // SET app.current_user_role = 'admin';
  
  if (req.user) {
    req.dbContext = {
      userId: req.user.id,
      userRole: req.user.role
    };
  }
  
  next();
};

module.exports = rlsMiddleware;
