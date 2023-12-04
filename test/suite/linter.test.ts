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

import * as assert from "assert";
import * as sinon from "sinon";
import { lint } from "../../server/src/linter";
import { QParser, analyze } from "../../server/src/parser";

describe("linter", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("ASSIGN_RESERVED_WORD", () => {
    it("should lint assign reseved word", () => {
      const cst = QParser.parse("til:1");
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "ASSIGN_RESERVED_WORD");
    });
  });

  describe("INVALID_ASSIGN", () => {
    it("should lint invalid assign", () => {
      const cst = QParser.parse("123:1");
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "INVALID_ASSIGN");
    });
  });

  describe("DECLARED_AFTER_USE", () => {
    it("should lint invalid assign", () => {
      const cst = QParser.parse("a;a:1;");
      const ast = analyze(cst);
      const results = lint(ast);
      // TODO
      assert.strictEqual(results.length, 0);
      //assert.strictEqual(results[0].name, "DECLARED_AFTER_USE");
    });
  });

  describe("UNUSED_PARAM", () => {
    it("should lint unused param", () => {
      const cst = QParser.parse("{[a]}");
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "UNUSED_PARAM");
    });
  });

  describe("UNUSED_VAR", () => {
    it("should lint unused var", () => {
      const cst = QParser.parse("a:1");
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "UNUSED_VAR");
    });
  });

  describe("LINE_LENGTH", () => {
    it("should lint invalid line length", () => {
      const cst = QParser.parse(
        "123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901\n"
      );
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "LINE_LENGTH");
    });

    it("should not lint valid line length", () => {
      const cst = QParser.parse(
        "12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890\n"
      );
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 0);
    });
  });

  describe("TOO_MANY_CONSTANTS", () => {
    it("should lint too many constants", () => {
      let text = "";
      for (let i = 1; i <= 255; i++) {
        text += `${i} `;
      }
      const cst = QParser.parse(`{${text}}`);
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "TOO_MANY_CONSTANTS");
    });
  });

  describe("DEPRECATED_DATETIME", () => {
    it("should lint datetime", () => {
      const cst = QParser.parse("2000.01.01T12:00:00.000");
      const ast = analyze(cst);
      const results = lint(ast);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "DEPRECATED_DATETIME");
    });
  });
});
