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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const regex_1 = require("./regex/regex");
const typo_1 = require("./typo/typo");
const dns_1 = require("./dns/dns");
const smtp_1 = require("./smtp/smtp");
const disposable_1 = require("./disposable/disposable");
const options_1 = require("./options/options");
const output_1 = require("./output/output");
require("./types");
function validate(emailOrOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = options_1.getOptions(emailOrOptions);
        const email = options.email;
        if (options.validateRegex) {
            const regexResponse = regex_1.isEmail(email);
            if (regexResponse)
                return output_1.createOutput('regex', regexResponse);
        }
        if (options.validateTypo) {
            const typoResponse = yield typo_1.checkTypo(email);
            if (typoResponse)
                return output_1.createOutput('typo', typoResponse);
        }
        const domain = email.split('@')[1];
        if (options.validateDisposable) {
            const disposableResponse = yield disposable_1.checkDisposable(domain);
            if (disposableResponse)
                return output_1.createOutput('disposable', disposableResponse);
        }
        if (options.validateMx) {
            const mx = yield dns_1.getBestMx(domain);
            if (!mx)
                return output_1.createOutput('mx', 'MX record not found');
            if (mx.exchange.includes('localhost'))
                return output_1.createOutput('mx', 'MX localhost');
            if (options.validateSMTP) {
                return smtp_1.checkSMTP(options.sender, email, mx.exchange);
            }
        }
        return output_1.createOutput();
    });
}
exports.validate = validate;
exports.default = validate;
//# sourceMappingURL=index.js.map