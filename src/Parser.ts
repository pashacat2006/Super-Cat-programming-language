import BinOperatorNode from "./AST/BinOperatorNode";
import ExpressionNode from "./AST/ExpressionNode";
import ForEachNode from "./AST/ForEachNode";
import ListOpNode from "./AST/ListOpNode";
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
        const emoji = this.match(tokenTypesList.EMOJI);
        if (emoji != null) {
            return new EmojiNode(emoji);
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
    // ── list <name> [ v1 v2 ... ] ─────────────────────────────────────────────
    parseListCreate(): ExpressionNode {
        const operator = this.require(tokenTypesList.LIST);
        const nameToken = this.require(tokenTypesList.VARIABLE);
        this.require(tokenTypesList.LBRACKET);
        const elements: ExpressionNode[] = [];
        while (this.match(tokenTypesList.RBRACKET) == null) {
            elements.push(this.parseVariableOrNuber());
        }
        return new ListOpNode(operator, nameToken, elements);
    }
    // ── push <name> <value> ───────────────────────────────────────────────────
    parseListPush(): ExpressionNode {
        const operator = this.require(tokenTypesList.PUSH);
        const nameToken = this.require(tokenTypesList.VARIABLE);
        const value = this.parseVariableOrNuber();
        return new ListOpNode(operator, nameToken, [value]);
    }
    // ── pop <name> ────────────────────────────────────────────────────────────
    parseListPop(): ExpressionNode {
        const operator = this.require(tokenTypesList.POP);
        const nameToken = this.require(tokenTypesList.VARIABLE);
        return new ListOpNode(operator, nameToken, []);
    }
    // ── getlist <name> <index> ────────────────────────────────────────────────
    parseGetList(): ExpressionNode {
        const operator = this.require(tokenTypesList.GETLIST);
        const nameToken = this.require(tokenTypesList.VARIABLE);
        const index = this.parseVariableOrNuber();
        return new ListOpNode(operator, nameToken, [index]);
    }
    // ── sort asc|desc <name> ──────────────────────────────────────────────────
    parseSortList(): ExpressionNode {
        const operator = this.require(tokenTypesList.SORT);
        const direction = this.match(tokenTypesList.ASC, tokenTypesList.DESC);
        if (!direction) {
            throw new Error(`После sort ожидается asc или desc на позиции ${this.pos}`);
        }
        const nameToken = this.require(tokenTypesList.VARIABLE);
        return new ListOpNode(operator, nameToken, [new VariableNode(direction)]);
    }
    // ── fore <list> <item> [ ...body ] ────────────────────────────────────────
    parseForEach(): ExpressionNode {
        this.require(tokenTypesList.FORE);
        const listName = this.require(tokenTypesList.VARIABLE);
        const itemName = this.require(tokenTypesList.VARIABLE);
        this.require(tokenTypesList.LBRACKET);

        const body = new StatementsNode();
        while (
            this.pos < this.tokens.length &&
            this.peek()?.type.name !== tokenTypesList.RBRACKET.name
        ) {
            body.addNode(this.parseExpression());
            this.require(tokenTypesList.START);
            this.require(tokenTypesList.SEMICOLON);
        }
        this.require(tokenTypesList.RBRACKET);

        return new ForEachNode(listName, itemName, body);
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

        if (next.type.name === tokenTypesList.LIST.name)    return this.parseListCreate();
        if (next.type.name === tokenTypesList.PUSH.name)    return this.parseListPush();
        if (next.type.name === tokenTypesList.POP.name)     return this.parseListPop();
        if (next.type.name === tokenTypesList.GETLIST.name) return this.parseGetList();
        if (next.type.name === tokenTypesList.SORT.name)    return this.parseSortList();
        if (next.type.name === tokenTypesList.FORE.name)    return this.parseForEach();

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
        if (node instanceof ListOpNode) {
            const name = node.name.text;
            switch (node.operator.type.name) {
                case tokenTypesList.LIST.name:
                    this.scope[name] = node.args.map(a => this.run(a));
                    return;
                case tokenTypesList.PUSH.name:
                    if (!Array.isArray(this.scope[name]))
                        throw new Error(`Переменная ${name} не является списком`);
                    this.scope[name].push(this.run(node.args[0]));
                    return;
                case tokenTypesList.POP.name:
                    if (!Array.isArray(this.scope[name]))
                        throw new Error(`Переменная ${name} не является списком`);
                    this.scope[name].pop();
                    return;
                case tokenTypesList.GETLIST.name: {
                    if (!Array.isArray(this.scope[name]))
                        throw new Error(`Переменная ${name} не является списком`);
                    const idx = this.run(node.args[0]);
                    const item = this.scope[name][idx];
                    console.log(item !== undefined ? item : `undefined (index ${idx})`);
                    return;
                }
                case tokenTypesList.SORT.name: {
                    if (!Array.isArray(this.scope[name]))
                        throw new Error(`Переменная ${name} не является списком`);
                    const dirNode = node.args[0];
                    const dir = dirNode instanceof VariableNode
                        ? (dirNode as VariableNode).variable.text
                        : "asc";
                    this.scope[name].sort((a: any, b: any) => {
                        const na = typeof a === "number" ? a : Number(a);
                        const nb = typeof b === "number" ? b : Number(b);
                        return dir === "desc" ? nb - na : na - nb;
                    });
                    return;
                }
            }
        }
        if (node instanceof ForEachNode) {
            const list = this.scope[node.listName.text];
            if (!Array.isArray(list))
                throw new Error(`Переменная ${node.listName.text} не является списком`);
            for (const item of list) {
                this.scope[node.itemName.text] = item;
                this.run(node.body);
            }
            delete this.scope[node.itemName.text];
            return;
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