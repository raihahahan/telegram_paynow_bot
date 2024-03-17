import TelegramBot from "node-telegram-bot-api";
import { generateQRCode } from "../qr_code_generator";
require("dotenv").config();
const fs = require("fs");
import { INSTRUCTIONS } from "./resource";
import { isNumeric } from "../../common/utils";
import { deleteGeneratedFiles } from "./utils";

class PaynowBot {
  private bot;
  private token;

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
    this.bot.onText(/\/create/, (msg, match) => {
      const usernames = [];
      let title = "";
      let amount = "";
      let mobile = "";

      // ====== GET MOBIlE ======
      this.bot.sendMessage(msg.chat.id, "Mobile number to pay to");
      const numberRegex = /^[89]\d{7}$/;
      this.bot.onText(numberRegex, (msg) => {
        mobile = msg.text;
        this.bot.removeTextListener(numberRegex);

        // ====== GET TITLE ======
        const titlePromptRegex = /.*/;
        this.bot.sendMessage(msg.chat.id, "What is the payment for?");
        this.bot.onText(titlePromptRegex, (msg) => {
          title = msg.text;
          this.bot.removeTextListener(titlePromptRegex);

          // ====== GET USERNAMES ======
          const usernamePromptRegex = /^@(\S+)/;
          this.bot.sendMessage(
            msg.chat.id,
            "Add usernames one by one with the @ symbol. Send /done when done."
          );

          this.bot.onText(usernamePromptRegex, (msg) => {
            usernames.push(msg.text);
          });

          // ====== GET AMOUNT ======
          const doneUsernameRegex = /\/done/;
          this.bot.onText(doneUsernameRegex, (msg) => {
            this.bot.removeTextListener(usernamePromptRegex);
            this.bot.sendMessage(
              msg.chat.id,
              "Amount to pay (just input the number) e.g. 20.50"
            );
            const amountPromptRegex = /.*/;
            this.bot.onText(amountPromptRegex, (msg) => {
              const numericReg = /^\d+(\.\d+)?$/;
              if (!numericReg.test(msg.text)) {
                this.bot.sendMessage("Please enter a valid amount");
              } else {
                amount = msg.text;
                this.bot.removeTextListener(doneUsernameRegex);
                this.bot.removeTextListener(amountPromptRegex);
                let messageText = "";
                messageText += `Pay $${amount} for ${title} to ${mobile}\n`;
                messageText += usernames.join("\n");

                this.generateListMessage(msg, mobile, amount, messageText);
              }
            });
          });
        });
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

            this.bot.sendMessage(msg.chat.id, messageText);

            this.bot
              .sendPhoto(
                msg.chat.id,
                data,
                {},
                {
                  filename: "qr.jpg", // Set the filename
                  contentType: "image/jpeg",
                }
              )
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
