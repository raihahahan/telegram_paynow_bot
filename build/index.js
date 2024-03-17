"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = __importDefault(require("./features/bot"));
require("dotenv").config();
console.log("hello world");
console.log(process.env.TELEGRAM_BOT_KEY);
bot_1.default;
