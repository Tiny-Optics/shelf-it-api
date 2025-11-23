const MainFunctions = require("../controller-main");

/**
 * Ensures the request comes from a RISMI user (UserType === "Rismi" and isRismiUser true).
 * Wraps existing handlers so we can reuse Main controller logic without duplication.
 *
 * @param {(req,res)=>Promise<void>} handler
 * @returns {(req,res)=>Promise<void>}
 */
const ensureRismiUser = (handler) => {
   return async (Request, Response) => {
      const User = Request.user;

      const isValidRismiUser =
         User &&
         User.UserActive === true &&
         typeof User.UserType === "string" &&
         User.UserType.toUpperCase() === "RISMI" &&
         User.isRismiUser === true;

      if (!isValidRismiUser) {
         return Response.status(403).json({
            Success: false,
            Reason: "Access denied. RISMI account required for this endpoint.",
         });
      }

      return handler(Request, Response);
   };
};

exports.GetPredictiveAnalytics = ensureRismiUser(MainFunctions.GetPredictiveAnalytics);
exports.GetTopStoresByActivity = ensureRismiUser(MainFunctions.GetTopStoresByActivity);
exports.GetTopProductsByState = ensureRismiUser(MainFunctions.GetTopProductsByState);
exports.GetTopProductsByActivity = ensureRismiUser(MainFunctions.GetTopProductsByActivity);
exports.GetSlowMovingProducts = ensureRismiUser(MainFunctions.GetSlowMovingProducts);
exports.GetStateComparisonReport = ensureRismiUser(MainFunctions.GetStateComparisonReport);
