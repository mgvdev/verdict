import type { RuleJson } from "../serializer.js";
import { compareValues, getValueFromPath, self } from "../utils.js";
import type { OperatorInterface, OperatorValue } from "./operator_interace.js";

export function lt(
  left: OperatorValue,
  right: OperatorValue
): OperatorInterface {
  return new Lt(left, right);
}

export class Lt implements OperatorInterface {
  constructor(
    private left: OperatorValue,
    private right: OperatorValue
  ) {}

  compute(context?: object): boolean {
    const resolveValue = (val: unknown) => {
      if (val === self) {
        return context;
      }
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== undefined) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val
        ? (val as OperatorInterface).compute(context)
        : val;
    };

    const leftResult = resolveValue(this.left);
    const rightResult = resolveValue(this.right);

    return compareValues(leftResult, rightResult, "<");
  }

  toJSON(): RuleJson {
    return {
      operator: "lt",
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
