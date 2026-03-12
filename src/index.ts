import Lexer  from "./Lexer";
import Parser from "./Parser";
import GarbageCollector from "./GarbageCollector";
import StatementsNode from "./AST/StatementsNode";
const code =
   `list nums [ 3 1 4 1 5 9 2 6 ]#;
    sort asc nums#;
    fore nums item [
        print item#;
    ]#;
    ejkey name "Hello my name is pasha"#;
    ejprint name#;`

const lexer = new Lexer(code);
lexer.lexAnyl();
const parser = new Parser(lexer.tokenList);
const rootnode = parser.parseCode();

const gc = new GarbageCollector();
gc.clean(rootnode as StatementsNode);

parser.run(rootnode);
