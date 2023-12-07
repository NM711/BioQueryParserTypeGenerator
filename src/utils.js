"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTypeName = void 0;
function formatTypeName(str) {
    const splitName = str.toLowerCase().trim().split(/[_-]/g);
    let name = "";
    for (const n of splitName) {
        name += n.charAt(0).toUpperCase() + n.slice(1);
    }
    return name;
}
exports.formatTypeName = formatTypeName;
