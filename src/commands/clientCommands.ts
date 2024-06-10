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
  EndOfLine,
  ExtensionContext,
  Position,
  ProgressLocation,
  Range,
  Selection,
  WorkspaceEdit,
  commands,
  window,
  workspace,
} from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { ext } from "../extensionVariables";
import { runActiveEditor } from "./workspaceCommand";
import { ExecutionTypes } from "../models/execution";
import crypto from "crypto";
import { InsightsClient, wrapExpressions } from "../utils/qclient";

async function executeBlock(client: LanguageClient) {
  if (ext.activeTextEditor) {
    const range = await client.sendRequest<Range>("kdb.qls.expressionRange", {
      textDocument: { uri: `${ext.activeTextEditor.document.uri}` },
      position: ext.activeTextEditor.selection.active,
    });
    if (range) {
      ext.activeTextEditor.selection = new Selection(
        range.start.line,
        range.start.character,
        range.end.line,
        range.end.character,
      );
      await runActiveEditor(ExecutionTypes.QuerySelection);
    }
  }
}

async function toggleParameterCache(client: LanguageClient) {
  if (ext.activeTextEditor) {
    const doc = ext.activeTextEditor.document;
    const res = await client.sendRequest<{
      params: string[];
      start: Position;
      end: Position;
    }>("kdb.qls.parameterCache", {
      textDocument: { uri: `${doc.uri}` },
      position: ext.activeTextEditor.selection.active,
    });
    if (res) {
      const edit = new WorkspaceEdit();
      const start = new Position(res.start.line, res.start.character);
      const end = new Position(res.end.line, res.end.character);
      const text = doc.getText(new Range(start, end));
      const match =
        /\.axdebug\.temp([A-F0-9]{6}).*?\.axdebug\.temp\1\s*;\s*/s.exec(text);
      if (match) {
        const offset = doc.offsetAt(start);
        edit.delete(
          doc.uri,
          new Range(
            doc.positionAt(offset + match.index),
            doc.positionAt(offset + match.index + match[0].length),
          ),
        );
      } else {
        const hash = crypto.randomBytes(3).toString("hex").toUpperCase();
        const expr1 = `.axdebug.temp${hash}: (${res.params.join(";")});`;
        const expr2 = `${res.params.map((param) => `\`${param}`).join("")} set' .axdebug.temp${hash};`;

        if (start.line === end.line) {
          edit.insert(doc.uri, start, " ");
          edit.insert(doc.uri, start, expr1);
          edit.insert(doc.uri, start, expr2);
        } else {
          const space = ext.activeTextEditor.options.insertSpaces;
          const count = ext.activeTextEditor.options.indentSize as number;
          const eol = doc.eol === EndOfLine.CRLF ? "\r\n" : "\n";
          edit.insert(doc.uri, start, eol);
          edit.insert(doc.uri, start, space ? " ".repeat(count) : "\t");
          edit.insert(doc.uri, start, expr1);
          edit.insert(doc.uri, start, eol);
          edit.insert(doc.uri, start, space ? " ".repeat(count) : "\t");
          edit.insert(doc.uri, start, expr2);
        }
      }
      await workspace.applyEdit(edit);
    }
  }
}

const connection = new InsightsClient("https://fstc83yi5b.ft1.cld.kx.com/");

async function parseExpressions(client: LanguageClient) {
  window.withProgress(
    {
      title: "Executing",
      cancellable: true,
      location: ProgressLocation.Window,
    },
    async (_progress, token) => {
      if (ext.activeTextEditor) {
        const exprs = await client.sendRequest<string[]>(
          "kdb.qls.parseExpressions",
          {
            textDocument: { uri: `${ext.activeTextEditor.document.uri}` },
          },
        );
        const wrapped = wrapExpressions(exprs, true);
        if (!connection.isConnected) {
          await connection.login(token);
          await connection.meta(token);
          await connection.executeData(token);
        }
        const res = await connection.execute(wrapped, token);
        ext.outputChannel.appendLine(JSON.stringify(res, null, 2));
      }
    },
  );
}

//   const client = new QClient("localhost", 5002);
//   await client.connect();
//   try {
//     const res = await client.execute(wrapped);
//     ext.outputChannel.appendLine(JSON.stringify(res));
//   } catch (error) {
//     ext.outputChannel.appendLine(`${error}`);
//   } finally {
//     client.disconnect();
//   }

export function connectClientCommands(
  context: ExtensionContext,
  client: LanguageClient,
) {
  let mutex = false;

  context.subscriptions.push(
    commands.registerCommand("kdb.execute.block", async () => {
      if (!mutex) {
        mutex = true;
        try {
          //await executeBlock(client);
          await parseExpressions(client);
        } finally {
          mutex = false;
        }
      }
    }),
    commands.registerCommand("kdb.toggleParameterCache", async () => {
      if (!mutex) {
        mutex = true;
        try {
          await toggleParameterCache(client);
        } finally {
          mutex = false;
        }
      }
    }),
  );
}
