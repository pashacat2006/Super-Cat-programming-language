import Token from "../Token";
import ExpressionNode from "./ExpressionNode";

export default class EmojiNode extends ExpressionNode {
    emoji: Token;
    constructor(emoji: Token) {
        super();
        this.emoji = emoji;
    }
}

