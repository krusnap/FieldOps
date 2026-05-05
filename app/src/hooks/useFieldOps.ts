import { useContext } from "react";
import { FieldOpsContext } from "../context/FieldOpsContext";

export function useFieldOps() {
  const context = useContext(FieldOpsContext);

  if (!context) {
    throw new Error("useFieldOps must be used inside FieldOpsProvider");
  }

  return context;
}
