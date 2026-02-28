import Lexer  from "./Lexer";
import Parser from "./Parser";
const code =
   `cat = 5 + 9 + ( 4 - 6)#;
    print cat#;
    ejprint love#;
    ejprint santa#;
    pasha = cat + 3#;
    print pasha + cat - 6#;
    ejkey cat 😺#;
    ejkey valentine "i love you"#;
    ejprint cat#;
    ejprint valentine#;`

const lexer = new Lexer(code);
lexer.lexAnyl();
const parser = new Parser(lexer.tokenList);
const rootnode = parser.parseCode();
parser.run(rootnode);
