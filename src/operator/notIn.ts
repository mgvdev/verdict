import type { RuleJson } from "../serializer.js";
import { getValueFromPath, self } from "../utils.js";
import type { OperatorInterface, OperatorValue } from "./operator_interace.js";

export function notIn(
  value: OperatorValue,
  list: Array<unknown>
): OperatorInterface {
  return new NotInOperator(value, list);
}

export class NotInOperator implements OperatorInterface {
  constructor(
    private value: OperatorValue,
    private list: Array<unknown>
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

    const resolvedValue = resolveValue(this.value);

    if (!Array.isArray(this.list)) {
      return true; // If it's not a list, the value is not 'in' it.
    }

    return !this.list.includes(resolvedValue);
  }

  toJSON(): RuleJson {
    return {
      operator: "notIn",
      args: [
        typeof this.value === "object" &&
        this.value !== null &&
        "toJSON" in this.value
          ? this.value.toJSON()
          : this.value,
        this.list,
      ],
    };
  }
}
