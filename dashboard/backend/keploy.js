"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTests = getAllTests;
exports.getTestById = getTestById;
exports.rerunTest = rerunTest;
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
var js_yaml_1 = __importDefault(require("js-yaml"));
var child_process_1 = require("child_process");
var TESTS_DIR = path_1.default.resolve(__dirname, process.env.KEPLOY_TESTS_PATH || '');
function getAllTests() {
    return __awaiter(this, void 0, void 0, function () {
        var files, yamlFiles;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promises_1.default.readdir(TESTS_DIR)];
                case 1:
                    files = _a.sent();
                    console.log("Reading test files from:", TESTS_DIR);
                    yamlFiles = files.filter(function (file) {
                        return file.endsWith('.yaml') || file.endsWith('.yml');
                    });
                    return [2 /*return*/, Promise.all(yamlFiles.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var raw, data, status;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, promises_1.default.readFile(path_1.default.join(TESTS_DIR, file), 'utf-8')];
                                    case 1:
                                        raw = _c.sent();
                                        try {
                                            data = js_yaml_1.default.load(raw);
                                        }
                                        catch (err) {
                                            console.error("\u274C Failed to parse YAML file: ".concat(file), err);
                                            return [2 /*return*/, null];
                                        }
                                        status = 'pending';
                                        if ((data === null || data === void 0 ? void 0 : data.status) === 1 || (data === null || data === void 0 ? void 0 : data.status) === 'pass')
                                            status = 'passed';
                                        else if ((data === null || data === void 0 ? void 0 : data.status) === 0 || (data === null || data === void 0 ? void 0 : data.status) === 'fail')
                                            status = 'failed';
                                        return [2 /*return*/, {
                                                id: file.replace('.yaml', ''),
                                                route: ((_a = data === null || data === void 0 ? void 0 : data.req) === null || _a === void 0 ? void 0 : _a.url) || '',
                                                method: ((_b = data === null || data === void 0 ? void 0 : data.req) === null || _b === void 0 ? void 0 : _b.method) || '',
                                                status: status,
                                            }];
                                }
                            });
                        }); })).then(function (results) { return results.filter(Boolean); })];
            }
        });
    });
}
function getTestById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, raw;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = path_1.default.join(TESTS_DIR, "".concat(id, ".yaml"));
                    return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf-8')];
                case 1:
                    raw = _a.sent();
                    return [2 /*return*/, js_yaml_1.default.load(raw)];
            }
        });
    });
}
function rerunTest(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    (0, child_process_1.exec)("keploy test --id ".concat(id), function (err, stdout, stderr) {
                        if (err)
                            return reject(stderr);
                        resolve(stdout);
                    });
                })];
        });
    });
}
