"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = exports.aiRoutes = exports.userRoutes = exports.activityRoutes = exports.balanceRoutes = exports.settlementRoutes = exports.expenseRoutes = exports.groupRoutes = exports.authRoutes = void 0;
var auth_js_1 = require("./auth.js");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(auth_js_1).default; } });
var groups_js_1 = require("./groups.js");
Object.defineProperty(exports, "groupRoutes", { enumerable: true, get: function () { return __importDefault(groups_js_1).default; } });
var expenses_js_1 = require("./expenses.js");
Object.defineProperty(exports, "expenseRoutes", { enumerable: true, get: function () { return __importDefault(expenses_js_1).default; } });
var settlements_js_1 = require("./settlements.js");
Object.defineProperty(exports, "settlementRoutes", { enumerable: true, get: function () { return __importDefault(settlements_js_1).default; } });
var balances_js_1 = require("./balances.js");
Object.defineProperty(exports, "balanceRoutes", { enumerable: true, get: function () { return __importDefault(balances_js_1).default; } });
var activity_js_1 = require("./activity.js");
Object.defineProperty(exports, "activityRoutes", { enumerable: true, get: function () { return __importDefault(activity_js_1).default; } });
var users_js_1 = require("./users.js");
Object.defineProperty(exports, "userRoutes", { enumerable: true, get: function () { return __importDefault(users_js_1).default; } });
var ai_js_1 = require("./ai.js");
Object.defineProperty(exports, "aiRoutes", { enumerable: true, get: function () { return __importDefault(ai_js_1).default; } });
var analytics_js_1 = require("./analytics.js");
Object.defineProperty(exports, "analyticsRoutes", { enumerable: true, get: function () { return __importDefault(analytics_js_1).default; } });
//# sourceMappingURL=index.js.map