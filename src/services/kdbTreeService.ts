import { ServerObject } from "../models/serverObject";
import { ext } from "../extensionVariables";
import { loadServerObjects } from "../commands/serverCommand";
import { LocalConnection } from "../classes/localConnection";

export class KdbTreeService {
  static async loadNamespaces(root?: string): Promise<ServerObject[]> {
    const serverObjects = await loadServerObjects();
    if (serverObjects !== undefined) {
      const ns = serverObjects.filter((value) => {
        return value.isNs ? value : undefined;
      });

      const sorted = KdbTreeService.sortObjects(ns);

      return KdbTreeService.getNamespaces(sorted, root);
    }
    return new Array<ServerObject>();
  }

  static async loadDictionaries(ns: string): Promise<ServerObject[]> {
    const serverObjects = await loadServerObjects();
    if (serverObjects !== undefined) {
      const dicts = serverObjects.filter((value) => {
        return value.typeNum === 99 && !value.isNs && value.namespace === ns
          ? value
          : undefined;
      });
      return KdbTreeService.sortObjects(dicts);
    }
    return new Array<ServerObject>();
  }

  static async loadFunctions(ns: string): Promise<ServerObject[]> {
    const serverObjects = await loadServerObjects();
    if (serverObjects !== undefined) {
      const funcs = serverObjects.filter((value) => {
        return value.typeNum === 100 && !value.isNs && value.namespace === ns
          ? value
          : undefined;
      });
      return KdbTreeService.sortObjects(funcs);
    }
    return new Array<ServerObject>();
  }

  static async loadTables(ns: string): Promise<ServerObject[]> {
    const serverObjects = await loadServerObjects();
    if (serverObjects !== undefined) {
      const tables = serverObjects.filter((value) => {
        return value.typeNum === 98 && !value.isNs && value.namespace === ns
          ? value
          : undefined;
      });
      return KdbTreeService.sortObjects(tables);
    }
    return new Array<ServerObject>();
  }

  static async loadVariables(ns: string): Promise<ServerObject[]> {
    const serverObjects = await loadServerObjects();
    const views = await KdbTreeService.loadViews();

    if (serverObjects !== undefined) {
      const vars = serverObjects.filter((value) => {
        return views.indexOf(value.name) === -1 &&
          value.typeNum < 98 &&
          !value.isNs &&
          value.namespace === ns
          ? value
          : undefined;
      });
      return KdbTreeService.sortObjects(vars);
    }
    return new Array<ServerObject>();
  }

  static async loadViews(): Promise<string[]> {
    if (ext.activeConnection instanceof LocalConnection) {
      const rawViewArray = await ext.activeConnection?.executeQuery("views`");
      const views = rawViewArray?.filter((item: any) => {
        return item !== "s#" && item !== "" && item !== ",";
      });
      const sorted = views?.sort((object1: any, object2: any) => {
        if (object1 < object2) {
          return -1;
        } else if (object1 > object2) {
          return 1;
        }
        return 0;
      });
      return sorted ?? new Array<string>();
    }
    return new Array<string>();
  }

  private static getNamespaces(
    input: ServerObject[],
    root = ".",
  ): ServerObject[] {
    const output: ServerObject[] = [];

    input.forEach((v, i) => {
      let index = -1;
      if (root === v.namespace) {
        index = i;
      }

      if (index != -1) {
        output.push(v);
      }
    });

    return output;
  }

  private static sortObjects(input: ServerObject[]): ServerObject[] {
    const sorted = input.sort((object1, object2) => {
      if (object1.fname < object2.fname) {
        return -1;
      } else if (object1.fname > object2.fname) {
        return 1;
      }
      return 0;
    });
    return sorted;
  }
}
