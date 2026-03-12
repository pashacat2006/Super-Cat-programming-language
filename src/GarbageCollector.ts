import BinOperatorNode from "./AST/BinOperatorNode";
import EmojiNode from "./AST/EmojiNode";
import ExpressionNode from "./AST/ExpressionNode";
import ForEachNode from "./AST/ForEachNode";
import ListOpNode from "./AST/ListOpNode";
import StatementsNode from "./AST/StatementsNode";
import StringNode from "./AST/StringNode";
import { UnarOperatorNode } from "./AST/unarOperatorNode";
import VariableNode from "./AST/VariableNode";
import { tokenTypesList } from "./TokenType";

export default class GarbageCollector {

    // ─── helpers ───────────────────────────────────────────────────────────────

    private getAssignName(node: ExpressionNode): string | null {
        if (
            node instanceof BinOperatorNode &&
            node.operator.type.name === tokenTypesList.ASSIGN.name &&
            node.leftNode instanceof VariableNode
        ) {
            return node.leftNode.variable.text;
        }
        return null;
    }

    private getListCreateName(node: ExpressionNode): string | null {
        if (
            node instanceof ListOpNode &&
            node.operator.type.name === tokenTypesList.LIST.name
        ) {
            return node.name.text;
        }
        return null;
    }

    private getEjkeyName(node: ExpressionNode): string | null {
        if (
            node instanceof BinOperatorNode &&
            node.operator.type.name === tokenTypesList.ADDKEY.name &&
            node.leftNode instanceof VariableNode
        ) {
            return node.leftNode.variable.text;
        }
        return null;
    }

    // Collect variable reads and ejprint keys from a subtree,
    // skipping the LHS of ASSIGN / ADDKEY (those are writes, not reads).
    private collectReads(
        node: ExpressionNode,
        readVars: Set<string>,
        readKeys: Set<string>,
    ): void {
        if (node instanceof VariableNode) {
            readVars.add(node.variable.text);
            return;
        }
        if (node instanceof NumberNode || node instanceof StringNode || node instanceof EmojiNode) {
            return;
        }
        if (node instanceof UnarOperatorNode) {
            if (node.operator.type.name === tokenTypesList.PRINTKEY.name) {
                // ejprint <key>  →  only a key lookup, not a scope variable read
                if (node.operand instanceof VariableNode) {
                    readKeys.add(node.operand.variable.text);
                } else {
                    this.collectReads(node.operand, readVars, readKeys);
                }
            } else {
                this.collectReads(node.operand, readVars, readKeys);
            }
            return;
        }
        if (node instanceof ListOpNode) {
            const op = node.operator.type.name;
            if (op === tokenTypesList.LIST.name) {
                // list create: name is write target; elements may contain variable reads
                node.args.forEach(a => this.collectReads(a, readVars, readKeys));
            } else {
                // push/pop/getlist: all READ the list variable
                readVars.add(node.name.text);
                node.args.forEach(a => this.collectReads(a, readVars, readKeys));
            }
            return;
        }
        if (node instanceof BinOperatorNode) {
            const op = node.operator.type.name;
            if (op === tokenTypesList.ASSIGN.name || op === tokenTypesList.ADDKEY.name) {
                // LHS is a write target → skip it; only walk the RHS
                this.collectReads(node.rightNode, readVars, readKeys);
            } else {
                this.collectReads(node.leftNode, readVars, readKeys);
                this.collectReads(node.rightNode, readVars, readKeys);
            }
            return;
        }
        if (node instanceof ForEachNode) {
            // fore reads the list variable; itemName is an internal write, skip it
            readVars.add(node.listName.text);
            this.collectReads(node.body, readVars, readKeys);
            return;
        }
        if (node instanceof StatementsNode) {
            node.codeStrings.forEach(s => this.collectReads(s, readVars, readKeys));
        }
    }

    // ─── public API ────────────────────────────────────────────────────────────

    clean(root: StatementsNode): StatementsNode {
        // Iterate until nothing changes (handles chains: unused b → a only used by b → remove a too)
        let changed = true;
        let removedVars: string[] = [];
        let removedKeys: string[] = [];

        while (changed) {
            changed = false;

            const readVars = new Set<string>();
            const readKeys = new Set<string>();
            this.collectReads(root, readVars, readKeys);

            const before = root.codeStrings.length;
            root.codeStrings = root.codeStrings.filter(node => {
                const assignName = this.getAssignName(node);
                if (assignName !== null && !readVars.has(assignName)) {
                    removedVars.push(assignName);
                    return false;
                }
                const listCreateName = this.getListCreateName(node);
                if (listCreateName !== null && !readVars.has(listCreateName)) {
                    removedVars.push(listCreateName);
                    return false;
                }
                const ejkeyName = this.getEjkeyName(node);
                if (ejkeyName !== null && !readKeys.has(ejkeyName)) {
                    removedKeys.push(ejkeyName);
                    return false;
                }
                return true;
            });

            if (root.codeStrings.length < before) changed = true;
        }

        
        return root;
    }
}

// local import needed inside this file
import { NumberNode } from "./AST/NumberNode";
