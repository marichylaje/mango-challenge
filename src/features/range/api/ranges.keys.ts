export const rangesKeys = {
  all: ["ranges"] as const,
  list: () => [...rangesKeys.all, "list"] as const,
};
