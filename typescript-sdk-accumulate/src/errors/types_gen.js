var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Status } from "./enums_gen.js";
import { encodeAs } from "../encoding/index.js";
export class CallSite {
    constructor(args) {
        this.funcName = args.funcName == undefined ? undefined : args.funcName;
        this.file = args.file == undefined ? undefined : args.file;
        this.line = args.line == undefined ? undefined : args.line;
    }
    copy() {
        return new CallSite(this.asObject());
    }
    asObject() {
        return {
            funcName: this.funcName && this.funcName,
            file: this.file && this.file,
            line: this.line && this.line,
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], CallSite.prototype, "funcName", void 0);
__decorate([
    (encodeAs.field(2).string)
], CallSite.prototype, "file", void 0);
__decorate([
    (encodeAs.field(3).int)
], CallSite.prototype, "line", void 0);
export class Error {
    constructor(args) {
        this.message = args.message == undefined ? undefined : args.message;
        this.code = args.code == undefined ? undefined : Status.fromObject(args.code);
        this.cause =
            args.cause == undefined
                ? undefined
                : args.cause instanceof Error
                    ? args.cause
                    : new Error(args.cause);
        this.callStack =
            args.callStack == undefined
                ? undefined
                : args.callStack.map((v) => (v instanceof CallSite ? v : new CallSite(v)));
    }
    copy() {
        return new Error(this.asObject());
    }
    asObject() {
        return {
            message: this.message && this.message,
            code: this.code && Status.getName(this.code),
            cause: this.cause && this.cause.asObject(),
            callStack: this.callStack && this.callStack?.map((v) => v.asObject()),
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], Error.prototype, "message", void 0);
__decorate([
    (encodeAs.field(2).enum)
], Error.prototype, "code", void 0);
__decorate([
    (encodeAs.field(3).reference)
], Error.prototype, "cause", void 0);
__decorate([
    (encodeAs.field(4).repeatable.reference)
], Error.prototype, "callStack", void 0);
//# sourceMappingURL=types_gen.js.map