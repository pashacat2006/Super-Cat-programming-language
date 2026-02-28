export default class TokenType {
    name: string;
    regex: string;

    constructor(name: string, regex: string) {
        this.name = name,
        this.regex = regex
    }
}
export const tokenTypesList = {
    "SPACE": new TokenType("SPACE","\\s+"),
    "LOG": new TokenType("LOG","print"),
    "PRINTKEY": new TokenType("PRINTKEY","ejprint"),
    "ADDKEY": new TokenType("ADDKEY","ejkey"),
    "ASSIGN": new TokenType("ASSIGN","="),
    "PLUS": new TokenType("PLUS","\\+"),
    "MINUS": new TokenType("MINUS","-"),
    "LPAR": new TokenType("LPAR","\\("),
    "RPAR": new TokenType("RPAR","\\)"),
    "SEMICOLON": new TokenType("SEMICOLON",";"),
    "STRING": new TokenType("STRING","\\\"[^\\\"]*\\\""),
    // Any UTF-16 surrogate pair (covers most emoji)
    "EMOJI": new TokenType("EMOJI","[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]"),
    "NUMBER": new TokenType("NUMBER","[0-9]+"),
    "VARIABLE": new TokenType("VARIABLE","[a-z]+"),
    "START": new TokenType("START","#"),
}