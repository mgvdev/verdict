import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterace, OperatorValue } from "./operator_interace.js";

export function lte(
  left: OperatorValue,
  right: OperatorValue
): OperatorInterace {
  return new Lte(left, right);
}

export class Lte implements OperatorInterace {
  constructor(
    private left: OperatorValue,
    private right: OperatorValue
  ) {}

  compute(context?: object): boolean {
    const resolveValue = (val: unknown) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== undefined) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val
        ? (val as OperatorInterace).compute(context)
        : val;
    };

    const leftResult = resolveValue(this.left);
    const rightResult = resolveValue(this.right);

    // Type guard for comparison - both operands must be numbers or strings
    if (
      (typeof leftResult === "number" || typeof leftResult === "string") &&
      (typeof rightResult === "number" || typeof rightResult === "string")
    ) {
      return leftResult <= rightResult;
    }

    return false;
  }

  toJSON(): RuleJson {
    return {
      operator: "lte",
      args: [
        typeof this.left === "object" &&
        this.left !== null &&
        "toJSON" in this.left
          ? this.left.toJSON()
          : this.left,
        typeof this.right === "object" &&
        this.right !== null &&
        "toJSON" in this.right
          ? this.right.toJSON()
          : this.right,
      ],
    };
  }
}
