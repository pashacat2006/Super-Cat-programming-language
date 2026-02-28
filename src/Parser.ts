import BinOperatorNode from "./AST/BinOperatorNode";
import ExpressionNode from "./AST/ExpressionNode";
import { NumberNode } from "./AST/NumberNode";
import StatementsNode from "./AST/StatementsNode";
import { UnarOperatorNode } from "./AST/unarOperatorNode";
import VariableNode from "./AST/VariableNode";
import EmojiNode from "./AST/EmojiNode";
import StringNode from "./AST/StringNode";
import Token from "./Token";
import TokenType, { tokenTypesList } from "./TokenType";

export default class Parser {
    tokens: Token[];
    pos: number = 0;
    scope:  any = {};
    emojiMap: Map<string, string> = new Map([
        ["love", "😍"],
        ["santa", "🎅"],
        ["slipe", "💤"],
        ["angry", "🤬"],
        ["pumpkin", "🎃"],
    ]);
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }
    peek(offset: number = 0): Token | null {
        const idx = this.pos + offset;
        return idx >= 0 && idx < this.tokens.length ? this.tokens[idx] : null;
    }
    match(...expected: TokenType[]): Token | null {
        if (this.pos < this.tokens.length) {
            const currentToken = this.tokens[this.pos];
            if (expected.find(type => type.name === currentToken.type.name)) {
                this.pos += 1;
                return currentToken;
            }
        }
        return null;
    }
    require(...expected: TokenType[]): Token {
        const token = this.match(...expected);
        if (!token) {
            throw new Error(`На позиции ${this.pos} ожидается ${expected[0].name} Error NotToken 3`);
        }
        return token;
    }

    parseVariableOrNuber(): ExpressionNode {
        const str = this.match(tokenTypesList.STRING);
        if (str != null) {
            return new StringNode(str);
        }
        const number = this.match(tokenTypesList.NUMBER);
        if (number != null) {
            return new NumberNode(number);
        }
        const variable = this.match(tokenTypesList.VARIABLE);
        if (variable != null) {
            return new VariableNode(variable);
        }
        throw new Error(`Ожидается переменная или число на позиции ${this.pos} Error ParseVariableOrNumber 2`);
    }
    parsePrint(): ExpressionNode {
        const token = this.match(tokenTypesList.LOG, tokenTypesList.PRINTKEY);
        if (token != null) {
            return new UnarOperatorNode(token, this.parseFormula());
        } 
        throw new Error(`Ожидается оператор вывода на позиции ${this.pos} Error ParsePrint 1`);
    }
    parseAddKey(): ExpressionNode {
        const operator = this.require(tokenTypesList.ADDKEY);
        const keyToken = this.require(tokenTypesList.VARIABLE);
        const emojiToken = this.match(tokenTypesList.EMOJI);
        if (emojiToken != null) {
            return new BinOperatorNode(operator, new VariableNode(keyToken), new EmojiNode(emojiToken));
        }
        const strToken = this.match(tokenTypesList.STRING);
        if (strToken != null) {
            return new BinOperatorNode(operator, new VariableNode(keyToken), new StringNode(strToken));
        }
        const valueToken = this.require(tokenTypesList.VARIABLE);
        return new BinOperatorNode(operator, new VariableNode(keyToken), new VariableNode(valueToken));
    }
    parseParenttheses(): ExpressionNode {
        if (this.match(tokenTypesList.LPAR)) {
            const node = this.parseFormula();
            this.require(tokenTypesList.RPAR);
            return node;
        } else {
            return this.parseVariableOrNuber();
        }
    }
    parseFormula(): ExpressionNode {
        let leftNode = this.parseParenttheses();
        let operator = this.match(tokenTypesList.PLUS, tokenTypesList.MINUS);
        while (operator != null) {
            const rightNode = this.parseParenttheses();
            leftNode = new BinOperatorNode(operator, leftNode, rightNode);
            operator = this.match(tokenTypesList.PLUS, tokenTypesList.MINUS);
        }
        return leftNode;
    }
    parseExpression(): ExpressionNode {
        const next = this.peek();
        if (!next) {
            throw new Error(`На позиции ${this.pos} ожидается выражение Error ParseExpression 0`);
        }

        if (next.type.name === tokenTypesList.VARIABLE.name) {
            const left = this.parseVariableOrNuber();
            const assign = this.match(tokenTypesList.ASSIGN);
            if (assign != null) {
                const rightFormulNode = this.parseFormula();
                return new BinOperatorNode(assign, left, rightFormulNode);
            }
            throw new Error(`После переменной ожидается оператор присваивания на позиции ${this.pos} Error NotOperator -0 4`);
        }

        if (next.type.name === tokenTypesList.ADDKEY.name) {
            return this.parseAddKey();
        }

        return this.parsePrint();
          
    }
    parseCode(): ExpressionNode {
        const root = new StatementsNode();
        while (this.pos < this.tokens.length) {
            const codeStringNode = this.parseExpression();
            this.require(tokenTypesList.START);
            this.require(tokenTypesList.SEMICOLON);
            root.addNode(codeStringNode);
        }
        return root;
    }
    run(node: ExpressionNode): any {
        if(node instanceof NumberNode) {
            return parseInt(node.number.text);
        }
        if (node instanceof StringNode) {
            const raw = node.value.text;
            if (raw.length >= 2 && raw.startsWith("\"") && raw.endsWith("\"")) {
                return raw.slice(1, -1);
            }
            return raw;
        }
        if (node instanceof EmojiNode) {
            return node.emoji.text;
        }
        if(node instanceof UnarOperatorNode) {
            switch(node.operator.type.name) {
                case tokenTypesList.LOG.name:
                    console.log(this.run(node.operand))
                    return; 
                case tokenTypesList.PRINTKEY.name:
                    let emojeKey: string;
                    if (node.operand instanceof VariableNode) {
                        emojeKey = node.operand.variable.text;
                    } else {
                        emojeKey = this.run(node.operand);
                    }
                    const value = this.emojiMap.get(emojeKey);
                    console.log(value ?? emojeKey)
                    return; 
            }
        }
        if (node instanceof BinOperatorNode) {
            switch(node.operator.type.name) {
                case tokenTypesList.PLUS.name:
                    return this.run(node.leftNode) + this.run(node.rightNode)
                case tokenTypesList.MINUS.name:
                    return this.run(node.leftNode) - this.run(node.rightNode)
                case tokenTypesList.ADDKEY.name:
                    const key =
                        node.leftNode instanceof VariableNode
                            ? node.leftNode.variable.text
                            : this.run(node.leftNode);
                    const value =
                        node.rightNode instanceof EmojiNode
                            ? node.rightNode.emoji.text
                            : node.rightNode instanceof StringNode
                                ? this.run(node.rightNode)
                            : node.rightNode instanceof VariableNode
                                ? node.rightNode.variable.text
                                : this.run(node.rightNode);
                    this.emojiMap.set(String(key), String(value));
                    return;
                case tokenTypesList.ASSIGN.name:
                    const result = this.run(node.rightNode)
                    const variableNode = <VariableNode>node.leftNode;
                    this.scope[variableNode.variable.text] = result;
                    return result;
            }
        }
        if (node instanceof VariableNode) {
            // Use existence check so variables with value 0 don't look "missing"
            if (Object.prototype.hasOwnProperty.call(this.scope, node.variable.text)) {
                return this.scope[node.variable.text];
            } else {
                throw new Error(`Переменая ${node.variable.text} не существует Error NotVariable 5`);
            }
        }
        if (node instanceof StatementsNode) {
            node.codeStrings.forEach(codeString => {
                this.run(codeString);
            })
            return;
        }
        throw new Error(`Ошибка? Error ? 0`);
    }
}