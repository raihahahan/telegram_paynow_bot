import TelegramBot from "node-telegram-bot-api";
import { generateQRCode } from "../qr_code_generator";
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const fs = require("fs");
import { INSTRUCTIONS } from "./resource";
import { isNumeric } from "../../common/utils";
import { deleteGeneratedFiles } from "./utils";
import { STATES } from "../../common/enums";

class PaynowBot {
  private bot;
  private token;

  //#region REGEX
  private numberRegex = /^[89]\d{7}$/;
  private titlePromptRegex = /.*/;
  private doneUsernameRegex = /\/done/;
  private amountPromptRegex = /.*/;
  private usernamePromptRegex = /^@(\S+)/;
  private amountValidRegex = /^\d{1,3}(,\d{3})*(\.\d+)?$/;
  //#endregion

  private memStore = {};

  public constructor() {
    this.token = process.env.TELEGRAM_BOT_KEY ?? "";

    if (!this.token || this.token == "") {
      throw new Error("Token is invalid.");
    }
    this.bot = new TelegramBot(this.token, { polling: true });
  }

  public init() {
    this.sendInstructions();
    this.createList();
    this.cancel();
  }

  private cancel() {
    this.bot.onText(/\/cancel/, (msg) => {
      this.bot.sendMessage(msg.chat.id, "List cancelled.");
      this.clean();
    });
  }

  private sendInstructions() {
    this.bot.onText(/\/start/, (msg) => {
      this.bot.sendMessage(msg.chat.id, INSTRUCTIONS.START);
    });

    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(msg.chat.id, INSTRUCTIONS.START);
    });
  }

  private createList() {
    this.bot.onText(/\/create/, async (msg, match) => {
      const user_id = msg.from.id.toString() + msg.chat.id.toString();

      this.memStore[user_id] = {
        title: "",
        mobile: "",
        amount: "",
        users: [],
        state: STATES.GET_MOBILE,
      };

      await this.bot.sendMessage(
        msg.chat.id,
        "Mobile number to pay to (without the country prefix).\n\nUse /cancel to cancel."
      );

      this.bot.onText(/.*/, async (msgText) => {
        switch (this.memStore[user_id].state) {
          case STATES.GET_MOBILE:
            if (!this.numberRegex.test(msgText.text)) {
              await this.bot.sendMessage(
                msg.chat.id,
                "Please enter a valid number."
              );
            } else {
              this.memStore[user_id].mobile = msgText.text;
              this.memStore[user_id].state = STATES.GET_TITLE;
              await this.bot.sendMessage(
                msg.chat.id,
                "What is this payment for?"
              );
            }
            break;

          case STATES.GET_TITLE:
            this.memStore[user_id].title = msgText.text;
            this.memStore[user_id].state = STATES.GET_USERS;
            await this.bot.sendMessage(
              msg.chat.id,
              "Add usernames one by one with the @ symbol. Names without the symbol will be ignored.\n\n Send /done when done."
            );
            break;

          case STATES.GET_USERS:
            if (this.doneUsernameRegex.test(msgText.text)) {
              await this.bot.sendMessage(
                msg.chat.id,
                "Amount to pay (just input the number) e.g. 20.50"
              );
              this.memStore[user_id].state = STATES.GET_AMOUNT;
            } else if (this.usernamePromptRegex.test(msgText.text)) {
              this.memStore[user_id].users.push(msgText.text);
            }
            break;

          case STATES.GET_AMOUNT:
            if (!this.amountValidRegex.test(msgText.text)) {
              await this.bot.sendMessage(
                msg.chat.id,
                "Please enter a valid amount."
              );
            } else {
              this.memStore[user_id].amount = msgText.text;
              this.memStore[user_id].state = STATES.UNUSE;

              // ====== GENERATE LIST ======
              let messageText = "";
              const { amount, title, mobile, users } = this.memStore[user_id];

              messageText += `Pay $${amount} for ${title} to ${mobile}\n`;
              messageText += users.join("\n");

              this.generateListMessage(msg, mobile, amount, messageText);
            }
            break;

          default:
            break;
        }
      });
    });
  }

  private async generateListMessage(
    msg: any,
    mobile: string,
    amount: string,
    messageText: string
  ) {
    this.bot.sendMessage(msg.chat.id, "Generating list...");

    const imagePath = generateQRCode(mobile, amount);
    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          fs.readFile(imagePath, (err, data) => {
            console.log("Reading file.");
            if (err) {
              console.error(err);
              reject(err);
              return;
            }

            this.bot
              .sendPhoto(msg.chat.id, data, { caption: messageText })
              .then((sent) => {
                console.log("Document sent:", sent);
                resolve("Done");
              })
              .catch((error) => {
                console.error("Error sending document:", error);
                reject(error);
              })
              .finally(() => this.clean());
          });
        }, 1000);
      } catch (error) {
        reject(error);
      } finally {
      }
    });
  }

  private clean() {
    deleteGeneratedFiles();
  }
}

export default PaynowBot;
