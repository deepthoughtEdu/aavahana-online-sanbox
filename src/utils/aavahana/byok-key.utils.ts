import type { ByokApiKey } from "@/types/admin/byok.types";

export function isServerByokKeyUsableForAavahanaAi(key: ByokApiKey): boolean {
  return (
    key.isActive &&
    key.provider !== "serper" &&
    Boolean(key.model) &&
    (key.ownershipType === "individual" ||
      (key.ownershipType === "org" && key.allowEmployeeUse))
  );
}
