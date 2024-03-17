import TelegramBot from "node-telegram-bot-api";
import { generateQRCode } from "../qr_code_generator";
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const fs = require("fs");
import { INSTRUCTIONS } from "./resource";
import { isNumeric } from "../../common/utils";
import { deleteGeneratedFiles } from "./utils";

class PaynowBot {
  private bot;
  private token;
  private numberRegex = /^[89]\d{7}$/;
  private titlePromptRegex = /.*/;
  private doneUsernameRegex = /\/done/;
  private amountPromptRegex = /.*/;
  private usernamePromptRegex = /^@(\S+)/;

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
    this.bot.onText(/\/create/, (msg, match) => {
      this.clean();
      const usernames = [];
      let title = "";
      let amount = "";
      let mobile = "";

      // ====== GET MOBIlE ======
      this.bot.sendMessage(msg.chat.id, "Mobile number to pay to");
      this.bot.onText(this.numberRegex, (msg) => {
        mobile = msg.text;
        this.bot.removeTextListener(this.numberRegex);

        // ====== GET TITLE ======

        this.bot.sendMessage(msg.chat.id, "What is the payment for?");
        this.bot.onText(this.titlePromptRegex, (msg) => {
          title = msg.text;
          this.bot.removeTextListener(this.titlePromptRegex);

          // ====== GET USERNAMES ======

          this.bot.sendMessage(
            msg.chat.id,
            "Add usernames one by one with the @ symbol. Send /done when done."
          );

          this.bot.onText(this.usernamePromptRegex, (msg) => {
            usernames.push(msg.text);
          });

          // ====== GET AMOUNT ======

          this.bot.onText(this.doneUsernameRegex, (msg) => {
            this.bot.removeTextListener(this.usernamePromptRegex);
            this.bot.sendMessage(
              msg.chat.id,
              "Amount to pay (just input the number) e.g. 20.50"
            );

            this.bot.onText(this.amountPromptRegex, (msg) => {
              const numericReg = /^\d+(\.\d+)?$/;
              if (!numericReg.test(msg.text)) {
                this.bot.sendMessage("Please enter a valid amount");
              } else {
                amount = msg.text;
                this.bot.removeTextListener(this.doneUsernameRegex);
                this.bot.removeTextListener(this.amountPromptRegex);
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
    this.bot.removeTextListener(this.numberRegex);
    this.bot.removeTextListener(this.titlePromptRegex);
    this.bot.removeTextListener(this.usernamePromptRegex);
    this.bot.removeTextListener(this.doneUsernameRegex);
    this.bot.removeTextListener(this.amountPromptRegex);
  }
}

export default PaynowBot;
