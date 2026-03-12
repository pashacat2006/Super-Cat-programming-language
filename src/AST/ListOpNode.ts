import Token from "../Token";
import ExpressionNode from "./ExpressionNode";

/**
 * Covers all list operations:
 *   LIST    — list <name> [ ...elements ]  (create)
 *   PUSH    — push <name> <value>          (append)
 *   POP     — pop  <name>                  (remove last)
 *   GETLIST — getlist <name> <index>       (print element at index)
 */
export default class ListOpNode extends ExpressionNode {
    operator: Token;
    name: Token;
    args: ExpressionNode[];

    constructor(operator: Token, name: Token, args: ExpressionNode[]) {
        super();
        this.operator = operator;
        this.name = name;
        this.args = args;
    }
}
