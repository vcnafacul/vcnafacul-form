type TokenType = 'Number' | 'Variable' | 'Operator' | 'LParen' | 'RParen';

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) {
      i++;
      continue;
    }
    if (/\d/.test(expr[i]) || (expr[i] === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let num = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        num += expr[i++];
      }
      tokens.push({ type: 'Number', value: num });
      continue;
    }
    if (expr[i] === 'Q') {
      let variable = 'Q';
      i++;
      while (i < expr.length && /\d/.test(expr[i])) {
        variable += expr[i++];
      }
      if (variable === 'Q') throw new Error(`Token inválido na posição ${i - 1}`);
      tokens.push({ type: 'Variable', value: variable });
      continue;
    }
    if ('+-*/'.includes(expr[i])) {
      tokens.push({ type: 'Operator', value: expr[i++] });
      continue;
    }
    if (expr[i] === '(') {
      tokens.push({ type: 'LParen', value: '(' });
      i++;
      continue;
    }
    if (expr[i] === ')') {
      tokens.push({ type: 'RParen', value: ')' });
      i++;
      continue;
    }
    throw new Error(`Token inválido: '${expr[i]}' na posição ${i}`);
  }
  return tokens;
}

// Recursive descent parser: expr → term ((+|-) term)*
//                           term → factor ((*|/) factor)*
//                           factor → Number | Variable | '(' expr ')'

function parseExpr(tokens: Token[], pos: { i: number }): number {
  let left = parseTerm(tokens, pos);
  while (pos.i < tokens.length && (tokens[pos.i].value === '+' || tokens[pos.i].value === '-')) {
    const op = tokens[pos.i++].value;
    const right = parseTerm(tokens, pos);
    left = op === '+' ? left + right : left - right;
  }
  return left;
}

function parseTerm(tokens: Token[], pos: { i: number }): number {
  let left = parseFactor(tokens, pos);
  while (pos.i < tokens.length && (tokens[pos.i].value === '*' || tokens[pos.i].value === '/')) {
    const op = tokens[pos.i++].value;
    const right = parseFactor(tokens, pos);
    left = op === '*' ? left * right : left / right;
  }
  return left;
}

function parseFactor(tokens: Token[], pos: { i: number }): number {
  if (pos.i >= tokens.length) throw new Error('Expressão incompleta');
  const token = tokens[pos.i];
  if (token.type === 'Number') {
    pos.i++;
    return parseFloat(token.value);
  }
  if (token.type === 'Variable') {
    pos.i++;
    // value is already substituted in the variables map during evaluate
    return parseFloat(token.value);
  }
  if (token.type === 'LParen') {
    pos.i++;
    const result = parseExpr(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i].type !== 'RParen') {
      throw new Error('Parêntese não fechado');
    }
    pos.i++;
    return result;
  }
  throw new Error(`Token inesperado: '${token.value}'`);
}

export function evaluate(expr: string, variables: Record<string, number>): number {
  const tokens = tokenize(expr);

  // Substitute variables with their numeric values
  const resolved = tokens.map((t) => {
    if (t.type === 'Variable') {
      if (!(t.value in variables)) {
        throw new Error(`Variável não declarada: ${t.value}`);
      }
      return { type: 'Number' as TokenType, value: String(variables[t.value]) };
    }
    return t;
  });

  const pos = { i: 0 };
  const result = parseExpr(resolved, pos);
  if (pos.i < resolved.length) {
    throw new Error('Expressão contém tokens extras após o fim');
  }
  return result;
}
