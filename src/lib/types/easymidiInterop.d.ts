export declare module "easymidi" {
  interface Input {
    _input: {
      on(msg: "message", cb: Function): void;
      off(msg: "message", cb: Function): void;
      emit(msg: "message", ...data: any[]): void;
    };

    on(evt: "message", handler: (data: any) => void): this;
  }

  interface Output {
    _output: {
      sendMessage(msg: Array<number>): void;
    };
  }
}
