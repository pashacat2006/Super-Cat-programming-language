import Token from "../Token";
import ExpressionNode from "./ExpressionNode";

export default class StringNode extends ExpressionNode {
    value: Token;
    constructor(value: Token) {
        super();
        this.value = value;
    }
}

