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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSMTP = void 0;
const net_1 = __importDefault(require("net"));
const output_1 = require("../output/output");
const errorCodes_1 = require("./errorCodes");
const log = (...args) => {
    if (process.env.DEBUG === 'true') {
        console.log(...args);
    }
};
exports.checkSMTP = (sender, recipient, exchange) => __awaiter(void 0, void 0, void 0, function* () {
    const timeout = 1000 * 10; // 10 seconds
    return new Promise(r => {
        let receivedData = false;
        const socket = net_1.default.createConnection(25, exchange);
        socket.setEncoding('ascii');
        socket.setTimeout(timeout);
        socket.on('error', error => {
            log('error', error);
            socket.emit('fail', error);
        });
        socket.on('close', hadError => {
            if (!receivedData && !hadError) {
                socket.emit('fail', 'Mail server closed connection without sending any data.');
            }
        });
        socket.on('fail', msg => {
            r(output_1.createOutput('smtp', msg));
            if (socket.writable && !socket.destroyed) {
                socket.write(`quit\r\n`);
                socket.end();
                socket.destroy();
            }
        });
        socket.on('success', () => {
            if (socket.writable && !socket.destroyed) {
                socket.write(`quit\r\n`);
                socket.end();
                socket.destroy();
            }
            r(output_1.createOutput());
        });
        const commands = [
            `helo ${exchange}\r\n`,
            `mail from: <${sender}>\r\n`,
            `rcpt to: <${recipient}>\r\n`,
        ];
        let i = 0;
        socket.on('next', () => {
            if (i < 3) {
                if (socket.writable) {
                    socket.write(commands[i++]);
                }
                else {
                    socket.emit('fail', 'SMTP communication unexpectedly closed.');
                }
            }
            else {
                socket.emit('success');
            }
        });
        socket.on('timeout', () => {
            socket.emit('fail', 'Timeout');
        });
        socket.on('connect', () => {
            socket.on('data', msg => {
                receivedData = true;
                log('data', msg);
                if (errorCodes_1.hasCode(msg, 220) || errorCodes_1.hasCode(msg, 250)) {
                    socket.emit('next', msg);
                }
                else if (errorCodes_1.hasCode(msg, 550)) {
                    socket.emit('fail', 'Mailbox not found.');
                }
                else {
                    const [code] = Object.typedKeys(errorCodes_1.ErrorCodes).filter(x => errorCodes_1.hasCode(msg, x));
                    socket.emit('fail', errorCodes_1.ErrorCodes[code] || 'Unrecognized SMTP response.');
                }
            });
        });
    });
});
//# sourceMappingURL=smtp.js.map