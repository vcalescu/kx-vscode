/*
 * Copyright (c) 1998-2023 Kx Systems Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import {
  BinaryLiteral,
  ByteLiteral,
  DateLiteral,
  DateTimeLiteral,
  FileLiteral,
  InfinityLiteral,
  MonthLiteral,
  NumberLiteral,
  SymbolLiteral,
  TimeLiteral,
  TimeStampLiteral,
} from "./literals";
import { Identifier, Keyword, Reserved } from "./keywords";
import {
  Colon,
  Command,
  DoubleColon,
  Iterator,
  LineComment,
  Operator,
  SemiColon,
} from "./tokens";
import { TokenType } from "chevrotain";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { Quke, qukeNoDescription, qukeWithDescription } from "./quke";

function _(token: TokenType | RegExp) {
  return ("PATTERN" in token ? `${token.PATTERN}` : `${token}`).slice(1, -1);
}

const includes = [
  {
    include: "#comments",
  },
  {
    include: "#strings",
  },
  {
    include: "#literals",
  },
  {
    include: "#keywords",
  },
  {
    include: "#identifiers",
  },
  {
    include: "#commands",
  },
  {
    include: "#operators",
  },
];

const qdoc = {
  patterns: [
    {
      name: "comment.qdoc",
      begin: "(?:(?<=\\r?\\n|[ \\t])|(?<!.))\\/\\/",
      end: "\\r?\\n",
      patterns: [
        {
          name: "storage.type.qdoc",
          match:
            "@\\b(?:author|category|deprecated|doctest|end|example|fileoverview|kind|name|private|see|subcategory|throws|todo|default-category|default-subcategory|typedef|fileOverview|param|desc|return[s]?|overview)\\b",
        },
        {
          name: "keyword.control.qdoc",
          begin: "{",
          end: "}",
          patterns: [
            {
              name: "entity.name.type.qdoc",
              match:
                "\\b(type|atom|anything|dict|enum|function|hsym|option|string|table|tuple|typedef|vector|bool|boolean|byte|char|character|date|datetime|float|guid|int|integer|long|minute|month|real|second|short|string|symbol|time|timespan|timestamp)\\b",
            },
          ],
        },
        {
          name: "variable.other.qdoc",
          match: "[\\w.]+?(?=\\s*{.+})",
        },
        {
          name: "variable.other.qdoc",
          match: "\\s\\.[\\w.]+?\\s",
        },
      ],
    },
  ],
};

const quke = {
  patterns: [
    {
      begin: _(Quke),
      patterns: [
        ...qukeWithDescription.map((item) => ({
          match: _(item),
          captures: {
            1: {
              name: "support.function.q",
            },
            2: {
              name: "string.quoted.q",
            },
          },
        })),
        ...qukeNoDescription.map((item) => ({
          name: "support.function.q",
          match: _(item),
        })),
        ...includes,
      ],
    },
  ],
};

const BlockComment = [/^\/\s*$/, /^\\\s*$/];
const StringLiteral = [/"/, /\\["\\]/];
const ControlKeyword = /[$!?#@'^]/;

const language = {
  description: "This file is auto generated DO NOT EDIT",
  name: "q",
  scopeName: "source.q",
  patterns: [
    {
      include: "#quke",
    },
    ...includes,
  ],
  repository: {
    comments: {
      patterns: [
        quke,
        qdoc,
        {
          name: "comment.block.q",
          begin: _(BlockComment[0]),
          end: _(BlockComment[1]),
        },
        {
          name: "comment.last.q",
          begin: _(BlockComment[1]),
        },
        {
          include: "#qdoc",
        },
        {
          name: "comment.line.q",
          match: _(LineComment),
        },
      ],
    },
    strings: {
      patterns: [
        {
          name: "string.quoted.q",
          begin: _(StringLiteral[0]),
          end: _(StringLiteral[0]),
          patterns: [
            {
              name: "constant.character.escape.q",
              match: _(StringLiteral[1]),
            },
          ],
        },
      ],
    },
    literals: {
      patterns: [
        {
          name: "support.type.symbol.q",
          match: _(SymbolLiteral),
        },
        {
          name: "constant.numeric.datetime.q",
          match: _(DateTimeLiteral),
        },
        {
          name: "constant.numeric.timestamp.q",
          match: _(TimeStampLiteral),
        },
        {
          name: "constant.numeric.date.q",
          match: _(DateLiteral),
        },
        {
          name: "constant.numeric.month.q",
          match: _(MonthLiteral),
        },
        {
          name: "constant.numeric.time.q",
          match: _(TimeLiteral),
        },
        {
          name: "constant.numeric.file.q",
          match: _(FileLiteral),
        },
        {
          name: "constant.language.infinity.q",
          match: _(InfinityLiteral),
        },
        {
          name: "constant.numeric.binary.q",
          match: _(BinaryLiteral),
        },
        {
          name: "constant.numeric.byte.q",
          match: _(ByteLiteral),
        },
        {
          name: "constant.numeric.number.q",
          match: _(NumberLiteral),
        },
      ],
    },
    keywords: {
      patterns: [
        {
          name: "keyword.other.reserved.q",
          match: `${_(Reserved)}\\b`,
        },
        {
          name: "keyword.other.q",
          match: `\\b${_(Keyword)}\\b`,
        },
      ],
    },
    identifiers: {
      patterns: [
        {
          name: "variable.other.q",
          match: `${_(Identifier)}\\b`,
        },
      ],
    },
    commands: {
      patterns: [
        {
          name: "constant.character.q",
          match: _(Command),
        },
      ],
    },
    operators: {
      patterns: [
        {
          name: "keyword.other.iterator.q",
          match: _(Iterator),
        },
        {
          name: "keyword.other.control.q",
          match: _(ControlKeyword),
        },
        {
          name: "keyword.operator.arithmetic.q",
          match: _(Operator),
        },
        {
          name: "punctuation.assignment.q",
          match: _(Colon),
        },
        {
          name: "punctuation.assignment.q",
          match: _(DoubleColon),
        },
        {
          name: "punctuation.terminator.statement.q",
          match: _(SemiColon),
        },
      ],
    },
  },
};

export function generateTextMateGrammar() {
  const grammar = JSON.stringify(language, null, 2);
  writeFileSync(resolve("syntaxes", "q.tmLanguage.json"), grammar);
  return grammar;
}
