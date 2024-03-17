"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
require("dotenv").config();
var Bot = new node_telegram_bot_api_1.default((_a = process.env.TELEGRAM_BOT_KEY) !== null && _a !== void 0 ? _a : "", {
    polling: true,
});
Bot.onText(/\/pay/, function (msg, match) {
    console.log("pay");
});
exports.default = Bot;
