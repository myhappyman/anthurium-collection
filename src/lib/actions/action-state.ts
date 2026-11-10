export type ActionState =
  | {
      status: "idle";
      message: null;
    }
  | {
      status: "error";
      message: string;
    };

export const INITIAL_ACTION_STATE: ActionState = {
  status: "idle",
  message: null,
};
