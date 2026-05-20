/**
 * Auth Middleware
 * Protects admin routes by checking for a valid session.
 */

/**
 * Require authenticated session.
 * Redirects to /admin/login if req.session.adminId is not set.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = { requireAuth };
