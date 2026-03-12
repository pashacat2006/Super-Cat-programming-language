import Token from "../Token";
import ExpressionNode from "./ExpressionNode";
import StatementsNode from "./StatementsNode";

/**
 * fore <list> <item> [ ...body ]
 *
 * Iterates over every element of <list>,
 * binding the current element to <item> on each iteration.
 */
export default class ForEachNode extends ExpressionNode {
    listName: Token;
    itemName: Token;
    body: StatementsNode;

    constructor(listName: Token, itemName: Token, body: StatementsNode) {
        super();
        this.listName = listName;
        this.itemName = itemName;
        this.body = body;
    }
}
